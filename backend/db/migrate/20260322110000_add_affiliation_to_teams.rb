class AddAffiliationToTeams < ActiveRecord::Migration[8.1]
  def change
    add_column :teams, :affiliation, :string
  end
end
