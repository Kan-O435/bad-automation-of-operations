module MatchResult
  # ゲームスコアを保存し、試合結果（勝者）を確定させる。
  # 2ゲーム先取で勝者を決定する。
  class GameScoreUpdater
    GAMES_TO_WIN = 2

    def initialize(match, games_params)
      @match       = match
      @games_params = Array(games_params)
    end

    def call
      ActiveRecord::Base.transaction do
        upsert_games
        update_match_result
      end
    end

    private

    def upsert_games
      @games_params.each do |gp|
        game = @match.match_games.find_or_initialize_by(game_number: gp[:game_number])
        game.update!(home_score: gp[:home_score], away_score: gp[:away_score])
      end
    end

    def update_match_result
      games      = @match.match_games.order(:game_number).to_a
      home_wins  = games.count { |g| g.home_score > g.away_score }
      away_wins  = games.count { |g| g.away_score > g.home_score }

      if home_wins >= GAMES_TO_WIN
        complete_match(@match.home_team)
      elsif away_wins >= GAMES_TO_WIN
        complete_match(@match.away_team)
      else
        @match.update!(status: :in_progress)
      end
    end

    def complete_match(winner)
      @match.update!(winner_team: winner, status: :completed)
      LeagueEntryUpdater.new(@match).call if @match.league?
      BracketAdvancer.new(@match, winner).call
    end
  end
end
