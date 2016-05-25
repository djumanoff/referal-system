'use strict';

// require('touchka-bootstrap')(function() { 
// 	require('./app');
// }, 4, function() {
// 	require('touchka-argv')(require('./cli.help.js'), './config.json');
// });

'use strict';

var cluster = require('cluster');

if (cluster.isMaster) {
  var cfgPath = process.env.config;
  if (!cfgPath) {
    console.log('no config file');
    process.exit(1);
    return ;
  }
  var cfg = require(cfgPath);
  if (!cfg) {
    console.log('config file does not exists');
    process.exit(1);
    return ;
  }
  require('touchka-argv')(cfg, __dirname + '/config.json');

  var numberOfCPU = require('os').cpus().length - 1;
  var config = require('./config');
  var w = config.w || numberOfCPU;

  if (w > 1) {
    for (var i = 0; i < w; i++) cluster.fork();
  } else {
    require('./app');
  }
} else {
  require('./app');
}
