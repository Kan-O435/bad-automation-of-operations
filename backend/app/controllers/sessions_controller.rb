class SessionsController < ApplicationController
  def create
    admin = Admin.find_by(email: params[:email])

    if admin&.authenticate(params[:password])
      session[:admin_id] = admin.id
      render json: { message: "logged in" }
    else
      render json: { error: "invalid credentials" }, status: :unauthorized
    end
  end

  def destroy
    session.delete(:admin_id)
    head :no_content
  end

  def me
    authenticate_admin!
    render json: { admin: { id: current_admin.id, email: current_admin.email, name: current_admin.name } }
  end
end
