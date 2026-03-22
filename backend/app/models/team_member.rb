class TeamMember < ApplicationRecord
  belongs_to :team

  enum :gender_type, { men: 0, women: 1 }

  validates :name, presence: true
  validates :gender_type, presence: true
  validates :age,
            numericality: { only_integer: true, greater_than_or_equal_to: 0 },
            allow_nil: true
end
