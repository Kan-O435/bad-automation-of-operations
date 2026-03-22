Rails.application.routes.draw do
  resources :tournaments do
    member do
      get :teams
    end
    resources :tournament_days, only: [:create, :destroy]
    resources :tournament_categories, only: [:index, :create, :update] do
      resources :teams, only: [:index, :create, :update, :destroy] do
        resources :team_members, only: [:create, :update, :destroy]
      end
    end
  end

  post "/login", to: "sessions#create"
  delete "/logout", to: "sessions#destroy"
  post "/signup", to: "admins#create"
  get "/me", to: "sessions#me"
  get "/sw.js", to: proc { [204, {}, []] }

  get "up" => "rails/health#show", as: :rails_health_check
end
