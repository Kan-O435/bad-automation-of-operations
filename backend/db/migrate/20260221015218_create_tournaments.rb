class CreateTournaments < ActiveRecord::Migration[8.1]
  def change
    create_table :tournaments do |t|
      t.string :title
      t.text :detail

      t.timestamps
    end
  end
end
