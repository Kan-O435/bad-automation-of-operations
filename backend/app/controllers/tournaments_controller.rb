class TournamentsController < ApplicationController
  before_action :authenticate_admin!
  before_action :set_tournament, only: [:show, :update, :destroy]

  def index
    @tournaments = current_admin.tournaments.includes(:tournament_days)
    render json: @tournaments.as_json(include: { tournament_days: { only: [:id, :day] } })
  end

  def show
    render json: @tournament.as_json(include: { tournament_days: { only: [:id, :day] } })
  end

  def create
    @tournament = current_admin.tournaments.build(tournament_params)

    if @tournament.save
      render json: @tournament.as_json(include: { tournament_days: { only: [:id, :day] } }), status: :created
    else
      render json: { errors: @tournament.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def update
    if @tournament.update(tournament_params)
      render json: @tournament.as_json(include: { tournament_days: { only: [:id, :day] } })
    else
      render json: { errors: @tournament.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def destroy
    @tournament.destroy
    head :no_content
  end

  private

  def set_tournament
    @tournament = current_admin.tournaments.find(params[:id])
  end

  def tournament_params
    params.require(:tournament).permit(:title, :detail)
  end
end
