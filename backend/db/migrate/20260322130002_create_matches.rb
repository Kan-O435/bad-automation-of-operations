class CreateMatches < ActiveRecord::Migration[8.1]
  def change
    create_table :matches do |t|
      t.references :tournament_category, null: false, foreign_key: true

      t.integer :phase,      null: false  # enum: preliminary / main
      t.integer :match_type, null: false  # enum: league / elimination
      t.integer :round,      null: false
      t.integer :bracket_position         # トーナメント内の位置（elimination のみ）
      t.integer :status,     null: false, default: 0  # enum: pending / in_progress / completed / bye / withdrawn

      # 対戦チーム（予選完了前はNULL許容）
      t.bigint :home_team_id
      t.bigint :away_team_id
      t.bigint :winner_team_id

      # リーグ戦用
      t.references :league_group, foreign_key: true

      # トーナメント進行用（勝者・敗者の次試合）
      t.bigint :next_match_id
      t.bigint :loser_next_match_id

      # league_to_tournament: 本線枠の出所（予選グループの何位か）
      t.bigint  :home_source_group_id
      t.integer :home_source_rank
      t.bigint  :away_source_group_id
      t.integer :away_source_rank

      t.datetime :scheduled_at

      t.timestamps
    end

    add_index :matches, :home_team_id
    add_index :matches, :away_team_id
    add_index :matches, :winner_team_id
    add_index :matches, :next_match_id
    add_index :matches, :home_source_group_id
    add_index :matches, :away_source_group_id

    add_foreign_key :matches, :teams,   column: :home_team_id
    add_foreign_key :matches, :teams,   column: :away_team_id
    add_foreign_key :matches, :teams,   column: :winner_team_id
    add_foreign_key :matches, :matches, column: :next_match_id
    add_foreign_key :matches, :matches, column: :loser_next_match_id
    add_foreign_key :matches, :league_groups, column: :home_source_group_id
    add_foreign_key :matches, :league_groups, column: :away_source_group_id
  end
end
