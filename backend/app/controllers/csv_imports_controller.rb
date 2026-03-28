# frozen_string_literal: true

class CsvImportsController < ApplicationController
  before_action :authenticate_admin!
  before_action :set_tournament

  # POST /tournaments/:id/import
  def create
    unless params[:file].present?
      return render json: { errors: [{ row: 0, message: "ファイルを選択してください" }] },
                    status: :unprocessable_entity
    end

    csv_data = params[:file].read
    result = CsvImportService.new(@tournament, csv_data).call

    if result.errors.empty?
      render json: { success_count: result.success_count }, status: :ok
    else
      render json: {
        success_count: result.success_count,
        errors: result.errors
      }, status: :unprocessable_entity
    end
  end

  private

  def set_tournament
    @tournament = current_admin.tournaments.find(params[:id])
  rescue ActiveRecord::RecordNotFound
    render json: { error: "Tournament not found" }, status: :not_found
  end
end
