class CreateTournamentDays < ActiveRecord::Migration[8.1]
  def change
    create_table :tournament_days do |t|
      t.date :day
      t.references :tournament, null: false, foreign_key: true

      t.timestamps
    end
  end
end
