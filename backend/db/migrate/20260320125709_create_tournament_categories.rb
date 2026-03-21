class CreateTournamentCategories < ActiveRecord::Migration[8.1]
  def change
    create_table :tournament_categories do |t|
      t.references :tournament, null: false, foreign_key: true

      # 基本情報
      t.integer :gender_type, null: false
      t.integer :event_type, null: false
      t.integer :age_type, default: 0
      t.string  :rank

      # 試合形式
      t.integer :format_type, null: false

      # 詳細設定
      t.integer :max_participants
      t.integer :group_size
      t.integer :group_count
      t.integer :advance_count
      t.boolean :has_third_place, default: false

      t.timestamps
    end
  end
end