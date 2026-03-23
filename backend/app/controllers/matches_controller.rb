class MatchesController < ApplicationController
  before_action :authenticate_admin!
  before_action :set_match

  def show
    render json: match_json(@match)
  end

  def update_games
    MatchResult::GameScoreUpdater.new(@match, games_params).call
    render json: match_json(@match.reload)
  rescue ActiveRecord::RecordInvalid => e
    render json: { errors: e.record.errors.full_messages }, status: :unprocessable_entity
  end

  def withdraw
    side = params[:side]&.to_sym
    return render json: { errors: ["side は home か away を指定してください"] }, status: :unprocessable_entity \
      unless %i[home away].include?(side)

    winner = side == :home ? @match.away_team : @match.home_team
    return render json: { errors: ["対戦チームが確定していません"] }, status: :unprocessable_entity \
      unless winner

    @match.update!(winner_team: winner, status: :withdrawn)
    MatchResult::BracketAdvancer.new(@match, winner).call
    render json: match_json(@match.reload)
  end

  private

  def set_match
    @match = Match.find(params[:id])
  rescue ActiveRecord::RecordNotFound
    render json: { error: "Match not found" }, status: :not_found
  end

  def games_params
    params.require(:games).map { |g| g.permit(:game_number, :home_score, :away_score) }
  end

  def match_json(match)
    {
      id:                    match.id,
      phase:                 match.phase,
      match_type:            match.match_type,
      round:                 match.round,
      bracket_position:      match.bracket_position,
      status:                match.status,
      home_team_id:          match.home_team_id,
      away_team_id:          match.away_team_id,
      winner_team_id:        match.winner_team_id,
      home_display_name:     match.home_display_name,
      away_display_name:     match.away_display_name,
      home_source_group_id:  match.home_source_group_id,
      home_source_rank:      match.home_source_rank,
      away_source_group_id:  match.away_source_group_id,
      away_source_rank:      match.away_source_rank,
      scheduled_at:          match.scheduled_at,
      games:                 match.match_games.order(:game_number).map { |g|
        { id: g.id, game_number: g.game_number, home_score: g.home_score, away_score: g.away_score }
      }
    }
  end
end
