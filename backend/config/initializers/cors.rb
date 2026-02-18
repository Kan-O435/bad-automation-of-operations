Rails.application.config.middleware.insert_before 0, Rack::Cors do
  allow do
    # Next.jsアプリのオリジンを許可（開発環境）
    origins Rails.env.development? ? ["http://localhost:3000", "http://localhost:3002", "http://127.0.0.1:3000", "http://127.0.0.1:3002"] : ENV.fetch("FRONTEND_URL", "http://localhost:3000")
    
    resource "*",
      headers: :any,
      credentials: true,
      methods: [:get, :post, :put, :patch, :delete, :options, :head],
      expose: ["Content-Type", "Authorization"]
  end
end
