module.exports = {
  apps: [{
    name: 'vistaran-help-desk',
    script: './server.mjs',
    instances: 1,
    exec_mode: 'fork',
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
};