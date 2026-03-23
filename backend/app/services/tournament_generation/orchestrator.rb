module TournamentGeneration
  # format_type に応じて適切なジェネレーターを呼び出すエントリーポイント。
  # 生成済みの場合は再生成しないようガードする。
  class Orchestrator
    class AlreadyGeneratedError < StandardError; end

    def initialize(category)
      @category = category
    end

    def call
      raise AlreadyGeneratedError, "すでに生成済みです" if already_generated?

      ActiveRecord::Base.transaction do
        case @category.format_type
        when "elimination"          then generate_elimination
        when "league"               then generate_league
        when "league_to_tournament" then generate_league_to_tournament
        end
      end
    end

    private

    def generate_elimination
      EliminationGenerator.new(@category, ordered_teams, phase: :main).call
    end

    def generate_league
      LeagueGenerator.new(@category, @category.teams.to_a, phase: :preliminary).call
    end

    def generate_league_to_tournament
      teams  = @category.teams.to_a
      groups = LeagueGenerator.new(@category, teams, phase: :preliminary).call
      EliminationGenerator.new(@category, [], phase: :main, source_groups: groups).call
    end

    def ordered_teams
      seeded   = @category.teams.where.not(seed_number: nil).order(:seed_number).to_a
      unseeded = @category.teams.where(seed_number: nil).to_a.shuffle
      seeded + unseeded
    end

    def already_generated?
      @category.matches.exists?
    end
  end
end
