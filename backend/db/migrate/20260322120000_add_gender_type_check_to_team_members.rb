class AddGenderTypeCheckToTeamMembers < ActiveRecord::Migration[8.1]
  def up
    # gender_type は 0=men, 1=women のみ許可（2=mixed は不正）
    add_check_constraint :team_members,
                         "gender_type IN (0, 1)",
                         name: "check_team_members_gender_type"
  end

  def down
    remove_check_constraint :team_members, name: "check_team_members_gender_type"
  end
end
