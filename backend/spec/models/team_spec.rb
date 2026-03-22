require 'rails_helper'

RSpec.describe Team, type: :model do
  let(:admin) { Admin.create!(name: "Admin", email: "admin@example.com", password: "password123") }
  let(:tournament) { Tournament.create!(title: "テスト大会", admin: admin) }
  let(:category) do
    TournamentCategory.create!(
      tournament: tournament,
      gender_type: :men,
      event_type: :singles,
      format_type: :elimination,
      rank: "A",
      max_participants: 16
    )
  end

  def valid_attrs(overrides = {})
    { tournament_category: category, name: "テストチーム" }.merge(overrides)
  end

  # -------------------------------------------------------
  # バリデーション
  # -------------------------------------------------------
  describe "バリデーション" do
    it "有効な属性でバリデーションが通る" do
      expect(Team.new(valid_attrs)).to be_valid
    end

    it "name がない場合は無効" do
      team = Team.new(valid_attrs(name: nil))
      expect(team).not_to be_valid
      expect(team.errors[:name]).to be_present
    end

    it "name が空文字の場合は無効" do
      team = Team.new(valid_attrs(name: ""))
      expect(team).not_to be_valid
    end

    it "tournament_category がない場合は無効" do
      team = Team.new(name: "テストチーム", tournament_category: nil)
      expect(team).not_to be_valid
    end

    context "seed_number のバリデーション" do
      it "seed_number が nil でも有効（任意項目）" do
        expect(Team.new(valid_attrs(seed_number: nil))).to be_valid
      end

      it "seed_number が 1 以上の整数は有効" do
        expect(Team.new(valid_attrs(seed_number: 1))).to be_valid
        expect(Team.new(valid_attrs(seed_number: 8))).to be_valid
      end

      it "seed_number が 0 の場合は無効（1以上必須）" do
        team = Team.new(valid_attrs(seed_number: 0))
        expect(team).not_to be_valid
        expect(team.errors[:seed_number]).to be_present
      end

      it "seed_number が負の数の場合は無効" do
        team = Team.new(valid_attrs(seed_number: -1))
        expect(team).not_to be_valid
      end

      it "seed_number が小数の場合は無効" do
        team = Team.new(valid_attrs(seed_number: 1.5))
        expect(team).not_to be_valid
      end
    end
  end

  # -------------------------------------------------------
  # アソシエーション
  # -------------------------------------------------------
  describe "アソシエーション" do
    it "tournament_category に belongs_to している" do
      team = Team.new(valid_attrs)
      expect(team.tournament_category).to eq(category)
    end

    it "team_members を has_many している" do
      team = Team.create!(valid_attrs)
      member = TeamMember.create!(team: team, name: "田中 太郎", gender_type: :men)
      expect(team.team_members).to include(member)
    end

    it "チームを削除すると team_members も削除される（dependent: :destroy）" do
      team = Team.create!(valid_attrs)
      TeamMember.create!(team: team, name: "田中 太郎", gender_type: :men)
      expect { team.destroy }.to change(TeamMember, :count).by(-1)
    end
  end
end
