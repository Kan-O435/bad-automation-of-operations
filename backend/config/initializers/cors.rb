Rails.application.config.middleware.insert_before 0, Rack::Cors do
  allow do
    if Rails.env.development?
      origins "http://localhost:3002", "http://127.0.0.1:3002"
    else
      origins ENV.fetch("FRONTEND_URL")
    end

    resource "*",
      headers: :any,
      credentials: true,
      methods: [:get, :post, :put, :patch, :delete, :options, :head],
      expose: ["Content-Type", "Authorization"]
  end
end
