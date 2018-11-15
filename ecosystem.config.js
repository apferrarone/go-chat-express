module.exports = {
  apps: [{
    name: 'go-chat-api',
    script: './bin/www',
    exec_mode: 'cluster',
    instances: 'max',
    env: {
      PORT: 3001,
      NODE_ENV: 'production'
    }
  }]
};
