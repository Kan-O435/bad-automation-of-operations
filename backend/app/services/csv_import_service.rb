# frozen_string_literal: true

require "csv"

class CsvImportService
  GENDER_MAP = {
    "男" => "men",
    "0" => "men",
    "女" => "women",
    "1" => "women"
  }.freeze

  GENDER_TYPE_LABELS = { "men" => "男子", "women" => "女子", "mixed" => "混合" }.freeze
  EVENT_TYPE_LABELS  = { "singles" => "シングルス", "doubles" => "ダブルス", "mixed_doubles" => "ミックスダブルス" }.freeze

  Result = Struct.new(:success_count, :errors, keyword_init: true)

  def initialize(tournament, csv_data)
    @tournament = tournament
    @csv_data = csv_data.sub("\xEF\xBB\xBF", "").force_encoding("UTF-8")
    # カテゴリを表示名 → オブジェクトのマップとして事前構築
    @category_map = build_category_map
  end

  def call
    errors = []
    success_count = 0

    rows = CSV.parse(@csv_data, headers: true)

    rows.each_with_index do |row, idx|
      row_num = idx + 2

      error_message = process_row(row)
      if error_message
        errors << { row: row_num, message: error_message }
      else
        success_count += 1
      end
    end

    Result.new(success_count: success_count, errors: errors)
  rescue CSV::MalformedCSVError => e
    Result.new(success_count: 0, errors: [{ row: 0, message: "CSVの形式が正しくありません: #{e.message}" }])
  end

  private

  # カテゴリの表示名（例: "男子 シングルス 一般 A"）→ TournamentCategory のマップを作る
  def build_category_map
    @tournament.tournament_categories.each_with_object({}) do |cat, map|
      map[category_label(cat)] = cat
    end
  end

  def category_label(cat)
    [
      GENDER_TYPE_LABELS[cat.gender_type],
      EVENT_TYPE_LABELS[cat.event_type],
      cat.age_type.presence,
      cat.rank.present? ? "(#{cat.rank})" : nil
    ].compact.join(" ")
  end

  def process_row(row)
    category_name = row["カテゴリ"]&.strip
    team_name     = row["チーム名"]&.strip
    p1_name       = row["選手1 名前"]&.strip
    p1_aff        = row["選手1 所属"]&.strip
    p1_gender_raw = row["選手1 性別"]&.strip
    p2_name       = row["選手2 名前"]&.strip
    p2_aff        = row["選手2 所属"]&.strip
    p2_gender_raw = row["選手2 性別"]&.strip
    seed_raw      = row["シード番号"]&.strip

    return "カテゴリが入力されていません" if category_name.blank?
    return "チーム名が入力されていません" if team_name.blank?
    return "選手1 名前が入力されていません" if p1_name.blank?
    return "選手1 性別が入力されていません" if p1_gender_raw.blank?

    category = @category_map[category_name]
    return "カテゴリ「#{category_name}」が見つかりません" if category.nil?

    p1_gender = GENDER_MAP[p1_gender_raw]
    return "選手1 性別が不正です（#{p1_gender_raw}）" if p1_gender.nil?

    p2_present        = p2_name.present?
    p2_gender_present = p2_gender_raw.present?

    if p2_present && !p2_gender_present
      return "選手2 性別が入力されていません"
    end
    if !p2_present && p2_gender_present
      return "選手2 名前が入力されていません"
    end

    p2_gender = nil
    if p2_present
      p2_gender = GENDER_MAP[p2_gender_raw]
      return "選手2 性別が不正です（#{p2_gender_raw}）" if p2_gender.nil?
    end

    seed_number = seed_raw.present? ? seed_raw.to_i : nil

    ActiveRecord::Base.transaction do
      team = category.teams.create!(
        name: team_name,
        seed_number: seed_number
      )

      team.team_members.create!(
        name: p1_name,
        affiliation: p1_aff.presence,
        gender_type: p1_gender
      )

      if p2_present
        team.team_members.create!(
          name: p2_name,
          affiliation: p2_aff.presence,
          gender_type: p2_gender
        )
      end
    end

    nil
  rescue ActiveRecord::RecordInvalid => e
    e.record.errors.full_messages.first
  end
end
