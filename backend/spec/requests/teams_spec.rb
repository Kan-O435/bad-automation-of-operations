require 'rails_helper'

RSpec.describe "Teams API", type: :request do
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

  # format_type に応じた最小有効パラメータでカテゴリを作成
  def create_category(tournament_id:, gender_type: "men", event_type: "singles", format_type: "elimination", overrides: {})
    base = {
      gender_type: gender_type,
      event_type:  event_type,
      rank:        "A"
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

    post "/tournaments/#{tournament_id}/tournament_categories",
         params: { tournament_category: base.merge(format_specific).merge(overrides) }
    expect(response).to have_http_status(:created)
    JSON.parse(response.body)["id"]
  end

  def create_team(tournament_id:, category_id:, name: "テストチーム", seed_number: nil, affiliation: nil)
    post "/tournaments/#{tournament_id}/tournament_categories/#{category_id}/teams",
         params: { team: { name: name, seed_number: seed_number, affiliation: affiliation } }
    JSON.parse(response.body)
  end

  # -------------------------------------------------------
  # 認証チェック
  # -------------------------------------------------------
  describe "認証チェック" do
    it "未ログインでチーム一覧取得すると 401" do
      get "/tournaments/1/tournament_categories/1/teams"
      expect(response).to have_http_status(:unauthorized)
    end

    it "未ログインでチーム作成すると 401" do
      post "/tournaments/1/tournament_categories/1/teams",
           params: { team: { name: "チームA" } }
      expect(response).to have_http_status(:unauthorized)
    end

    it "未ログインでチーム更新すると 401" do
      patch "/tournaments/1/tournament_categories/1/teams/1",
            params: { team: { name: "更新チーム" } }
      expect(response).to have_http_status(:unauthorized)
    end

    it "未ログインでチーム削除すると 401" do
      delete "/tournaments/1/tournament_categories/1/teams/1"
      expect(response).to have_http_status(:unauthorized)
    end
  end

  # -------------------------------------------------------
  # 権限チェック（他Admin のリソースへのアクセス）
  # -------------------------------------------------------
  describe "権限チェック" do
    before { create_and_login_admin }

    it "存在しないトーナメントIDは 404" do
      post "/tournaments/99999/tournament_categories/1/teams",
           params: { team: { name: "チームA" } }
      expect(response).to have_http_status(:not_found)
      expect(JSON.parse(response.body)["error"]).to eq("Tournament not found")
    end

    it "存在しないカテゴリIDは 404" do
      tid = create_tournament
      post "/tournaments/#{tid}/tournament_categories/99999/teams",
           params: { team: { name: "チームA" } }
      expect(response).to have_http_status(:not_found)
      expect(JSON.parse(response.body)["error"]).to eq("Category not found")
    end

    it "他のAdminのトーナメントにはアクセスできない（404）" do
      create_and_login_admin(email: "other@example.com", password: "password123", name: "Other")
      other_tid = create_tournament(title: "他Admin大会")
      other_cid = create_category(tournament_id: other_tid)

      post "/login", params: { email: "admin@example.com", password: "password123" }
      post "/tournaments/#{other_tid}/tournament_categories/#{other_cid}/teams",
           params: { team: { name: "チームA" } }
      expect(response).to have_http_status(:not_found)
    end
  end

  # -------------------------------------------------------
  # GET /tournaments/:tournament_id/tournament_categories/:id/teams
  # -------------------------------------------------------
  describe "GET チーム一覧" do
    before do
      create_and_login_admin
      @tid = create_tournament
      @cid = create_category(tournament_id: @tid)
    end

    it "チームが存在しない場合は空配列が返る" do
      get "/tournaments/#{@tid}/tournament_categories/#{@cid}/teams"
      expect(response).to have_http_status(:ok)
      expect(JSON.parse(response.body)).to eq([])
    end

    it "登録済みチームの一覧が team_members を含んで返る" do
      create_team(tournament_id: @tid, category_id: @cid, name: "チームA")
      create_team(tournament_id: @tid, category_id: @cid, name: "チームB")

      get "/tournaments/#{@tid}/tournament_categories/#{@cid}/teams"
      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json.length).to eq(2)
      expect(json.map { |t| t["name"] }).to contain_exactly("チームA", "チームB")
      expect(json.first).to have_key("team_members")
    end
  end

  # -------------------------------------------------------
  # POST チーム作成
  # -------------------------------------------------------
  describe "POST チーム作成" do
    before do
      create_and_login_admin
      @tid = create_tournament
    end

    # ---------------------------------------------------
    # event_type: singles（シングルス）
    # 1チーム = 1選手
    # ---------------------------------------------------
    context "event_type: singles" do
      before { @cid = create_category(tournament_id: @tid, event_type: "singles") }

      it "名前のみでチームを作成できる（201）" do
        expect {
          post "/tournaments/#{@tid}/tournament_categories/#{@cid}/teams",
               params: { team: { name: "田中 太郎" } }
        }.to change(Team, :count).by(1)

        expect(response).to have_http_status(:created)
        json = JSON.parse(response.body)
        expect(json["name"]).to eq("田中 太郎")
        expect(json["seed_number"]).to be_nil
        expect(json["affiliation"]).to be_nil
        expect(json["team_members"]).to eq([])
      end

      it "affiliation を指定してチームを作成できる" do
        post "/tournaments/#{@tid}/tournament_categories/#{@cid}/teams",
             params: { team: { name: "田中 太郎", affiliation: "○○大学" } }
        expect(response).to have_http_status(:created)
        expect(JSON.parse(response.body)["affiliation"]).to eq("○○大学")
      end

      it "seed_number を指定してチームを作成できる" do
        post "/tournaments/#{@tid}/tournament_categories/#{@cid}/teams",
             params: { team: { name: "田中 太郎", seed_number: 1 } }
        expect(response).to have_http_status(:created)
        expect(JSON.parse(response.body)["seed_number"]).to eq(1)
      end

      it "name がない場合は 422" do
        post "/tournaments/#{@tid}/tournament_categories/#{@cid}/teams",
             params: { team: { name: "" } }
        expect(response).to have_http_status(:unprocessable_entity)
        expect(JSON.parse(response.body)["errors"]).to be_present
      end

      it "seed_number が 0 の場合は 422" do
        post "/tournaments/#{@tid}/tournament_categories/#{@cid}/teams",
             params: { team: { name: "田中 太郎", seed_number: 0 } }
        expect(response).to have_http_status(:unprocessable_entity)
      end
    end

    # ---------------------------------------------------
    # event_type: doubles（ダブルス）
    # 1チーム = 2選手（同性）
    # ---------------------------------------------------
    context "event_type: doubles" do
      before { @cid = create_category(tournament_id: @tid, event_type: "doubles") }

      it "ペア名でチームを作成できる（201）" do
        post "/tournaments/#{@tid}/tournament_categories/#{@cid}/teams",
             params: { team: { name: "田中 / 鈴木" } }
        expect(response).to have_http_status(:created)
        expect(JSON.parse(response.body)["name"]).to eq("田中 / 鈴木")
      end

      it "affiliation を指定してチームを作成できる" do
        post "/tournaments/#{@tid}/tournament_categories/#{@cid}/teams",
             params: { team: { name: "田中 / 鈴木", affiliation: "○○クラブ" } }
        expect(response).to have_http_status(:created)
        expect(JSON.parse(response.body)["affiliation"]).to eq("○○クラブ")
      end
    end

    # ---------------------------------------------------
    # event_type: mixed_doubles（混合ダブルス）
    # 1チーム = 男性1人 + 女性1人
    # ---------------------------------------------------
    context "event_type: mixed_doubles" do
      before { @cid = create_category(tournament_id: @tid, event_type: "mixed_doubles") }

      it "ミックスペア名でチームを作成できる（201）" do
        post "/tournaments/#{@tid}/tournament_categories/#{@cid}/teams",
             params: { team: { name: "田中 / 山田" } }
        expect(response).to have_http_status(:created)
        expect(JSON.parse(response.body)["name"]).to eq("田中 / 山田")
      end
    end

    # ---------------------------------------------------
    # gender_type の全パターン
    # ---------------------------------------------------
    context "gender_type の全パターン" do
      %w[men women mixed].each do |gender|
        it "gender_type: #{gender} のカテゴリにチームを登録できる" do
          cid = create_category(tournament_id: @tid, gender_type: gender)
          post "/tournaments/#{@tid}/tournament_categories/#{cid}/teams",
               params: { team: { name: "チームA" } }
          expect(response).to have_http_status(:created)
        end
      end
    end

    # ---------------------------------------------------
    # format_type の全パターン
    # ---------------------------------------------------
    context "format_type: elimination（単純トーナメント）のカテゴリへの登録" do
      before { @cid = create_category(tournament_id: @tid, format_type: "elimination") }

      it "チームを登録できる（201）" do
        post "/tournaments/#{@tid}/tournament_categories/#{@cid}/teams",
             params: { team: { name: "チームA" } }
        expect(response).to have_http_status(:created)
      end
    end

    context "format_type: league（リーグ戦）のカテゴリへの登録" do
      before { @cid = create_category(tournament_id: @tid, format_type: "league") }

      it "チームを登録できる（201）" do
        post "/tournaments/#{@tid}/tournament_categories/#{@cid}/teams",
             params: { team: { name: "チームA" } }
        expect(response).to have_http_status(:created)
      end
    end

    context "format_type: league_to_tournament（予選リーグ＋本戦）のカテゴリへの登録" do
      before { @cid = create_category(tournament_id: @tid, format_type: "league_to_tournament") }

      it "チームを登録できる（201）" do
        post "/tournaments/#{@tid}/tournament_categories/#{@cid}/teams",
             params: { team: { name: "チームA" } }
        expect(response).to have_http_status(:created)
      end
    end

    # ---------------------------------------------------
    # レスポンス構造
    # ---------------------------------------------------
    context "レスポンス構造" do
      before { @cid = create_category(tournament_id: @tid) }

      it "作成されたチームの全フィールドが返る" do
        post "/tournaments/#{@tid}/tournament_categories/#{@cid}/teams",
             params: { team: { name: "チームA", affiliation: "○○大学", seed_number: 1 } }

        expect(response).to have_http_status(:created)
        json = JSON.parse(response.body)
        expect(json).to include("id", "name", "affiliation", "seed_number",
                                "tournament_category_id", "team_members",
                                "created_at", "updated_at")
        expect(json["tournament_category_id"]).to eq(@cid)
      end
    end
  end

  # -------------------------------------------------------
  # PATCH チーム更新
  # -------------------------------------------------------
  describe "PATCH チーム更新" do
    before do
      create_and_login_admin
      @tid = create_tournament
      @cid = create_category(tournament_id: @tid)
      @team_id = create_team(tournament_id: @tid, category_id: @cid, name: "旧チーム名")["id"]
    end

    it "名前を更新できる（200）" do
      patch "/tournaments/#{@tid}/tournament_categories/#{@cid}/teams/#{@team_id}",
            params: { team: { name: "新チーム名" } }
      expect(response).to have_http_status(:ok)
      expect(JSON.parse(response.body)["name"]).to eq("新チーム名")
    end

    it "affiliation を更新できる" do
      patch "/tournaments/#{@tid}/tournament_categories/#{@cid}/teams/#{@team_id}",
            params: { team: { affiliation: "新○○クラブ" } }
      expect(response).to have_http_status(:ok)
      expect(JSON.parse(response.body)["affiliation"]).to eq("新○○クラブ")
    end

    it "seed_number を更新できる" do
      patch "/tournaments/#{@tid}/tournament_categories/#{@cid}/teams/#{@team_id}",
            params: { team: { seed_number: 2 } }
      expect(response).to have_http_status(:ok)
      expect(JSON.parse(response.body)["seed_number"]).to eq(2)
    end

    it "存在しないチームIDは 404" do
      patch "/tournaments/#{@tid}/tournament_categories/#{@cid}/teams/99999",
            params: { team: { name: "更新" } }
      expect(response).to have_http_status(:not_found)
      expect(JSON.parse(response.body)["error"]).to eq("Team not found")
    end

    it "name を空にしようとすると 422" do
      patch "/tournaments/#{@tid}/tournament_categories/#{@cid}/teams/#{@team_id}",
            params: { team: { name: "" } }
      expect(response).to have_http_status(:unprocessable_entity)
    end
  end

  # -------------------------------------------------------
  # DELETE チーム削除
  # -------------------------------------------------------
  describe "DELETE チーム削除" do
    before do
      create_and_login_admin
      @tid = create_tournament
      @cid = create_category(tournament_id: @tid)
      @team_id = create_team(tournament_id: @tid, category_id: @cid, name: "削除対象チーム")["id"]
    end

    it "チームを削除できる（204）" do
      expect {
        delete "/tournaments/#{@tid}/tournament_categories/#{@cid}/teams/#{@team_id}"
      }.to change(Team, :count).by(-1)
      expect(response).to have_http_status(:no_content)
    end

    it "存在しないチームIDは 404" do
      delete "/tournaments/#{@tid}/tournament_categories/#{@cid}/teams/99999"
      expect(response).to have_http_status(:not_found)
    end
  end

  # -------------------------------------------------------
  # GET /tournaments/:id/teams（大会全体のチーム一覧）
  # -------------------------------------------------------
  describe "GET /tournaments/:id/teams（大会全体のチーム一覧）" do
    before do
      create_and_login_admin
      @tid = create_tournament

      # 複数カテゴリ作成
      @singles_men_cid    = create_category(tournament_id: @tid, gender_type: "men",   event_type: "singles",       format_type: "elimination")
      @doubles_women_cid  = create_category(tournament_id: @tid, gender_type: "women", event_type: "doubles",       format_type: "league")
      @mixed_doubles_cid  = create_category(tournament_id: @tid, gender_type: "mixed", event_type: "mixed_doubles", format_type: "league_to_tournament")
    end

    it "チームが存在しない場合は空配列が返る" do
      get "/tournaments/#{@tid}/teams"
      expect(response).to have_http_status(:ok)
      expect(JSON.parse(response.body)).to eq([])
    end

    it "全カテゴリのチームが一括で取得できる" do
      create_team(tournament_id: @tid, category_id: @singles_men_cid,   name: "田中 太郎")
      create_team(tournament_id: @tid, category_id: @doubles_women_cid, name: "佐藤 / 鈴木")
      create_team(tournament_id: @tid, category_id: @mixed_doubles_cid, name: "山田 / 中村")

      get "/tournaments/#{@tid}/teams"
      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json.length).to eq(3)
      expect(json.map { |t| t["name"] }).to contain_exactly("田中 太郎", "佐藤 / 鈴木", "山田 / 中村")
    end

    it "各チームに tournament_category 情報が含まれる" do
      create_team(tournament_id: @tid, category_id: @singles_men_cid, name: "田中 太郎")

      get "/tournaments/#{@tid}/teams"
      json = JSON.parse(response.body)
      tc = json.first["tournament_category"]
      expect(tc).to include(
        "id"          => @singles_men_cid,
        "gender_type" => "men",
        "event_type"  => "singles",
        "format_type" => "elimination"
      )
    end

    it "各チームに team_members が含まれる" do
      create_team(tournament_id: @tid, category_id: @singles_men_cid, name: "田中 太郎")

      get "/tournaments/#{@tid}/teams"
      json = JSON.parse(response.body)
      expect(json.first).to have_key("team_members")
      expect(json.first["team_members"]).to be_an(Array)
    end

    it "他のAdminのトーナメントは取得できない（404）" do
      create_and_login_admin(email: "other@example.com", password: "password123", name: "Other")
      other_tid = create_tournament(title: "他Admin大会")

      post "/login", params: { email: "admin@example.com", password: "password123" }
      get "/tournaments/#{other_tid}/teams"
      expect(response).to have_http_status(:not_found)
    end

    it "未ログインでアクセスすると 401" do
      delete "/logout"
      get "/tournaments/#{@tid}/teams"
      expect(response).to have_http_status(:unauthorized)
    end
  end

  # -------------------------------------------------------
  # 全カテゴリ × 全 event_type の組み合わせ統合テスト
  # -------------------------------------------------------
  describe "全カテゴリ × 全 event_type の統合テスト" do
    before do
      create_and_login_admin
      @tid = create_tournament
    end

    {
      "men"   => %w[singles doubles mixed_doubles],
      "women" => %w[singles doubles mixed_doubles],
      "mixed" => %w[singles doubles mixed_doubles]
    }.each do |gender, event_types|
      event_types.each do |event|
        it "gender_type: #{gender} × event_type: #{event} でチームを登録できる" do
          cid = create_category(tournament_id: @tid, gender_type: gender, event_type: event)
          post "/tournaments/#{@tid}/tournament_categories/#{cid}/teams",
               params: { team: { name: "チームA", affiliation: "テスト所属" } }
          expect(response).to have_http_status(:created)
          json = JSON.parse(response.body)
          expect(json["name"]).to eq("チームA")
          expect(json["tournament_category_id"]).to eq(cid)
        end
      end
    end
  end
end
