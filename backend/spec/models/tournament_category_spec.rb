require 'rails_helper'

RSpec.describe TournamentCategory, type: :model do
  # テスト用の有効な親レコード
  let(:tournament) { Tournament.create!(title: "テスト大会", admin: Admin.create!(name: "Admin", email: "a@example.com", password: "password123")) }

  # format ごとの有効な属性を返すヘルパー
  def valid_attrs(format_type:, overrides: {})
    base = {
      tournament: tournament,
      gender_type: :men,
      event_type: :singles,
      rank: "A",
      format_type: format_type
    }

    format_specific =
      case format_type.to_s
      when "elimination"
        { max_participants: 16 }
      when "league"
        { group_size: 4 }
      when "league_to_tournament"
        { group_size: 4, advance_count: 2, max_participants: 8 }
      else
        {}
      end

    base.merge(format_specific).merge(overrides)
  end

  # -------------------------------------------------------
  # 基本的な必須フィールド
  # -------------------------------------------------------
  describe "必須フィールドのバリデーション" do
    it "有効な属性（elimination）でバリデーションが通る" do
      expect(TournamentCategory.new(valid_attrs(format_type: :elimination))).to be_valid
    end

    it "有効な属性（league）でバリデーションが通る" do
      expect(TournamentCategory.new(valid_attrs(format_type: :league))).to be_valid
    end

    it "有効な属性（league_to_tournament）でバリデーションが通る" do
      expect(TournamentCategory.new(valid_attrs(format_type: :league_to_tournament))).to be_valid
    end

    it "rank がない場合は無効" do
      model = TournamentCategory.new(valid_attrs(format_type: :elimination, overrides: { rank: nil }))
      expect(model).not_to be_valid
      expect(model.errors[:rank]).to be_present
    end

    it "rank が空文字の場合は無効" do
      model = TournamentCategory.new(valid_attrs(format_type: :elimination, overrides: { rank: "" }))
      expect(model).not_to be_valid
    end
  end

  # -------------------------------------------------------
  # age_type は任意
  # -------------------------------------------------------
  describe "age_type は任意" do
    it "age_type が nil でもバリデーションが通る" do
      model = TournamentCategory.new(valid_attrs(format_type: :elimination, overrides: { age_type: nil }))
      expect(model).to be_valid
    end

    it "age_type が空文字でもバリデーションが通る" do
      model = TournamentCategory.new(valid_attrs(format_type: :elimination, overrides: { age_type: "" }))
      expect(model).to be_valid
    end

    it "age_type に値を設定することもできる" do
      model = TournamentCategory.new(valid_attrs(format_type: :elimination, overrides: { age_type: "一般" }))
      expect(model).to be_valid
      expect(model.age_type).to eq("一般")
    end
  end

  # -------------------------------------------------------
  # format_type: elimination
  # -------------------------------------------------------
  describe "format_type: elimination" do
    it "max_participants がない場合は無効" do
      model = TournamentCategory.new(valid_attrs(format_type: :elimination, overrides: { max_participants: nil }))
      expect(model).not_to be_valid
      expect(model.errors[:max_participants]).to be_present
    end

    it "max_participants が 1 の場合は無効（2以上必須）" do
      model = TournamentCategory.new(valid_attrs(format_type: :elimination, overrides: { max_participants: 1 }))
      expect(model).not_to be_valid
    end

    it "max_participants が 2 の場合は有効" do
      model = TournamentCategory.new(valid_attrs(format_type: :elimination, overrides: { max_participants: 2 }))
      expect(model).to be_valid
    end

    it "group_size は不要" do
      model = TournamentCategory.new(valid_attrs(format_type: :elimination, overrides: { group_size: nil }))
      expect(model).to be_valid
    end

    it "advance_count は不要" do
      model = TournamentCategory.new(valid_attrs(format_type: :elimination, overrides: { advance_count: nil }))
      expect(model).to be_valid
    end
  end

  # -------------------------------------------------------
  # format_type: league
  # -------------------------------------------------------
  describe "format_type: league" do
    it "group_size がない場合は無効" do
      model = TournamentCategory.new(valid_attrs(format_type: :league, overrides: { group_size: nil }))
      expect(model).not_to be_valid
      expect(model.errors[:group_size]).to be_present
    end

    it "group_size が 0 の場合は無効（1以上必須）" do
      model = TournamentCategory.new(valid_attrs(format_type: :league, overrides: { group_size: 0 }))
      expect(model).not_to be_valid
    end

    it "group_size が 1 の場合は有効" do
      model = TournamentCategory.new(valid_attrs(format_type: :league, overrides: { group_size: 1 }))
      expect(model).to be_valid
    end

    it "max_participants は不要" do
      model = TournamentCategory.new(valid_attrs(format_type: :league, overrides: { max_participants: nil }))
      expect(model).to be_valid
    end

    it "advance_count は不要" do
      model = TournamentCategory.new(valid_attrs(format_type: :league, overrides: { advance_count: nil }))
      expect(model).to be_valid
    end
  end

  # -------------------------------------------------------
  # format_type: league_to_tournament
  # -------------------------------------------------------
  describe "format_type: league_to_tournament" do
    it "group_size がない場合は無効" do
      model = TournamentCategory.new(valid_attrs(format_type: :league_to_tournament, overrides: { group_size: nil }))
      expect(model).not_to be_valid
    end

    it "advance_count がない場合は無効" do
      model = TournamentCategory.new(valid_attrs(format_type: :league_to_tournament, overrides: { advance_count: nil }))
      expect(model).not_to be_valid
    end

    it "advance_count が 0 の場合は無効（1以上必須）" do
      model = TournamentCategory.new(valid_attrs(format_type: :league_to_tournament, overrides: { advance_count: 0 }))
      expect(model).not_to be_valid
    end

    it "max_participants がない場合は無効" do
      model = TournamentCategory.new(valid_attrs(format_type: :league_to_tournament, overrides: { max_participants: nil }))
      expect(model).not_to be_valid
    end

    it "max_participants が 1 の場合は無効（2以上必須）" do
      model = TournamentCategory.new(valid_attrs(format_type: :league_to_tournament, overrides: { max_participants: 1 }))
      expect(model).not_to be_valid
    end
  end

  # -------------------------------------------------------
  # アソシエーション
  # -------------------------------------------------------
  describe "アソシエーション" do
    it "Tournament に belongs_to している" do
      category = TournamentCategory.new(valid_attrs(format_type: :elimination))
      expect(category.tournament).to eq(tournament)
    end

    it "tournament_id がない場合は無効" do
      attrs = valid_attrs(format_type: :elimination)
      attrs.delete(:tournament)
      model = TournamentCategory.new(attrs.merge(tournament_id: nil))
      expect(model).not_to be_valid
    end
  end
end
