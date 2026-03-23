module TournamentGeneration
  # シングルエリミネーションのトーナメント表を生成する。
  #
  # teams を直接渡す場合（elimination）と、
  # source_groups を渡す場合（league_to_tournament の本線）の2つのモードがある。
  # source_groups の場合、本線の試合は team_id が nil のまま生成され、
  # 予選完了時に BracketAdvancer が team_id を埋める。
  class EliminationGenerator
    def initialize(category, teams, phase:, source_groups: [])
      @category      = category
      @teams         = teams
      @phase         = phase
      @source_groups = source_groups
    end

    def call
      if @source_groups.any?
        generate_from_groups
      else
        generate_from_teams
      end
    end

    private

    # ---- チームが確定している場合（elimination / シード配置） ----

    def generate_from_teams
      bracket_size = next_power_of_two(@teams.size)
      ordered      = seeded_teams
      slots        = BracketSeeder.call(ordered, bracket_size)
      all_matches  = build_rounds(bracket_size)

      link_rounds(all_matches, bracket_size)
      attach_third_place(all_matches, bracket_size)
      assign_teams_to_first_round(all_matches, slots, bracket_size)
    end

    # ---- 予選グループの勝者が入る場合（league_to_tournament） ----

    def generate_from_groups
      advance_count  = @category.advance_count
      total          = @source_groups.size * advance_count
      bracket_size   = next_power_of_two(total)
      all_matches    = build_rounds(bracket_size)

      link_rounds(all_matches, bracket_size)
      attach_third_place(all_matches, bracket_size)
      assign_sources_to_first_round(all_matches, bracket_size)
    end

    # ---- 共通: ラウンドを生成する ----

    # round 1 = 1回戦, round_count = 決勝
    # bracket_size=8 → 3ラウンド, 各ラウンドの試合数: [4, 2, 1]
    def build_rounds(bracket_size)
      round_count = Math.log2(bracket_size).to_i
      all_matches = {}

      (1..round_count).each do |round|
        matches_in_round = bracket_size / (2**round)
        matches_in_round.times do |position|
          all_matches[[round, position]] = Match.create!(
            tournament_category: @category,
            phase:               @phase,
            match_type:          :elimination,
            round:               round,
            bracket_position:    position,
            status:              :pending
          )
        end
      end

      all_matches
    end

    # 各試合の next_match_id をリンクする
    # [round r, position p] の勝者は [round r+1, position p/2] へ
    def link_rounds(all_matches, bracket_size)
      round_count = Math.log2(bracket_size).to_i

      (1...round_count).each do |round|
        matches_in_round = bracket_size / (2**round)
        matches_in_round.times do |position|
          current    = all_matches[[round, position]]
          next_match = all_matches[[round + 1, position / 2]]
          current.update!(next_match: next_match) if next_match
        end
      end
    end

    # 3位決定戦: has_third_place が true のとき準決勝の敗者同士をリンク
    def attach_third_place(all_matches, bracket_size)
      return unless @category.has_third_place?

      round_count      = Math.log2(bracket_size).to_i
      semifinal_round  = round_count - 1
      semi1 = all_matches[[semifinal_round, 0]]
      semi2 = all_matches[[semifinal_round, 1]]
      return unless semi1 && semi2

      third_place = Match.create!(
        tournament_category: @category,
        phase:               @phase,
        match_type:          :elimination,
        round:               round_count,
        bracket_position:    -1,  # -1 = 3位決定戦専用
        status:              :pending
      )
      semi1.update!(loser_next_match: third_place)
      semi2.update!(loser_next_match: third_place)
    end

    # ---- チーム直接配置 ----

    def assign_teams_to_first_round(all_matches, slots, bracket_size)
      first_round_matches = (bracket_size / 2).times.map { |pos| all_matches[[1, pos]] }

      slots.each_slice(2).with_index do |(home_slot, away_slot), idx|
        match = first_round_matches[idx]
        next unless match

        if home_slot && away_slot
          match.update!(home_team: home_slot, away_team: away_slot)
        elsif home_slot
          # away が BYE → home が自動通過
          match.update!(home_team: home_slot, status: :bye)
          advance_bye(match, home_slot)
        elsif away_slot
          # home が BYE → away が自動通過
          match.update!(away_team: away_slot, status: :bye)
          advance_bye(match, away_slot)
        end
        # 両方 nil（まず起きないが念のため）は pending のまま
      end
    end

    # ---- 予選グループからの配置 ----

    # 配置順: A組1位, B組1位, ..., A組2位, B組2位, ...
    # 上位シードと下位シードが同じハーフに入らないよう蛇行配置
    def assign_sources_to_first_round(all_matches, bracket_size)
      advance_count = @category.advance_count
      source_slots  = build_source_slots(advance_count)

      # BYE 枠を末尾に追加
      source_slots.fill(nil, source_slots.size...bracket_size)

      first_round_matches = (bracket_size / 2).times.map { |pos| all_matches[[1, pos]] }

      source_slots.each_slice(2).with_index do |(home_src, away_src), idx|
        match = first_round_matches[idx]
        next unless match

        attrs = {}
        if home_src
          attrs[:home_source_group] = home_src[:group]
          attrs[:home_source_rank]  = home_src[:rank]
        end
        if away_src
          attrs[:away_source_group] = away_src[:group]
          attrs[:away_source_rank]  = away_src[:rank]
        end
        match.update!(attrs) if attrs.any?
      end
    end

    # シードが高い順（1位）と低い順（2位）を交互に組み合わせる蛇行配置
    # 例: 4グループ advance_count=2 → [A1, B1, C1, D1, D2, C2, B2, A2]
    def build_source_slots(advance_count)
      ranks = (1..advance_count).flat_map { |rank| @source_groups.map { |g| { group: g, rank: rank } } }
      ranks
    end

    # ---- ユーティリティ ----

    def advance_bye(match, team)
      next_m = match.next_match
      return unless next_m
      next_m.home_team_id ? next_m.update!(away_team: team) : next_m.update!(home_team: team)
    end

    def seeded_teams
      seeded   = @teams.select { |t| t.seed_number.present? }.sort_by(&:seed_number)
      unseeded = @teams.reject { |t| t.seed_number.present? }.shuffle
      seeded + unseeded
    end

    def next_power_of_two(n)
      return 2 if n <= 2
      2**Math.log2(n).ceil
    end
  end
end
