class CreateTeamMembers < ActiveRecord::Migration[8.1]
  def change
    create_table :team_members do |t|
      t.references :team, null: false, foreign_key: true
      t.string :name, null: false
      t.integer :gender_type, null: false
      t.integer :age
      t.string :affiliation

      t.timestamps
    end
  end
end
