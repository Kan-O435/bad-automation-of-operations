class TournamentDaysController < ApplicationController
  before_action :authenticate_admin!
  before_action :set_tournament
  before_action :set_tournament_day, only: [:destroy]

  def create
    @tournament_day = @tournament.tournament_days.build(tournament_day_params)

    if @tournament_day.save
      render json: @tournament_day, status: :created
    else
      render json: { errors: @tournament_day.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def destroy
    @tournament_day.destroy
    head :no_content
  end

  private

  def set_tournament
    @tournament = current_admin.tournaments.find(params[:tournament_id])
  rescue ActiveRecord::RecordNotFound
    render json: { error: "Tournament not found" }, status: :not_found
  end

  def set_tournament_day
    @tournament_day = @tournament.tournament_days.find(params[:id])
  rescue ActiveRecord::RecordNotFound
    render json: { error: "Tournament day not found" }, status: :not_found
  end

  def tournament_day_params
    params.require(:tournament_day).permit(:day)
  end
end
