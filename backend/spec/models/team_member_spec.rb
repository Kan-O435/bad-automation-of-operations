require 'rails_helper'

RSpec.describe TeamMember, type: :model do
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
  let(:team) { Team.create!(tournament_category: category, name: "テストチーム") }

  def valid_attrs(overrides = {})
    { team: team, name: "田中 太郎", gender_type: :men }.merge(overrides)
  end

  # -------------------------------------------------------
  # バリデーション
  # -------------------------------------------------------
  describe "バリデーション" do
    it "有効な属性でバリデーションが通る" do
      expect(TeamMember.new(valid_attrs)).to be_valid
    end

    it "name がない場合は無効" do
      member = TeamMember.new(valid_attrs(name: nil))
      expect(member).not_to be_valid
      expect(member.errors[:name]).to be_present
    end

    it "name が空文字の場合は無効" do
      member = TeamMember.new(valid_attrs(name: ""))
      expect(member).not_to be_valid
    end

    it "gender_type がない場合は無効" do
      member = TeamMember.new(valid_attrs(gender_type: nil))
      expect(member).not_to be_valid
      expect(member.errors[:gender_type]).to be_present
    end

    it "team がない場合は無効" do
      member = TeamMember.new(valid_attrs(team: nil))
      expect(member).not_to be_valid
    end

    context "age のバリデーション" do
      it "age が nil でも有効（任意項目）" do
        expect(TeamMember.new(valid_attrs(age: nil))).to be_valid
      end

      it "age が 0 以上の整数は有効" do
        expect(TeamMember.new(valid_attrs(age: 0))).to be_valid
        expect(TeamMember.new(valid_attrs(age: 25))).to be_valid
      end

      it "age が負の数の場合は無効" do
        member = TeamMember.new(valid_attrs(age: -1))
        expect(member).not_to be_valid
        expect(member.errors[:age]).to be_present
      end

      it "age が小数の場合は無効" do
        member = TeamMember.new(valid_attrs(age: 20.5))
        expect(member).not_to be_valid
      end
    end
  end

  # -------------------------------------------------------
  # gender_type の enum（men / women のみ許可）
  # -------------------------------------------------------
  describe "gender_type の enum" do
    it "gender_type: men は有効" do
      expect(TeamMember.new(valid_attrs(gender_type: :men))).to be_valid
    end

    it "gender_type: women は有効" do
      expect(TeamMember.new(valid_attrs(gender_type: :women))).to be_valid
    end

    it "gender_type: mixed は ArgumentError が発生する（enumに存在しない）" do
      expect {
        TeamMember.new(valid_attrs(gender_type: :mixed))
      }.to raise_error(ArgumentError)
    end

    it "gender_type に不正な文字列を渡すと ArgumentError が発生する" do
      expect {
        TeamMember.new(valid_attrs(gender_type: "invalid"))
      }.to raise_error(ArgumentError)
    end
  end

  # -------------------------------------------------------
  # アソシエーション
  # -------------------------------------------------------
  describe "アソシエーション" do
    it "team に belongs_to している" do
      member = TeamMember.new(valid_attrs)
      expect(member.team).to eq(team)
    end
  end
end
