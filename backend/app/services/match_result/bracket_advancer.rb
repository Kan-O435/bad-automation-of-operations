module MatchResult
  # 試合完了時に次の試合へチームを進出させる。
  # - トーナメント: 勝者を next_match へ、敗者を loser_next_match（3位決定戦）へ
  # - リーグ: グループ全試合が完了したら advance_count 位以内のチームを本線スロットへ
  class BracketAdvancer
    def initialize(match, winner)
      @match  = match
      @winner = winner
      @loser  = winner == @match.home_team ? @match.away_team : @match.home_team
    end

    def call
      advance_winner_to_next_match
      advance_loser_to_third_place
      check_group_completion if @match.league?
    end

    private

    def advance_winner_to_next_match
      fill_slot(@match.next_match, @winner)
    end

    def advance_loser_to_third_place
      fill_slot(@match.loser_next_match, @loser)
    end

    def fill_slot(target_match, team)
      return unless target_match && team
      if target_match.home_team_id.nil?
        target_match.update!(home_team: team)
      else
        target_match.update!(away_team: team)
      end
    end

    # グループ内の全試合が完了したら上位 advance_count チームを本線へ進出させる
    def check_group_completion
      group       = @match.league_group
      all_matches = Match.where(league_group: group)
      return unless all_matches.all?(&:completed?)

      advance_count = group.tournament_category.advance_count
      return unless advance_count.present?

      LeagueGroupEntry.where(league_group: group)
                      .where.not(rank: nil)
                      .order(:rank)
                      .limit(advance_count)
                      .each { |entry| fill_main_tournament_slot(group, entry.rank, entry.team) }
    end

    def fill_main_tournament_slot(group, rank, team)
      Match.where(home_source_group: group, home_source_rank: rank, phase: :main)
           .each { |m| m.update!(home_team: team) }
      Match.where(away_source_group: group, away_source_rank: rank, phase: :main)
           .each { |m| m.update!(away_team: team) }
    end
  end
end
