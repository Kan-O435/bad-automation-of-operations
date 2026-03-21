class FixTournamentCategoriesConstraints < ActiveRecord::Migration[8.1]
  def up

    change_column :tournament_categories, :age_type, :string,
                  null: false,
                  using: "age_type::text"


    execute "UPDATE tournament_categories SET rank = '' WHERE rank IS NULL"
    change_column_null :tournament_categories, :rank, false
  end

  def down
    change_column_null :tournament_categories, :rank, true
    change_column :tournament_categories, :age_type, :integer,
                  null: true,
                  default: 0
  end
end
