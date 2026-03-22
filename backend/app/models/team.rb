class Team < ApplicationRecord
  belongs_to :tournament_category
  has_many :team_members, dependent: :destroy

  validates :name, presence: true
  validates :seed_number,
            numericality: { only_integer: true, greater_than_or_equal_to: 1 },
            allow_nil: true
end
