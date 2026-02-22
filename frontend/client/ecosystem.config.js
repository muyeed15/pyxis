/**
 * PM2 Ecosystem Configuration File – Pyxis Next.js Frontend
 * 
 * This file defines the process configuration for PM2 (Process Manager 2)
 * to run the Pyxis Next.js frontend application in production.
 * 
 * PM2 will start and manage the Next.js server, keeping it alive,
 * restarting on failure, and providing log management.
 * 
 * Usage:
 *   Start the application:   pm2 start ecosystem.config.js
 *   Stop the application:    pm2 stop pyxis-next-frontend
 *   Restart:                 pm2 restart pyxis-next-frontend
 *   View logs:               pm2 logs pyxis-next-frontend
 * 
 * For more information: https://pm2.keymetrics.io/docs/usage/application-declaration/
 */

module.exports = {
  apps: [
    {
      // Human‑readable name for the process (used in PM2 commands)
      name: 'pyxis-next-frontend',

      // Working directory from which the script will be executed.
      // This should be the root of the Next.js application.
      cwd: '/var/www/html/pyxis/frontend/client',

      // The executable script – here we point directly to the Next.js CLI
      // inside the local node_modules folder. This ensures the correct
      // version of Next.js is used.
      script: 'node_modules/.bin/next',

      // Command‑line arguments passed to the script.
      // 'start' tells Next.js to run the production server.
      args: 'start',

      // Disable file watching (set to true only in development).
      // In production, PM2 should not auto‑restart on file changes.
      watch: false,

      // Environment variables for the process.
      // NODE_ENV is set to 'production' to enable production optimizations.
      // PORT defines the port on which the Next.js server will listen.
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      }
    }
  ]
};