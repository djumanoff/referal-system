'use strict';

var config = require('./config.json');
var CONTROL_PANEL_IP = config.CONTROL_PANEL_IP || '::1';

module.exports = function(req, res, next) {
  var context = req.originalUrl.split('/');
  context = context[1];

  if (context == 'codes' || context == 'entities' || context == 'rewards') {
    return next();
  }

  var ip = req.connection.remoteAddress;  

  next();
};
