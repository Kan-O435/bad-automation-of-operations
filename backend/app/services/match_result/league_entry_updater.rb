module MatchResult
  # リーグ戦の試合完了時に league_group_entries の勝敗・得点を更新し、順位を再計算する。
  class LeagueEntryUpdater
    def initialize(match)
      @match = match
    end

    def call
      return unless @match.league_group_id.present?

      games           = @match.match_games.order(:game_number)
      home_games_won  = games.count { |g| g.home_score > g.away_score }
      away_games_won  = games.count { |g| g.away_score > g.home_score }
      home_points_won = games.sum(&:home_score)
      away_points_won = games.sum(&:away_score)

      home_won = @match.winner_team_id == @match.home_team_id

      update_entry(@match.home_team_id,
                   won:          home_won,
                   games_won:    home_games_won,
                   games_lost:   away_games_won,
                   points_won:   home_points_won,
                   points_lost:  away_points_won)

      update_entry(@match.away_team_id,
                   won:          !home_won,
                   games_won:    away_games_won,
                   games_lost:   home_games_won,
                   points_won:   away_points_won,
                   points_lost:  home_points_won)

      recalculate_ranks
    end

    private

    def update_entry(team_id, won:, games_won:, games_lost:, points_won:, points_lost:)
      entry = LeagueGroupEntry.find_by!(
        league_group_id: @match.league_group_id,
        team_id:         team_id
      )
      entry.increment!(:wins,        won ? 1 : 0)
      entry.increment!(:losses,      won ? 0 : 1)
      entry.increment!(:games_won,   games_won)
      entry.increment!(:games_lost,  games_lost)
      entry.increment!(:points_won,  points_won)
      entry.increment!(:points_lost, points_lost)
    end

    def recalculate_ranks
      entries = LeagueGroupEntry.where(league_group_id: @match.league_group_id).to_a
      LeagueGroupEntry.ranked_from(entries).each_with_index do |entry, index|
        entry.update_column(:rank, index + 1)
      end
    end
  end
end
