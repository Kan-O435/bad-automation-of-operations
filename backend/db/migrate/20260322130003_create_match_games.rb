class CreateMatchGames < ActiveRecord::Migration[8.1]
  def change
    create_table :match_games do |t|
      t.references :match, null: false, foreign_key: true

      t.integer :game_number, null: false  # 1, 2, 3
      t.integer :home_score,  null: false
      t.integer :away_score,  null: false

      t.timestamps
    end

    add_index :match_games, [:match_id, :game_number], unique: true
  end
end
