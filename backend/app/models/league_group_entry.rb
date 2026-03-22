class LeagueGroupEntry < ApplicationRecord
  belongs_to :league_group
  belongs_to :team

  validates :wins, :losses, :games_won, :games_lost, :points_won, :points_lost,
            numericality: { only_integer: true, greater_than_or_equal_to: 0 }
  validates :rank, numericality: { only_integer: true, greater_than_or_equal_to: 1 },
                   allow_nil: true
  validates :team_id, uniqueness: { scope: :league_group_id }

  # 順位決定: 勝数 → ゲーム率 → 得点率
  def self.ranked
    ranked_from(all.to_a)
  end

  def self.ranked_from(entries)
    entries.sort_by do |e|
      game_rate  = e.games_lost.zero?  ? Float::INFINITY : e.games_won.to_f  / e.games_lost
      point_rate = e.points_lost.zero? ? Float::INFINITY : e.points_won.to_f / e.points_lost
      [-e.wins, -game_rate, -point_rate]
    end
  end
end
