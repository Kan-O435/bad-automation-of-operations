class LeagueGroup < ApplicationRecord
  belongs_to :tournament_category
  has_many :league_group_entries, dependent: :destroy
  has_many :teams, through: :league_group_entries
  has_many :matches, dependent: :destroy

  validates :name,         presence: true
  validates :group_number, presence: true,
                           numericality: { only_integer: true, greater_than_or_equal_to: 1 }
  validates :group_number, uniqueness: { scope: :tournament_category_id }
end
