class TournamentDay < ApplicationRecord
  belongs_to :tournament

  validates :day, presence: true
end
