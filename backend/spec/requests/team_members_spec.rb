require 'rails_helper'

RSpec.describe "TeamMembers API", type: :request do
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

  def create_category(tournament_id:, gender_type: "men", event_type: "singles", format_type: "elimination")
    base = { gender_type: gender_type, event_type: event_type, rank: "A" }
    format_specific =
      case format_type
      when "elimination"      then { format_type: "elimination", max_participants: 16 }
      when "league"           then { format_type: "league", group_size: 4 }
      when "league_to_tournament" then { format_type: "league_to_tournament", group_size: 4, advance_count: 2, max_participants: 8 }
      end
    post "/tournaments/#{tournament_id}/tournament_categories",
         params: { tournament_category: base.merge(format_specific) }
    expect(response).to have_http_status(:created)
    JSON.parse(response.body)["id"]
  end

  def create_team(tournament_id:, category_id:, name: "テストチーム")
    post "/tournaments/#{tournament_id}/tournament_categories/#{category_id}/teams",
         params: { team: { name: name } }
    expect(response).to have_http_status(:created)
    JSON.parse(response.body)["id"]
  end

  def members_path(tid, cid, team_id, member_id = nil)
    base = "/tournaments/#{tid}/tournament_categories/#{cid}/teams/#{team_id}/team_members"
    member_id ? "#{base}/#{member_id}" : base
  end

  # -------------------------------------------------------
  # 認証チェック
  # -------------------------------------------------------
  describe "認証チェック" do
    it "未ログインで選手作成すると 401" do
      post members_path(1, 1, 1),
           params: { team_member: { name: "田中 太郎", gender_type: "men" } }
      expect(response).to have_http_status(:unauthorized)
    end

    it "未ログインで選手更新すると 401" do
      patch members_path(1, 1, 1, 1),
            params: { team_member: { name: "更新" } }
      expect(response).to have_http_status(:unauthorized)
    end

    it "未ログインで選手削除すると 401" do
      delete members_path(1, 1, 1, 1)
      expect(response).to have_http_status(:unauthorized)
    end
  end

  # -------------------------------------------------------
  # 権限チェック
  # -------------------------------------------------------
  describe "権限チェック" do
    before do
      create_and_login_admin
      @tid = create_tournament
      @cid = create_category(tournament_id: @tid)
      @team_id = create_team(tournament_id: @tid, category_id: @cid)
    end

    it "存在しないトーナメントIDは 404" do
      post members_path(99999, @cid, @team_id),
           params: { team_member: { name: "田中", gender_type: "men" } }
      expect(response).to have_http_status(:not_found)
      expect(JSON.parse(response.body)["error"]).to eq("Tournament not found")
    end

    it "存在しないカテゴリIDは 404" do
      post members_path(@tid, 99999, @team_id),
           params: { team_member: { name: "田中", gender_type: "men" } }
      expect(response).to have_http_status(:not_found)
      expect(JSON.parse(response.body)["error"]).to eq("Category not found")
    end

    it "存在しないチームIDは 404" do
      post members_path(@tid, @cid, 99999),
           params: { team_member: { name: "田中", gender_type: "men" } }
      expect(response).to have_http_status(:not_found)
      expect(JSON.parse(response.body)["error"]).to eq("Team not found")
    end
  end

  # -------------------------------------------------------
  # POST 選手作成
  # -------------------------------------------------------
  describe "POST 選手作成" do
    before do
      create_and_login_admin
      @tid = create_tournament
    end

    # ---------------------------------------------------
    # シングルス（1チーム1選手）
    # ---------------------------------------------------
    context "event_type: singles のカテゴリ" do
      before do
        @cid     = create_category(tournament_id: @tid, event_type: "singles")
        @team_id = create_team(tournament_id: @tid, category_id: @cid, name: "田中 太郎")
      end

      it "男性選手を登録できる（201）" do
        expect {
          post members_path(@tid, @cid, @team_id),
               params: { team_member: { name: "田中 太郎", gender_type: "men" } }
        }.to change(TeamMember, :count).by(1)

        expect(response).to have_http_status(:created)
        json = JSON.parse(response.body)
        expect(json["name"]).to eq("田中 太郎")
        expect(json["gender_type"]).to eq("men")
        expect(json["age"]).to be_nil
        expect(json["affiliation"]).to be_nil
      end

      it "女性選手を登録できる（201）" do
        post members_path(@tid, @cid, @team_id),
             params: { team_member: { name: "田中 花子", gender_type: "women" } }
        expect(response).to have_http_status(:created)
        expect(JSON.parse(response.body)["gender_type"]).to eq("women")
      end

      it "affiliation を指定して登録できる" do
        post members_path(@tid, @cid, @team_id),
             params: { team_member: { name: "田中 太郎", gender_type: "men", affiliation: "○○大学" } }
        expect(response).to have_http_status(:created)
        expect(JSON.parse(response.body)["affiliation"]).to eq("○○大学")
      end

      it "age を指定して登録できる" do
        post members_path(@tid, @cid, @team_id),
             params: { team_member: { name: "田中 太郎", gender_type: "men", age: 25 } }
        expect(response).to have_http_status(:created)
        expect(JSON.parse(response.body)["age"]).to eq(25)
      end

      it "age が 0 でも登録できる" do
        post members_path(@tid, @cid, @team_id),
             params: { team_member: { name: "田中 太郎", gender_type: "men", age: 0 } }
        expect(response).to have_http_status(:created)
        expect(JSON.parse(response.body)["age"]).to eq(0)
      end
    end

    # ---------------------------------------------------
    # ダブルス（1チーム2選手・同性）
    # ---------------------------------------------------
    context "event_type: doubles のカテゴリ" do
      before do
        @cid     = create_category(tournament_id: @tid, gender_type: "men", event_type: "doubles")
        @team_id = create_team(tournament_id: @tid, category_id: @cid, name: "田中 / 鈴木")
      end

      it "1人目の選手を登録できる（201）" do
        post members_path(@tid, @cid, @team_id),
             params: { team_member: { name: "田中 太郎", gender_type: "men" } }
        expect(response).to have_http_status(:created)
      end

      it "2人目の選手を登録できる（201）" do
        post members_path(@tid, @cid, @team_id),
             params: { team_member: { name: "田中 太郎", gender_type: "men" } }
        post members_path(@tid, @cid, @team_id),
             params: { team_member: { name: "鈴木 次郎", gender_type: "men" } }
        expect(response).to have_http_status(:created)
      end

      it "2人登録するとチームに team_members が2件含まれる" do
        post members_path(@tid, @cid, @team_id),
             params: { team_member: { name: "田中 太郎", gender_type: "men" } }
        post members_path(@tid, @cid, @team_id),
             params: { team_member: { name: "鈴木 次郎", gender_type: "men" } }

        get "/tournaments/#{@tid}/tournament_categories/#{@cid}/teams"
        teams = JSON.parse(response.body)
        team  = teams.find { |t| t["id"] == @team_id }
        expect(team["team_members"].length).to eq(2)
      end
    end

    # ---------------------------------------------------
    # 混合ダブルス（1チーム: 男性1人 + 女性1人）
    # ---------------------------------------------------
    context "event_type: mixed_doubles のカテゴリ" do
      before do
        @cid     = create_category(tournament_id: @tid, gender_type: "mixed", event_type: "mixed_doubles")
        @team_id = create_team(tournament_id: @tid, category_id: @cid, name: "田中 / 山田")
      end

      it "男性選手を登録できる（201）" do
        post members_path(@tid, @cid, @team_id),
             params: { team_member: { name: "田中 太郎", gender_type: "men" } }
        expect(response).to have_http_status(:created)
        expect(JSON.parse(response.body)["gender_type"]).to eq("men")
      end

      it "女性選手を登録できる（201）" do
        post members_path(@tid, @cid, @team_id),
             params: { team_member: { name: "山田 花子", gender_type: "women" } }
        expect(response).to have_http_status(:created)
        expect(JSON.parse(response.body)["gender_type"]).to eq("women")
      end

      it "男女1人ずつ登録するとチームに team_members が2件含まれる" do
        post members_path(@tid, @cid, @team_id),
             params: { team_member: { name: "田中 太郎", gender_type: "men" } }
        post members_path(@tid, @cid, @team_id),
             params: { team_member: { name: "山田 花子", gender_type: "women" } }

        get "/tournaments/#{@tid}/tournament_categories/#{@cid}/teams"
        team = JSON.parse(response.body).find { |t| t["id"] == @team_id }
        genders = team["team_members"].map { |m| m["gender_type"] }
        expect(genders).to contain_exactly("men", "women")
      end
    end

    # ---------------------------------------------------
    # バリデーションエラー
    # ---------------------------------------------------
    context "バリデーションエラー" do
      before do
        @cid     = create_category(tournament_id: @tid)
        @team_id = create_team(tournament_id: @tid, category_id: @cid)
      end

      it "name がない場合は 422" do
        post members_path(@tid, @cid, @team_id),
             params: { team_member: { name: "", gender_type: "men" } }
        expect(response).to have_http_status(:unprocessable_entity)
        expect(JSON.parse(response.body)["errors"]).to be_present
      end

      it "gender_type がない場合は 422" do
        post members_path(@tid, @cid, @team_id),
             params: { team_member: { name: "田中 太郎" } }
        expect(response).to have_http_status(:unprocessable_entity)
      end

      it "gender_type に mixed を指定すると 422（enumに存在しない）" do
        post members_path(@tid, @cid, @team_id),
             params: { team_member: { name: "田中 太郎", gender_type: "mixed" } }
        expect(response).to have_http_status(:unprocessable_entity)
      end

      it "gender_type に不正な値を指定すると 422" do
        post members_path(@tid, @cid, @team_id),
             params: { team_member: { name: "田中 太郎", gender_type: "invalid" } }
        expect(response).to have_http_status(:unprocessable_entity)
      end

      it "age に負の値を指定すると 422" do
        post members_path(@tid, @cid, @team_id),
             params: { team_member: { name: "田中 太郎", gender_type: "men", age: -1 } }
        expect(response).to have_http_status(:unprocessable_entity)
      end
    end

    # ---------------------------------------------------
    # レスポンス構造
    # ---------------------------------------------------
    context "レスポンス構造" do
      before do
        @cid     = create_category(tournament_id: @tid)
        @team_id = create_team(tournament_id: @tid, category_id: @cid)
      end

      it "作成された選手の全フィールドが返る" do
        post members_path(@tid, @cid, @team_id),
             params: { team_member: { name: "田中 太郎", gender_type: "men", age: 25, affiliation: "○○大学" } }

        expect(response).to have_http_status(:created)
        json = JSON.parse(response.body)
        expect(json).to include(
          "id", "team_id", "name", "gender_type", "age", "affiliation",
          "created_at", "updated_at"
        )
        expect(json["team_id"]).to eq(@team_id)
      end
    end
  end

  # -------------------------------------------------------
  # PATCH 選手更新
  # -------------------------------------------------------
  describe "PATCH 選手更新" do
    before do
      create_and_login_admin
      @tid       = create_tournament
      @cid       = create_category(tournament_id: @tid)
      @team_id   = create_team(tournament_id: @tid, category_id: @cid)
      post members_path(@tid, @cid, @team_id),
           params: { team_member: { name: "田中 太郎", gender_type: "men" } }
      @member_id = JSON.parse(response.body)["id"]
    end

    it "名前を更新できる（200）" do
      patch members_path(@tid, @cid, @team_id, @member_id),
            params: { team_member: { name: "田中 次郎" } }
      expect(response).to have_http_status(:ok)
      expect(JSON.parse(response.body)["name"]).to eq("田中 次郎")
    end

    it "gender_type を men から women に更新できる" do
      patch members_path(@tid, @cid, @team_id, @member_id),
            params: { team_member: { gender_type: "women" } }
      expect(response).to have_http_status(:ok)
      expect(JSON.parse(response.body)["gender_type"]).to eq("women")
    end

    it "gender_type に mixed を指定すると 422" do
      patch members_path(@tid, @cid, @team_id, @member_id),
            params: { team_member: { gender_type: "mixed" } }
      expect(response).to have_http_status(:unprocessable_entity)
    end

    it "age を更新できる" do
      patch members_path(@tid, @cid, @team_id, @member_id),
            params: { team_member: { age: 30 } }
      expect(response).to have_http_status(:ok)
      expect(JSON.parse(response.body)["age"]).to eq(30)
    end

    it "affiliation を更新できる" do
      patch members_path(@tid, @cid, @team_id, @member_id),
            params: { team_member: { affiliation: "新○○クラブ" } }
      expect(response).to have_http_status(:ok)
      expect(JSON.parse(response.body)["affiliation"]).to eq("新○○クラブ")
    end

    it "存在しない選手IDは 404" do
      patch members_path(@tid, @cid, @team_id, 99999),
            params: { team_member: { name: "更新" } }
      expect(response).to have_http_status(:not_found)
      expect(JSON.parse(response.body)["error"]).to eq("Team member not found")
    end
  end

  # -------------------------------------------------------
  # DELETE 選手削除
  # -------------------------------------------------------
  describe "DELETE 選手削除" do
    before do
      create_and_login_admin
      @tid       = create_tournament
      @cid       = create_category(tournament_id: @tid)
      @team_id   = create_team(tournament_id: @tid, category_id: @cid)
      post members_path(@tid, @cid, @team_id),
           params: { team_member: { name: "田中 太郎", gender_type: "men" } }
      @member_id = JSON.parse(response.body)["id"]
    end

    it "選手を削除できる（204）" do
      expect {
        delete members_path(@tid, @cid, @team_id, @member_id)
      }.to change(TeamMember, :count).by(-1)
      expect(response).to have_http_status(:no_content)
    end

    it "存在しない選手IDは 404" do
      delete members_path(@tid, @cid, @team_id, 99999)
      expect(response).to have_http_status(:not_found)
    end
  end

  # -------------------------------------------------------
  # 全カテゴリ × 全 event_type の統合テスト
  # -------------------------------------------------------
  describe "全カテゴリ × 全 event_type の統合テスト" do
    before do
      create_and_login_admin
      @tid = create_tournament
    end

    {
      "men"   => { "singles" => :men,   "doubles" => :men,   "mixed_doubles" => :men   },
      "women" => { "singles" => :women, "doubles" => :women, "mixed_doubles" => :women },
      "mixed" => { "singles" => :men,   "doubles" => :men,   "mixed_doubles" => :men   }
    }.each do |gender, event_member_map|
      event_member_map.each do |event, member_gender|
        it "gender_type: #{gender} × event_type: #{event} のカテゴリに選手を登録できる" do
          cid     = create_category(tournament_id: @tid, gender_type: gender, event_type: event)
          team_id = create_team(tournament_id: @tid, category_id: cid, name: "チームA")

          post members_path(@tid, cid, team_id),
               params: { team_member: { name: "テスト選手", gender_type: member_gender.to_s } }
          expect(response).to have_http_status(:created)
          expect(JSON.parse(response.body)["gender_type"]).to eq(member_gender.to_s)
        end
      end
    end
  end
end
