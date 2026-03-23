module TournamentGeneration
  # シード番号に基づいてトーナメントのスロットを決定する。
  # 標準シード配置: 1位と最下位が反対側のハーフに入るよう再帰的に配置。
  #
  # bracket_size=8 の場合のスロット順: [1, 8, 4, 5, 2, 7, 3, 6]
  # → 1回戦: 1v8, 4v5, 2v7, 3v6
  class BracketSeeder
    # @param teams [Array<Team>] シード順に並んでいることを期待（シードなしは末尾）
    # @param bracket_size [Integer] 2の累乗
    # @return [Array<Team, nil>] bracket_size 個のスロット。BYE枠は nil
    def self.call(teams, bracket_size)
      seed_order = generate_seed_order(bracket_size)
      seed_order.map { |seed| seed <= teams.size ? teams[seed - 1] : nil }
    end

    # @return [Array<Integer>] シード番号の配置順
    def self.generate_seed_order(n)
      slots = [1]
      slots = slots.flat_map { |s| [s, n + 1 - s] } while slots.size < n
      slots
    end
    private_class_method :generate_seed_order
  end
end
