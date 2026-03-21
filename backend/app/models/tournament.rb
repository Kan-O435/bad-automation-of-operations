class Tournament < ApplicationRecord
  belongs_to :admin
  has_many :tournament_days, dependent: :destroy
  has_many :tournament_categories, dependent: :destroy

  validates :title, presence: true
end
