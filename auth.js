'use strict';

var error = require('touchka').error;
var CONTROL_PANEL_IP = require('touchka').argv.CONTROL_PANEL_IP || '::1';

module.exports = function(req, res, next) {
  var context = req.originalUrl.split('/');
  context = context[1];

  if (context == 'codes' || context == 'entities' || context == 'rewards') {
    return next();
  }

  var ip = req.connection.remoteAddress;
  
  if (ip != CONTROL_PANEL_IP) {
    return error(new Error('Resource not found'), res, 404);
  }

  next();
};
