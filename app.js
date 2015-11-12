'use strict';

var argv = require('touchka').argv;
var service = require('touchka').Service;
var port = argv.port || 3000;
var env = argv.env || 'dev';

var srv = service('referal_system');

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
		require('./init')();
	})
	.listen(port);
