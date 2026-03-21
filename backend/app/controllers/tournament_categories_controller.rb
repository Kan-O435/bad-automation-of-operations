class TournamentCategoriesController < ApplicationController
  before_action :authenticate_admin!
  before_action :set_tournament
  before_action :set_category, only: [:update]

  def index
    render json: @tournament.tournament_categories, status: :ok
  end

  def create
    category = @tournament.tournament_categories.build(category_params)

    if category.save
      render json: category, status: :created
    else
      render json: { errors: category.errors.full_messages }, status: :unprocessable_entity
    end
  rescue ArgumentError => e
    render json: { errors: [e.message] }, status: :unprocessable_entity
  end

  def update
    if @category.update(category_params)
      render json: @category, status: :ok
    else
      render json: { errors: @category.errors.full_messages }, status: :unprocessable_entity
    end
  rescue ArgumentError => e
    render json: { errors: [e.message] }, status: :unprocessable_entity
  end

  private

  def set_tournament
    @tournament = current_admin.tournaments.find(params[:tournament_id])
  rescue ActiveRecord::RecordNotFound
    render json: { error: "Tournament not found" }, status: :not_found
  end

  def set_category
    @category = @tournament.tournament_categories.find(params[:id])
  rescue ActiveRecord::RecordNotFound
    render json: { error: "Category not found" }, status: :not_found
  end

  def category_params
    params.require(:tournament_category).permit(
      :gender_type,
      :event_type,
      :age_type,
      :rank,
      :format_type,
      :max_participants,
      :group_size,
      :group_count,
      :advance_count,
      :has_third_place
    )
  end
end
