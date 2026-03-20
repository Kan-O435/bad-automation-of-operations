require 'rails_helper'

RSpec.describe "Tournaments API", type: :request do
  let(:valid_admin_params) do
    { email: "test@example.com", password: "password123", name: "Test Admin" }
  end

  # テスト用Adminを作成してログイン状態にするヘルパー
  def create_and_login_admin(params = valid_admin_params)
    post "/signup", params: params
    expect(response).to have_http_status(:created)
    post "/login", params: { email: params[:email], password: params[:password] }
    expect(response).to have_http_status(:ok)
  end

  # -------------------------------------------------------
  # POST /tournaments
  # -------------------------------------------------------
  describe "POST /tournaments" do
    context "ログイン済みの場合" do
      before { create_and_login_admin }

      context "有効なパラメータの場合" do
        it "トーナメントが作成され、201 Created が返る" do
          expect {
            post "/tournaments", params: { tournament: { title: "春季大会", detail: "春の大会です" } }
          }.to change(Tournament, :count).by(1)

          expect(response).to have_http_status(:created)
          json = JSON.parse(response.body)
          expect(json["title"]).to eq("春季大会")
          expect(json["detail"]).to eq("春の大会です")
          expect(json["tournament_days"]).to eq([])
        end

        it "detailなしでもトーナメントが作成できる" do
          expect {
            post "/tournaments", params: { tournament: { title: "夏季大会" } }
          }.to change(Tournament, :count).by(1)

          expect(response).to have_http_status(:created)
          json = JSON.parse(response.body)
          expect(json["title"]).to eq("夏季大会")
        end
      end

      context "無効なパラメータの場合" do
        it "titleが空の場合、422 Unprocessable Entity が返る" do
          expect {
            post "/tournaments", params: { tournament: { title: "" } }
          }.not_to change(Tournament, :count)

          expect(response).to have_http_status(:unprocessable_entity)
          json = JSON.parse(response.body)
          expect(json["errors"]).to be_present
        end
      end
    end

    context "未ログインの場合" do
      it "401 Unauthorized が返る" do
        post "/tournaments", params: { tournament: { title: "春季大会" } }
        expect(response).to have_http_status(:unauthorized)
        json = JSON.parse(response.body)
        expect(json["error"]).to eq("unauthorized")
      end
    end
  end

  # -------------------------------------------------------
  # GET /tournaments
  # -------------------------------------------------------
  describe "GET /tournaments" do
    context "ログイン済みの場合" do
      before do
        create_and_login_admin
        post "/tournaments", params: { tournament: { title: "春季大会" } }
        post "/tournaments", params: { tournament: { title: "夏季大会" } }
      end

      it "自分のトーナメント一覧が取得できる" do
        get "/tournaments"
        expect(response).to have_http_status(:ok)
        json = JSON.parse(response.body)
        expect(json.length).to eq(2)
        expect(json.map { |t| t["title"] }).to contain_exactly("春季大会", "夏季大会")
      end
    end

    context "未ログインの場合" do
      it "401 Unauthorized が返る" do
        get "/tournaments"
        expect(response).to have_http_status(:unauthorized)
      end
    end
  end

  # -------------------------------------------------------
  # GET /tournaments/:id
  # -------------------------------------------------------
  describe "GET /tournaments/:id" do
    context "ログイン済みの場合" do
      before { create_and_login_admin }

      it "指定したトーナメントの詳細が取得できる" do
        post "/tournaments", params: { tournament: { title: "春季大会", detail: "詳細情報" } }
        tournament_id = JSON.parse(response.body)["id"]

        get "/tournaments/#{tournament_id}"
        expect(response).to have_http_status(:ok)
        json = JSON.parse(response.body)
        expect(json["title"]).to eq("春季大会")
        expect(json["detail"]).to eq("詳細情報")
      end

      it "他のAdminのトーナメントは取得できない" do
        # 別のAdminを作成して別のトーナメントを登録
        post "/signup", params: { email: "other@example.com", password: "password123", name: "Other Admin" }
        post "/login", params: { email: "other@example.com", password: "password123" }
        post "/tournaments", params: { tournament: { title: "他のAdminの大会" } }
        other_tournament_id = JSON.parse(response.body)["id"]

        # 元のAdminに戻ってログイン
        post "/login", params: { email: "test@example.com", password: "password123" }
        get "/tournaments/#{other_tournament_id}"
        expect(response).to have_http_status(:not_found)
      end
    end
  end

  # -------------------------------------------------------
  # 統合フロー: サインアップ → ログイン → トーナメント作成
  # -------------------------------------------------------
  describe "統合フロー: サインアップからトーナメント作成まで" do
    it "サインアップ → ログイン → トーナメント作成が正常に完了する" do
      # 1. サインアップ
      post "/signup", params: { email: "flow@example.com", password: "securepass", name: "Flow Admin" }
      expect(response).to have_http_status(:created)

      # 2. ログイン
      post "/login", params: { email: "flow@example.com", password: "securepass" }
      expect(response).to have_http_status(:ok)
      expect(JSON.parse(response.body)["message"]).to eq("logged in")

      # 3. 認証確認
      get "/me"
      expect(response).to have_http_status(:ok)
      me_json = JSON.parse(response.body)
      expect(me_json["admin"]["email"]).to eq("flow@example.com")

      # 4. トーナメント作成
      post "/tournaments", params: { tournament: { title: "全国大会2026", detail: "全国規模の大会" } }
      expect(response).to have_http_status(:created)
      tournament_json = JSON.parse(response.body)
      expect(tournament_json["title"]).to eq("全国大会2026")
      expect(tournament_json["admin_id"]).to eq(me_json["admin"]["id"])
      expect(tournament_json["tournament_days"]).to eq([])
    end
  end
end
