class CreateLeagueGroups < ActiveRecord::Migration[8.1]
  def change
    create_table :league_groups do |t|
      t.references :tournament_category, null: false, foreign_key: true
      t.string  :name,         null: false
      t.integer :group_number, null: false

      t.timestamps
    end
  end
end
