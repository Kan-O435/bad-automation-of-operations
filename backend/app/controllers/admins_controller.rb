class AdminsController < ApplicationController
  def create
    admin = Admin.new(admin_params)

    if admin.save
      session[:admin_id] = admin.id
      render json: { message: "account created" }, status: :created
    else
      render json: { errors: admin.errors.full_messages }, status: :unprocessable_entity
    end
  end

  private

  def admin_params
    params.permit(:email, :password, :password_confirmation, :name)
  end
end
