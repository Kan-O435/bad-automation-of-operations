class TeamsController < ApplicationController
  before_action :authenticate_admin!
  before_action :set_tournament
  before_action :set_category
  before_action :set_team, only: [:update, :destroy]

  # GET /tournaments/:tournament_id/tournament_categories/:tournament_category_id/teams
  def index
    teams = @category.teams.includes(:team_members)
    render json: teams.as_json(include: :team_members), status: :ok
  end

  # POST /tournaments/:tournament_id/tournament_categories/:tournament_category_id/teams
  def create
    team = @category.teams.build(team_params)

    if team.save
      render json: team.as_json(include: :team_members), status: :created
    else
      render json: { errors: team.errors.full_messages }, status: :unprocessable_entity
    end
  end

  # PATCH /tournaments/:tournament_id/tournament_categories/:tournament_category_id/teams/:id
  def update
    if @team.update(team_params)
      render json: @team.as_json(include: :team_members), status: :ok
    else
      render json: { errors: @team.errors.full_messages }, status: :unprocessable_entity
    end
  end

  # DELETE /tournaments/:tournament_id/tournament_categories/:tournament_category_id/teams/:id
  def destroy
    @team.destroy
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
    @team = @category.teams.find(params[:id])
  rescue ActiveRecord::RecordNotFound
    render json: { error: "Team not found" }, status: :not_found
  end

  def team_params
    params.require(:team).permit(:name, :seed_number, :affiliation)
  end
end
