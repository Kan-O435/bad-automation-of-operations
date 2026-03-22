class MatchGame < ApplicationRecord
  belongs_to :match

  validates :game_number, presence: true,
                          numericality: { only_integer: true, greater_than_or_equal_to: 1, less_than_or_equal_to: 3 }
  validates :home_score, :away_score, presence: true,
                                      numericality: { only_integer: true, greater_than_or_equal_to: 0 }
  validates :game_number, uniqueness: { scope: :match_id }
end
