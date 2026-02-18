Rails.application.routes.draw do
  get "admins/create"
  get "sessions/create"
  get "sessions/destroy"
  get "up" => "rails/health#show", as: :rails_health_check

  post "/login", to: "sessions#create"
  delete "/logout", to: "sessions#destroy"

  post "/signup", to: "admins#create"

  get "/me", to: "sessions#me"

end
