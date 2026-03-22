class TournamentCategory < ApplicationRecord
  belongs_to :tournament
  has_many :teams,          dependent: :destroy
  has_many :league_groups,  dependent: :destroy
  has_many :matches,        dependent: :destroy

  enum :gender_type, { men: 0, women: 1, mixed: 2 }

  enum :event_type, { singles: 0, doubles: 1, mixed_doubles: 2 }

  enum :format_type, { elimination: 0, league: 1, league_to_tournament: 2 }

  validates :gender_type,  presence: true
  validates :event_type,   presence: true
  validates :format_type,  presence: true
  validates :rank,         presence: true
  # age_type は任意（年齢区分がない大会も多いため）

  with_options if: :league_needed? do
    validates :group_size, presence: true,
                           numericality: { only_integer: true, greater_than_or_equal_to: 1 }
  end

  with_options if: :finals_needed? do
    validates :advance_count, presence: true,
                              numericality: { only_integer: true, greater_than_or_equal_to: 1 }
  end

  with_options if: :tournament_needed? do
    validates :max_participants, presence: true,
                                 numericality: { only_integer: true, greater_than_or_equal_to: 2 }
  end

  private

  def league_needed?
    league? || league_to_tournament?
  end

  def finals_needed?
    league_to_tournament?
  end

  def tournament_needed?
    elimination? || league_to_tournament?
  end
end
