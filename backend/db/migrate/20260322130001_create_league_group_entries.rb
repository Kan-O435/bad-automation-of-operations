class CreateLeagueGroupEntries < ActiveRecord::Migration[8.1]
  def change
    create_table :league_group_entries do |t|
      t.references :league_group, null: false, foreign_key: true
      t.references :team,         null: false, foreign_key: true

      t.integer :wins,         null: false, default: 0
      t.integer :losses,       null: false, default: 0
      t.integer :games_won,    null: false, default: 0
      t.integer :games_lost,   null: false, default: 0
      t.integer :points_won,   null: false, default: 0
      t.integer :points_lost,  null: false, default: 0
      t.integer :rank

      t.timestamps
    end

    add_index :league_group_entries, [:league_group_id, :team_id], unique: true
  end
end
