class TournamentsController < ApplicationController
  before_action :authenticate_admin!
  before_action :set_tournament, only: [:show, :update, :destroy, :teams]

  def index
    @tournaments = current_admin.tournaments.includes(:tournament_days, :tournament_categories)
    render json: @tournaments.map { |t|
      t.as_json(include: { tournament_days: { only: [:id, :day] } })
       .merge(categories_count: t.tournament_categories.size)
    }
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

  # GET /tournaments/:id/teams
  # 大会全体のチーム一覧（カテゴリ情報付き）
  def teams
    teams = Team.joins(:tournament_category)
                .where(tournament_categories: { tournament_id: @tournament.id })
                .includes(:team_members, :tournament_category)
    render json: teams.as_json(
      include: {
        team_members: {},
        tournament_category: {
          only: %i[id gender_type event_type age_type rank format_type]
        }
      }
    ), status: :ok
  end

  private

  def set_tournament
    @tournament = current_admin.tournaments.find(params[:id])
  rescue ActiveRecord::RecordNotFound
    render json: { error: "Tournament not found" }, status: :not_found
  end

  def tournament_params
    params.require(:tournament).permit(:title, :detail)
  end
end
