module TournamentGeneration
  # 予選リーグのグループ・試合を生成する。
  # グループ数は category.group_count が設定されていればそれを使い、
  # なければ ceil(teams / group_size) で自動計算する。
  class LeagueGenerator
    GROUP_NAMES = ("A".."Z").to_a.freeze

    def initialize(category, teams, phase:)
      @category = category
      @teams    = teams
      @phase    = phase
    end

    # @return [Array<LeagueGroup>]
    def call
      group_count  = calculate_group_count
      distributed  = GroupDistributor.new(@teams, group_count).call

      distributed.each_with_index.map do |group_teams, index|
        create_group(group_teams, index)
      end
    end

    private

    def calculate_group_count
      return @category.group_count if @category.group_count.present?
      (@teams.size.to_f / @category.group_size).ceil
    end

    def create_group(teams, index)
      group = LeagueGroup.create!(
        tournament_category: @category,
        name:                "#{GROUP_NAMES[index]}組",
        group_number:        index + 1
      )

      teams.each { |team| LeagueGroupEntry.create!(league_group: group, team: team) }
      generate_round_robin_matches(group, teams)
      group
    end

    # グループ内の全チームの組み合わせ（総当たり）で試合を生成する
    def generate_round_robin_matches(group, teams)
      teams.combination(2).each do |home, away|
        Match.create!(
          tournament_category: @category,
          phase:               @phase,
          match_type:          :league,
          round:               1,
          league_group:        group,
          home_team:           home,
          away_team:           away,
          status:              :pending
        )
      end
    end
  end
end
