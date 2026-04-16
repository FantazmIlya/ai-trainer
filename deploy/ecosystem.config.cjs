module.exports = {
  apps: [
    {
      name: "ai-trainer-api",
      script: "backend/src/server.js",
      cwd: "/var/www/ai-trainer/current",
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      watch: false,
      max_memory_restart: "300M",
      env: {
        NODE_ENV: "production",
        PORT: 4000,
      },
    },
  ],
};