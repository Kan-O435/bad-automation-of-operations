Rails.application.routes.draw do
  resources :tournaments
  resources :tournament_days

  post "/login", to: "sessions#create"
  delete "/logout", to: "sessions#destroy"
  post "/signup", to: "admins#create"
  get "/me", to: "sessions#me"
  get "/sw.js", to: proc { [204, {}, []] }

  get "up" => "rails/health#show", as: :rails_health_check
end
