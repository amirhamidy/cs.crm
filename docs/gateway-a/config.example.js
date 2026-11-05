// public/config.js  (loaded by app/layout.tsx with strategy="beforeInteractive")
window.__APP_CONFIG__ = {
  // ClientraPlatform API Gateway (no trailing slash). Dev default if omitted: http://127.0.0.1:8080
  // In production, omitting it means "same origin" (gateway behind the same host / reverse proxy).
  API_URL: "http://127.0.0.1:8080",

  // Optional: serve uploaded files / avatars from another origin (see OPEN_QUESTIONS.md #4).
  // MEDIA_URL: "https://files.example.com",

  // DEV ONLY: static X-Organization-Token until the Control Plane flow is wired.
  // ORG_TOKEN: "<token from Control Plane>",
};
