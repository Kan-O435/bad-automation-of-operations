require 'rails_helper'

RSpec.describe "TournamentDays API", type: :request do
  let(:valid_admin_params) do
    { email: "admin@example.com", password: "password123", name: "Test Admin" }
  end

  # テスト用Adminを作成してログイン状態にするヘルパー
  def create_and_login_admin(params = valid_admin_params)
    post "/signup", params: params
    expect(response).to have_http_status(:created)
    post "/login", params: { email: params[:email], password: params[:password] }
    expect(response).to have_http_status(:ok)
  end

  # トーナメントを作成してIDを返すヘルパー
  def create_tournament(title: "春季大会")
    post "/tournaments", params: { tournament: { title: title } }
    expect(response).to have_http_status(:created)
    JSON.parse(response.body)["id"]
  end

  # -------------------------------------------------------
  # POST /tournaments/:tournament_id/tournament_days
  # -------------------------------------------------------
  describe "POST /tournaments/:tournament_id/tournament_days" do
    context "ログイン済みの場合" do
      before { create_and_login_admin }

      context "有効なパラメータの場合" do
        it "tournament_dayが作成され、201 Created が返る" do
          tournament_id = create_tournament

          expect {
            post "/tournaments/#{tournament_id}/tournament_days",
                 params: { tournament_day: { day: "2026-05-01" } }
          }.to change(TournamentDay, :count).by(1)

          expect(response).to have_http_status(:created)
          json = JSON.parse(response.body)
          expect(json["day"]).to eq("2026-05-01")
          expect(json["tournament_id"]).to eq(tournament_id)
        end

        it "同じトーナメントに複数日程を登録できる" do
          tournament_id = create_tournament

          post "/tournaments/#{tournament_id}/tournament_days",
               params: { tournament_day: { day: "2026-05-01" } }
          post "/tournaments/#{tournament_id}/tournament_days",
               params: { tournament_day: { day: "2026-05-02" } }

          expect(TournamentDay.where(tournament_id: tournament_id).count).to eq(2)
        end
      end

      context "無効なパラメータの場合" do
        it "dayが空の場合、422 Unprocessable Entity が返る" do
          tournament_id = create_tournament

          expect {
            post "/tournaments/#{tournament_id}/tournament_days",
                 params: { tournament_day: { day: nil } }
          }.not_to change(TournamentDay, :count)

          expect(response).to have_http_status(:unprocessable_entity)
          json = JSON.parse(response.body)
          expect(json["errors"]).to be_present
        end

        it "存在しないtournament_idの場合、404 Not Found が返る" do
          expect {
            post "/tournaments/99999/tournament_days",
                 params: { tournament_day: { day: "2026-05-01" } }
          }.not_to change(TournamentDay, :count)

          expect(response).to have_http_status(:not_found)
        end
      end
    end

    context "未ログインの場合" do
      it "401 Unauthorized が返る" do
        post "/tournaments/1/tournament_days",
             params: { tournament_day: { day: "2026-05-01" } }
        expect(response).to have_http_status(:unauthorized)
        json = JSON.parse(response.body)
        expect(json["error"]).to eq("unauthorized")
      end
    end
  end

  # -------------------------------------------------------
  # GET /tournaments/:id でtournament_daysが含まれるか確認
  # -------------------------------------------------------
  describe "GET /tournaments/:id (tournament_days込み)" do
    context "ログイン済みの場合" do
      before { create_and_login_admin }

      it "トーナメントにtournament_daysが紐づいて取得できる" do
        tournament_id = create_tournament(title: "全国大会")

        post "/tournaments/#{tournament_id}/tournament_days",
             params: { tournament_day: { day: "2026-06-01" } }
        post "/tournaments/#{tournament_id}/tournament_days",
             params: { tournament_day: { day: "2026-06-02" } }

        get "/tournaments/#{tournament_id}"
        expect(response).to have_http_status(:ok)
        json = JSON.parse(response.body)
        expect(json["title"]).to eq("全国大会")
        expect(json["tournament_days"].length).to eq(2)
        days = json["tournament_days"].map { |d| d["day"] }
        expect(days).to contain_exactly("2026-06-01", "2026-06-02")
      end
    end
  end

  # -------------------------------------------------------
  # 統合フロー: サインアップ → ログイン → トーナメント作成 → 日程登録
  # -------------------------------------------------------
  describe "統合フロー: サインアップからtournament_days作成まで" do
    it "サインアップ → ログイン → トーナメント作成 → 日程登録が正常に完了する" do
      # 1. サインアップ
      post "/signup", params: { email: "full@example.com", password: "securepass", name: "Full Admin" }
      expect(response).to have_http_status(:created)

      # 2. ログイン
      post "/login", params: { email: "full@example.com", password: "securepass" }
      expect(response).to have_http_status(:ok)

      # 3. トーナメント作成
      post "/tournaments", params: { tournament: { title: "全国バドミントン選手権2026", detail: "年次全国大会" } }
      expect(response).to have_http_status(:created)
      tournament = JSON.parse(response.body)
      tournament_id = tournament["id"]
      expect(tournament["tournament_days"]).to eq([])

      # 4. 1日目の日程を登録
      post "/tournaments/#{tournament_id}/tournament_days",
           params: { tournament_day: { day: "2026-08-10" } }
      expect(response).to have_http_status(:created)
      day1 = JSON.parse(response.body)
      expect(day1["day"]).to eq("2026-08-10")
      expect(day1["tournament_id"]).to eq(tournament_id)

      # 5. 2日目の日程を登録
      post "/tournaments/#{tournament_id}/tournament_days",
           params: { tournament_day: { day: "2026-08-11" } }
      expect(response).to have_http_status(:created)
      day2 = JSON.parse(response.body)
      expect(day2["day"]).to eq("2026-08-11")

      # 6. トーナメント詳細を取得してtournament_daysが含まれていることを確認
      get "/tournaments/#{tournament_id}"
      expect(response).to have_http_status(:ok)
      result = JSON.parse(response.body)
      expect(result["tournament_days"].length).to eq(2)
      registered_days = result["tournament_days"].map { |d| d["day"] }
      expect(registered_days).to contain_exactly("2026-08-10", "2026-08-11")
    end

    it "ログアウト後はトーナメントを作成できない" do
      # サインアップ → ログイン → ログアウト
      post "/signup", params: { email: "logout@example.com", password: "securepass", name: "Logout Admin" }
      post "/login", params: { email: "logout@example.com", password: "securepass" }
      delete "/logout"
      expect(response).to have_http_status(:no_content)

      # ログアウト後はトーナメント作成不可
      post "/tournaments", params: { tournament: { title: "不正な大会" } }
      expect(response).to have_http_status(:unauthorized)
    end
  end
end
