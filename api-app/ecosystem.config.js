module.exports = {
  apps: [{
    name: 'API',
    script: 'npm run -- start:live',
    watch: true,
    ignore_watch: ['node_modules', 'uploads', 'somefile*', 'previewlogs*', 'somefile_predict*', 'testlog*', 'googlelog.txt', 'keywordcheck*', 'logstest*'],
  }],

  // deploy : {
  //   production : {
  //     user : 'SSH_USERNAME',
  //     host : 'SSH_HOSTMACHINE',
  //     ref  : 'origin/master',
  //     repo : 'GIT_REPOSITORY',
  //     path : 'DESTINATION_PATH',
  //     'pre-deploy-local': '',
  //     'post-deploy' : 'npm install && pm2 reload ecosystem.config.js --env production',
  //     'pre-setup': ''
  //   }
  // }
};
