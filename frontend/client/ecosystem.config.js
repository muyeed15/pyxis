module.exports = {
   apps: [{
     name : 'pyxis-next-frontend',
     cwd : '/var/www/html/pyxis/frontend/client',
     script: 'node_modules/.bin/next',
     args : 'start',
     watch : false,
   env : { NODE_ENV: 'production', PORT: 3000 }
  }]
};
