'use strict';

var config = require('./config');
var name = require('./package').name;

var service = require('touchka-service').Service;
var port = config.port || 3000;
var env = config.env || 'dev';

var srv = service(name);

if (env != 'dev') {
	srv.use(require('./auth'));
}

srv
	.plugin('/entities', require('./context/entity'))
	.plugin('/codes', require('./context/code'))
	.plugin('/promos', require('./context/promo'))
	.plugin('/vendors', require('./context/vendor'))
	.plugin('/rewards', require('./context/reward'))
	.ready(function() {
		console.log('server is running on ' + port);
		require('./init');
	})
	.listen(port);
