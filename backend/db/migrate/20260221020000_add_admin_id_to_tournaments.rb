class AddAdminIdToTournaments < ActiveRecord::Migration[8.1]
  def change
    add_reference :tournaments, :admin, null: false, foreign_key: true
  end
end
