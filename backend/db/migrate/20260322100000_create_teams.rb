class CreateTeams < ActiveRecord::Migration[8.1]
  def change
    create_table :teams do |t|
      t.references :tournament_category, null: false, foreign_key: true
      t.string :name, null: false
      t.integer :seed_number

      t.timestamps
    end
  end
end
