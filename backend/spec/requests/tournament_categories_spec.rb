require 'rails_helper'

RSpec.describe "TournamentCategories API", type: :request do
  # -------------------------------------------------------
  # ヘルパー
  # -------------------------------------------------------
  def create_and_login_admin(email: "admin@example.com", password: "password123", name: "Test Admin")
    post "/signup", params: { email: email, password: password, name: name }
    expect(response).to have_http_status(:created)
    post "/login", params: { email: email, password: password }
    expect(response).to have_http_status(:ok)
  end

  def create_tournament(title: "春季大会")
    post "/tournaments", params: { tournament: { title: title } }
    expect(response).to have_http_status(:created)
    JSON.parse(response.body)["id"]
  end

  # format_type ごとの最小有効パラメータセット
  # age_type は任意のため、デフォルトでは含めない
  def base_params(format_type:, overrides: {})
    common = {
      gender_type: "men",
      event_type:  "singles",
      rank:        "A"
      # age_type は任意なので省略可能
    }

    format_specific =
      case format_type
      when "elimination"
        { format_type: "elimination", max_participants: 16 }
      when "league"
        { format_type: "league", group_size: 4 }
      when "league_to_tournament"
        { format_type: "league_to_tournament", group_size: 4, advance_count: 2, max_participants: 8 }
      end

    { tournament_category: common.merge(format_specific).merge(overrides) }
  end

  # -------------------------------------------------------
  # GET /tournaments/:tournament_id/tournament_categories
  # -------------------------------------------------------
  describe "GET /tournaments/:tournament_id/tournament_categories" do
    context "ログイン済みの場合" do
      before do
        create_and_login_admin
        @tournament_id = create_tournament
      end

      it "空のリストが返る（カテゴリ未登録）" do
        get "/tournaments/#{@tournament_id}/tournament_categories"
        expect(response).to have_http_status(:ok)
        expect(JSON.parse(response.body)).to eq([])
      end

      it "登録済みカテゴリの一覧が返る" do
        post "/tournaments/#{@tournament_id}/tournament_categories",
             params: base_params(format_type: "elimination")
        post "/tournaments/#{@tournament_id}/tournament_categories",
             params: base_params(format_type: "league")

        get "/tournaments/#{@tournament_id}/tournament_categories"
        expect(response).to have_http_status(:ok)
        expect(JSON.parse(response.body).length).to eq(2)
      end

      it "他のAdminのトーナメントのカテゴリは取得できない（404）" do
        create_and_login_admin(email: "other@example.com", password: "password123", name: "Other")
        other_id = create_tournament(title: "他のAdminの大会")

        post "/login", params: { email: "admin@example.com", password: "password123" }
        get "/tournaments/#{other_id}/tournament_categories"
        expect(response).to have_http_status(:not_found)
      end
    end

    context "未ログインの場合" do
      it "401 Unauthorized が返る" do
        get "/tournaments/1/tournament_categories"
        expect(response).to have_http_status(:unauthorized)
      end
    end
  end

  # -------------------------------------------------------
  # POST /tournaments/:tournament_id/tournament_categories
  # -------------------------------------------------------
  describe "POST /tournaments/:tournament_id/tournament_categories" do
    context "未ログインの場合" do
      it "401 Unauthorized が返る" do
        post "/tournaments/1/tournament_categories",
             params: base_params(format_type: "elimination")
        expect(response).to have_http_status(:unauthorized)
      end
    end

    context "ログイン済みの場合" do
      before do
        create_and_login_admin
        @tournament_id = create_tournament
      end

      # ---------------------------------------------------
      # 認証・権限まわり
      # ---------------------------------------------------
      context "権限チェック" do
        it "存在しないトーナメントIDは404が返る" do
          post "/tournaments/99999/tournament_categories",
               params: base_params(format_type: "elimination")
          expect(response).to have_http_status(:not_found)
          expect(JSON.parse(response.body)["error"]).to eq("Tournament not found")
        end

        it "他のAdminのトーナメントには登録できない（404）" do
          create_and_login_admin(email: "other@example.com", password: "password123", name: "Other")
          other_id = create_tournament(title: "他のAdminの大会")

          post "/login", params: { email: "admin@example.com", password: "password123" }
          post "/tournaments/#{other_id}/tournament_categories",
               params: base_params(format_type: "elimination")
          expect(response).to have_http_status(:not_found)
        end
      end

      # ---------------------------------------------------
      # format_type: elimination（単純トーナメント）
      # ---------------------------------------------------
      context "format_type: elimination" do
        it "有効なパラメータで作成できる" do
          expect {
            post "/tournaments/#{@tournament_id}/tournament_categories",
                 params: base_params(format_type: "elimination")
          }.to change(TournamentCategory, :count).by(1)

          expect(response).to have_http_status(:created)
          json = JSON.parse(response.body)
          expect(json["format_type"]).to eq("elimination")
          expect(json["gender_type"]).to eq("men")
          expect(json["event_type"]).to eq("singles")
          expect(json["rank"]).to eq("A")
          expect(json["max_participants"]).to eq(16)
          expect(json["tournament_id"]).to eq(@tournament_id)
        end

        it "age_type を指定した場合、その値が保存される" do
          post "/tournaments/#{@tournament_id}/tournament_categories",
               params: base_params(format_type: "elimination", overrides: { age_type: "一般" })
          expect(response).to have_http_status(:created)
          expect(JSON.parse(response.body)["age_type"]).to eq("一般")
        end

        it "max_participants が 1 の場合は422（2以上必須）" do
          post "/tournaments/#{@tournament_id}/tournament_categories",
               params: base_params(format_type: "elimination", overrides: { max_participants: 1 })
          expect(response).to have_http_status(:unprocessable_entity)
          expect(JSON.parse(response.body)["errors"]).to be_present
        end

        it "max_participants がない場合は422" do
          post "/tournaments/#{@tournament_id}/tournament_categories",
               params: base_params(format_type: "elimination", overrides: { max_participants: nil })
          expect(response).to have_http_status(:unprocessable_entity)
        end

        it "group_size は不要（指定しなくてもOK）" do
          post "/tournaments/#{@tournament_id}/tournament_categories",
               params: base_params(format_type: "elimination")
          expect(response).to have_http_status(:created)
          expect(JSON.parse(response.body)["group_size"]).to be_nil
        end

        it "advance_count は不要（指定しなくてもOK）" do
          post "/tournaments/#{@tournament_id}/tournament_categories",
               params: base_params(format_type: "elimination")
          expect(response).to have_http_status(:created)
          expect(JSON.parse(response.body)["advance_count"]).to be_nil
        end
      end

      # ---------------------------------------------------
      # format_type: league（リーグ戦）
      # ---------------------------------------------------
      context "format_type: league" do
        it "有効なパラメータで作成できる" do
          expect {
            post "/tournaments/#{@tournament_id}/tournament_categories",
                 params: base_params(format_type: "league")
          }.to change(TournamentCategory, :count).by(1)

          expect(response).to have_http_status(:created)
          json = JSON.parse(response.body)
          expect(json["format_type"]).to eq("league")
          expect(json["group_size"]).to eq(4)
        end

        it "group_size がない場合は422" do
          post "/tournaments/#{@tournament_id}/tournament_categories",
               params: base_params(format_type: "league", overrides: { group_size: nil })
          expect(response).to have_http_status(:unprocessable_entity)
        end

        it "group_size が 0 の場合は422（1以上必須）" do
          post "/tournaments/#{@tournament_id}/tournament_categories",
               params: base_params(format_type: "league", overrides: { group_size: 0 })
          expect(response).to have_http_status(:unprocessable_entity)
        end

        it "max_participants は不要（指定しなくてもOK）" do
          post "/tournaments/#{@tournament_id}/tournament_categories",
               params: base_params(format_type: "league")
          expect(response).to have_http_status(:created)
          expect(JSON.parse(response.body)["max_participants"]).to be_nil
        end

        it "advance_count は不要（指定しなくてもOK）" do
          post "/tournaments/#{@tournament_id}/tournament_categories",
               params: base_params(format_type: "league")
          expect(response).to have_http_status(:created)
          expect(JSON.parse(response.body)["advance_count"]).to be_nil
        end
      end

      # ---------------------------------------------------
      # format_type: league_to_tournament（予選リーグ＋本戦）
      # ---------------------------------------------------
      context "format_type: league_to_tournament" do
        it "有効なパラメータで作成できる" do
          expect {
            post "/tournaments/#{@tournament_id}/tournament_categories",
                 params: base_params(format_type: "league_to_tournament")
          }.to change(TournamentCategory, :count).by(1)

          expect(response).to have_http_status(:created)
          json = JSON.parse(response.body)
          expect(json["format_type"]).to eq("league_to_tournament")
          expect(json["group_size"]).to eq(4)
          expect(json["advance_count"]).to eq(2)
          expect(json["max_participants"]).to eq(8)
        end

        it "group_size がない場合は422" do
          post "/tournaments/#{@tournament_id}/tournament_categories",
               params: base_params(format_type: "league_to_tournament", overrides: { group_size: nil })
          expect(response).to have_http_status(:unprocessable_entity)
        end

        it "advance_count がない場合は422" do
          post "/tournaments/#{@tournament_id}/tournament_categories",
               params: base_params(format_type: "league_to_tournament", overrides: { advance_count: nil })
          expect(response).to have_http_status(:unprocessable_entity)
        end

        it "advance_count が 0 の場合は422（1以上必須）" do
          post "/tournaments/#{@tournament_id}/tournament_categories",
               params: base_params(format_type: "league_to_tournament", overrides: { advance_count: 0 })
          expect(response).to have_http_status(:unprocessable_entity)
        end

        it "max_participants がない場合は422" do
          post "/tournaments/#{@tournament_id}/tournament_categories",
               params: base_params(format_type: "league_to_tournament", overrides: { max_participants: nil })
          expect(response).to have_http_status(:unprocessable_entity)
        end

        it "max_participants が 1 の場合は422（2以上必須）" do
          post "/tournaments/#{@tournament_id}/tournament_categories",
               params: base_params(format_type: "league_to_tournament", overrides: { max_participants: 1 })
          expect(response).to have_http_status(:unprocessable_entity)
        end
      end

      # ---------------------------------------------------
      # 共通の必須フィールド（format_type に関わらず）
      # ---------------------------------------------------
      context "共通バリデーション" do
        it "gender_type がない場合は422" do
          post "/tournaments/#{@tournament_id}/tournament_categories",
               params: base_params(format_type: "elimination", overrides: { gender_type: nil })
          expect(response).to have_http_status(:unprocessable_entity)
        end

        it "event_type がない場合は422" do
          post "/tournaments/#{@tournament_id}/tournament_categories",
               params: base_params(format_type: "elimination", overrides: { event_type: nil })
          expect(response).to have_http_status(:unprocessable_entity)
        end

        it "format_type がない場合は422" do
          post "/tournaments/#{@tournament_id}/tournament_categories",
               params: base_params(format_type: "elimination", overrides: { format_type: nil })
          expect(response).to have_http_status(:unprocessable_entity)
        end

        it "rank がない場合は422" do
          post "/tournaments/#{@tournament_id}/tournament_categories",
               params: base_params(format_type: "elimination", overrides: { rank: nil })
          expect(response).to have_http_status(:unprocessable_entity)
        end

        it "不正な gender_type の値は422" do
          post "/tournaments/#{@tournament_id}/tournament_categories",
               params: base_params(format_type: "elimination", overrides: { gender_type: "invalid_value" })
          expect(response).to have_http_status(:unprocessable_entity)
        end

        it "不正な event_type の値は422" do
          post "/tournaments/#{@tournament_id}/tournament_categories",
               params: base_params(format_type: "elimination", overrides: { event_type: "invalid_value" })
          expect(response).to have_http_status(:unprocessable_entity)
        end

        it "不正な format_type の値は422" do
          post "/tournaments/#{@tournament_id}/tournament_categories",
               params: base_params(format_type: "elimination", overrides: { format_type: "invalid_value" })
          expect(response).to have_http_status(:unprocessable_entity)
        end
      end

      # ---------------------------------------------------
      # age_type は任意（省略・nil・空文字すべてOK）
      # ---------------------------------------------------
      context "age_type は任意" do
        it "age_type を省略しても作成できる（201）" do
          post "/tournaments/#{@tournament_id}/tournament_categories",
               params: base_params(format_type: "elimination")
          expect(response).to have_http_status(:created)
        end

        it "age_type が nil でも作成できる（201）" do
          post "/tournaments/#{@tournament_id}/tournament_categories",
               params: base_params(format_type: "elimination", overrides: { age_type: nil })
          expect(response).to have_http_status(:created)
        end

        it "age_type が空文字でも作成できる（201）" do
          post "/tournaments/#{@tournament_id}/tournament_categories",
               params: base_params(format_type: "elimination", overrides: { age_type: "" })
          expect(response).to have_http_status(:created)
        end

        it "age_type に値を設定した場合はその値が保存される" do
          post "/tournaments/#{@tournament_id}/tournament_categories",
               params: base_params(format_type: "league", overrides: { age_type: "シニア" })
          expect(response).to have_http_status(:created)
          expect(JSON.parse(response.body)["age_type"]).to eq("シニア")
        end
      end

      # ---------------------------------------------------
      # gender_type の全パターン
      # ---------------------------------------------------
      context "gender_type の全パターン" do
        %w[men women mixed].each do |gender|
          it "gender_type: #{gender} で作成できる" do
            post "/tournaments/#{@tournament_id}/tournament_categories",
                 params: base_params(format_type: "elimination", overrides: { gender_type: gender })
            expect(response).to have_http_status(:created)
            expect(JSON.parse(response.body)["gender_type"]).to eq(gender)
          end
        end
      end

      # ---------------------------------------------------
      # event_type の全パターン
      # ---------------------------------------------------
      context "event_type の全パターン" do
        %w[singles doubles mixed_doubles].each do |event|
          it "event_type: #{event} で作成できる" do
            post "/tournaments/#{@tournament_id}/tournament_categories",
                 params: base_params(format_type: "elimination", overrides: { event_type: event })
            expect(response).to have_http_status(:created)
            expect(JSON.parse(response.body)["event_type"]).to eq(event)
          end
        end
      end

      # ---------------------------------------------------
      # オプションフィールド
      # ---------------------------------------------------
      context "オプションフィールド" do
        it "has_third_place: true を指定できる" do
          post "/tournaments/#{@tournament_id}/tournament_categories",
               params: base_params(format_type: "elimination", overrides: { has_third_place: true })
          expect(response).to have_http_status(:created)
          expect(JSON.parse(response.body)["has_third_place"]).to eq(true)
        end

        it "has_third_place のデフォルトは false" do
          post "/tournaments/#{@tournament_id}/tournament_categories",
               params: base_params(format_type: "elimination")
          expect(response).to have_http_status(:created)
          expect(JSON.parse(response.body)["has_third_place"]).to eq(false)
        end

        it "group_count を指定できる（league_to_tournament）" do
          post "/tournaments/#{@tournament_id}/tournament_categories",
               params: base_params(format_type: "league_to_tournament", overrides: { group_count: 4 })
          expect(response).to have_http_status(:created)
          expect(JSON.parse(response.body)["group_count"]).to eq(4)
        end

        it "group_count を省略した場合は nil" do
          post "/tournaments/#{@tournament_id}/tournament_categories",
               params: base_params(format_type: "league_to_tournament")
          expect(response).to have_http_status(:created)
          expect(JSON.parse(response.body)["group_count"]).to be_nil
        end
      end

      # ---------------------------------------------------
      # レスポンスのフィールド確認
      # ---------------------------------------------------
      context "レスポンス構造" do
        it "作成したカテゴリのすべてのフィールドが返る" do
          post "/tournaments/#{@tournament_id}/tournament_categories",
               params: base_params(format_type: "elimination", overrides: { age_type: "一般" })

          expect(response).to have_http_status(:created)
          json = JSON.parse(response.body)

          expect(json).to include(
            "id",
            "tournament_id",
            "gender_type",
            "event_type",
            "age_type",
            "rank",
            "format_type",
            "max_participants",
            "group_size",
            "group_count",
            "advance_count",
            "has_third_place",
            "created_at",
            "updated_at"
          )
        end
      end
    end
  end
end
