class ApplicationController < ActionController::API
  include ActionController::Cookies

  def current_admin
    @current_admin ||= Admin.find_by(id: session[:admin_id]) if session[:admin_id]
  end

  def authenticate_admin!
    render json: { error: "unauthorized" }, status: :unauthorized unless current_admin
  end
end
