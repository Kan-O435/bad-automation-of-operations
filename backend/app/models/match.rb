class Match < ApplicationRecord
  belongs_to :tournament_category
  belongs_to :home_team,   class_name: "Team", optional: true
  belongs_to :away_team,   class_name: "Team", optional: true
  belongs_to :winner_team, class_name: "Team", optional: true
  belongs_to :league_group,       optional: true
  belongs_to :next_match,         class_name: "Match", optional: true
  belongs_to :loser_next_match,   class_name: "Match", optional: true
  belongs_to :home_source_group,  class_name: "LeagueGroup", optional: true
  belongs_to :away_source_group,  class_name: "LeagueGroup", optional: true

  has_many :match_games, dependent: :destroy

  enum :phase,      { preliminary: 0, main: 1 }
  enum :match_type, { league: 0, elimination: 1 }
  enum :status,     { pending: 0, in_progress: 1, completed: 2, bye: 3, withdrawn: 4 }

  validates :phase, :match_type, :round, :status, presence: true
  validates :round, numericality: { only_integer: true, greater_than_or_equal_to: 1 }

  # 本線の表示用ラベル（チームが未確定の場合はグループ名で表示）
  def home_display_name
    home_team&.name || home_source_label
  end

  def away_display_name
    away_team&.name || away_source_label
  end

  private

  def home_source_label
    return nil unless home_source_group && home_source_rank
    "#{home_source_group.name}#{home_source_rank}位"
  end

  def away_source_label
    return nil unless away_source_group && away_source_rank
    "#{away_source_group.name}#{away_source_rank}位"
  end
end
