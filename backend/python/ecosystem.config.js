/**
 * PM2 Ecosystem Configuration File
 * 
 * This file defines the process(es) to be managed by PM2 (Process Manager 2)
 * for the Pyxis Search API backend (Flask application).
 * 
 * Usage:
 *   Start the application:   pm2 start ecosystem.config.js
 *   Stop the application:    pm2 stop pyxis-flask-backend
 *   Restart:                 pm2 restart pyxis-flask-backend
 *   View logs:               pm2 logs pyxis-flask-backend
 * 
 * For more information: https://pm2.keymetrics.io/docs/usage/application-declaration/
 */

module.exports = {
  apps: [
    {
      // Human‑readable name for the process (used in PM2 commands)
      name: 'pyxis-flask-backend',

      // Path to the Python interpreter from the Conda environment
      // This ensures the application runs with the correct dependencies.
      script: '/home/debian/miniconda3/envs/pyxis/bin/python',

      // Command‑line arguments passed to the Python interpreter:
      // the full path to the Flask application entry point.
      args: '/var/www/html/pyxis/backend/python/app.py',

      // Setting interpreter to 'none' tells PM2 not to wrap the script
      // with a shell or another interpreter; the script field is the
      // executable itself.
      interpreter: 'none',

      // Disable file watching in development (set to true if you want
      // auto‑restart on file changes during development).
      watch: false,

      // Environment variables that will be set for the process.
      // NODE_ENV is conventionally used to indicate the runtime mode,
      // though the Flask app primarily uses .env or system environment.
      env: {
        NODE_ENV: 'production'
      }
    }
  ]
};