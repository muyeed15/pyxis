module.exports = {
  apps: [{
    name : 'pyxis-flask-backend',
    script : '/home/debian/miniconda3/envs/pyxis/bin/python',
    args : '/var/www/html/pyxis/backend/python/app.py',
    interpreter: 'none',
    watch : false,
    env : { NODE_ENV: 'production' }
  }]
};
