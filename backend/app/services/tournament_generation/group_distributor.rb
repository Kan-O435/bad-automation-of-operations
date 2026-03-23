module TournamentGeneration
  # チームをグループに振り分ける。
  # 同じ affiliation のチームが同グループにならないよう優先的に配置する。
  class GroupDistributor
    def initialize(teams, group_count)
      @teams       = teams
      @group_count = group_count
    end

    # @return [Array<Array<Team>>] グループ数分の配列
    def call
      groups = Array.new(@group_count) { [] }

      # 所属ごとにまとめ、人数が多い所属から処理することで分散しやすくする
      by_affiliation = @teams.group_by { |t| t.affiliation.to_s }
      sorted = by_affiliation.sort_by { |_, v| -v.size }

      sorted.each do |_, affiliation_teams|
        affiliation_teams.shuffle.each do |team|
          target = groups.min_by { |g| [same_affiliation_count(g, team), g.size] }
          target << team
        end
      end

      groups
    end

    private

    def same_affiliation_count(group, team)
      return 0 if team.affiliation.blank?
      group.count { |t| t.affiliation == team.affiliation }
    end
  end
end
