class TournamentCategoriesController < ApplicationController
  before_action :authenticate_admin!
  before_action :set_tournament
  before_action :set_category, only: [:update, :generate, :bracket]

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

  def generate
    TournamentGeneration::Orchestrator.new(@category).call
    render json: { message: "生成が完了しました" }, status: :ok
  rescue TournamentGeneration::Orchestrator::AlreadyGeneratedError => e
    render json: { error: e.message }, status: :conflict
  end

  def bracket
    render json: bracket_json(@category)
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

  def bracket_json(category)
    result = { format_type: category.format_type }

    if category.league? || category.league_to_tournament?
      result[:preliminary] = {
        groups: category.league_groups.order(:group_number).map { |group|
          {
            id:           group.id,
            name:         group.name,
            group_number: group.group_number,
            entries:      group.league_group_entries.order(:rank).map { |e|
              {
                team_id:      e.team_id,
                team_name:    e.team.name,
                wins:         e.wins,
                losses:       e.losses,
                games_won:    e.games_won,
                games_lost:   e.games_lost,
                points_won:   e.points_won,
                points_lost:  e.points_lost,
                rank:         e.rank
              }
            },
            matches: group.matches.order(:id).map { |m| brief_match_json(m) }
          }
        }
      }
    end

    if category.elimination? || category.league_to_tournament?
      main_matches = category.matches.where(phase: :main).order(:round, :bracket_position)
      result[:main] = {
        rounds: main_matches.group_by(&:round).map { |round, matches|
          { round: round, matches: matches.map { |m| brief_match_json(m) } }
        }
      }
    end

    result
  end

  def brief_match_json(match)
    {
      id:                   match.id,
      status:               match.status,
      round:                match.round,
      bracket_position:     match.bracket_position,
      home_team_id:         match.home_team_id,
      away_team_id:         match.away_team_id,
      winner_team_id:       match.winner_team_id,
      home_display_name:    match.home_display_name,
      away_display_name:    match.away_display_name,
      home_source_group_id: match.home_source_group_id,
      home_source_rank:     match.home_source_rank,
      away_source_group_id: match.away_source_group_id,
      away_source_rank:     match.away_source_rank
    }
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
