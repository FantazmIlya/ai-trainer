module.exports = {
  apps: [
    {
      name: "ai-trainer-api-staging",
      script: "backend/src/server.js",
      cwd: "/var/www/ai-trainer-staging/current",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "300M",
      env: {
        NODE_ENV: "production",
        PORT: "4100",
      },
    },
  ],
};