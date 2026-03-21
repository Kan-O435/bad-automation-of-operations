class MakeAgeTypeOptional < ActiveRecord::Migration[8.1]
  def change
    # age_type を任意項目に変更（デフォルト空文字、NULL許容）
    change_column :tournament_categories, :age_type, :string, default: "", null: true
  end
end
