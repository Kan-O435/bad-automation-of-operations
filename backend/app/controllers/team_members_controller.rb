class TeamMembersController < ApplicationController
  before_action :authenticate_admin!
  before_action :set_tournament
  before_action :set_category
  before_action :set_team
  before_action :set_team_member, only: [:update, :destroy]

  # POST /tournaments/:tournament_id/tournament_categories/:tournament_category_id/teams/:team_id/team_members
  def create
    team_member = @team.team_members.build(team_member_params)

    if team_member.save
      render json: team_member, status: :created
    else
      render json: { errors: team_member.errors.full_messages }, status: :unprocessable_entity
    end
  rescue ArgumentError => e
    render json: { errors: [e.message] }, status: :unprocessable_entity
  end

  # PATCH /tournaments/:tournament_id/tournament_categories/:tournament_category_id/teams/:team_id/team_members/:id
  def update
    if @team_member.update(team_member_params)
      render json: @team_member, status: :ok
    else
      render json: { errors: @team_member.errors.full_messages }, status: :unprocessable_entity
    end
  rescue ArgumentError => e
    render json: { errors: [e.message] }, status: :unprocessable_entity
  end

  # DELETE /tournaments/:tournament_id/tournament_categories/:tournament_category_id/teams/:team_id/team_members/:id
  def destroy
    @team_member.destroy
    head :no_content
  end

  private

  def set_tournament
    @tournament = current_admin.tournaments.find(params[:tournament_id])
  rescue ActiveRecord::RecordNotFound
    render json: { error: "Tournament not found" }, status: :not_found
  end

  def set_category
    @category = @tournament.tournament_categories.find(params[:tournament_category_id])
  rescue ActiveRecord::RecordNotFound
    render json: { error: "Category not found" }, status: :not_found
  end

  def set_team
    @team = @category.teams.find(params[:team_id])
  rescue ActiveRecord::RecordNotFound
    render json: { error: "Team not found" }, status: :not_found
  end

  def set_team_member
    @team_member = @team.team_members.find(params[:id])
  rescue ActiveRecord::RecordNotFound
    render json: { error: "Team member not found" }, status: :not_found
  end

  def team_member_params
    params.require(:team_member).permit(:name, :gender_type, :age, :affiliation)
  end
end
