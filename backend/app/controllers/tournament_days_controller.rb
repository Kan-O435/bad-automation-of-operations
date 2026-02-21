class TournamentDaysController < ApplicationController
  before_action :authenticate_admin!
  before_action :set_tournament_day, only: [:show, :update, :destroy]

  def index
    @tournament_days = TournamentDay.includes(:tournament).all
    render json: @tournament_days
  end

  def show
    render json: @tournament_day
  end

  def create
    @tournament_day = TournamentDay.new(tournament_day_params)

    if @tournament_day.save
      render json: @tournament_day, status: :created
    else
      render json: { errors: @tournament_day.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def update
    if @tournament_day.update(tournament_day_params)
      render json: @tournament_day
    else
      render json: { errors: @tournament_day.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def destroy
    @tournament_day.destroy
    head :no_content
  end

  private

  def set_tournament_day
    @tournament_day = TournamentDay.find(params[:id])
  end

  def tournament_day_params
    params.require(:tournament_day).permit(:day, :tournament_id)
  end
end
