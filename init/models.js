var mongoose = require('mongoose');
var config = require('../config.json');

var DB_HOST = config.DB_HOST || '127.0.0.1';
var DB_PORT = config.DB_PORT || '27017';
var DB_NAME = config.DB_NAME || 'touchka-refsys';
var DB_USER = config.DB_USER || '';
var DB_PASS = config.DB_PASS || '';
var DB_OPTIONS = config.DB_OPTIONS || '{ "poolSize": 5 }';
var DB_URL = 'mongodb://' + DB_HOST + ':' + DB_PORT + '/' + DB_NAME;

try {
	var conn = mongoose.createConnection(DB_URL, {
		user: DB_USER,
		pass: DB_PASS,
		server: JSON.parse(DB_OPTIONS)
	});

	module.exports.Counter = require('../models/counter')(conn);
	module.exports.Vendor = require('../models/referal_vendor')(conn);
	module.exports.Network = require('../models/referal_network')(conn);
	module.exports.Code = require('../models/referal_code')(conn);
	module.exports.Promo = require('../models/referal_promo')(conn);
	module.exports.Reward = require('../models/referal_reward')(conn);
	module.exports.Entity = require('../models/referal_entity')(conn);
	module.exports.Transaction = require('../models/referal_transaction')(conn);

	process.on('exit', function() {
		console.error('Failed to connect to database.', err);
		conn.close();
	});
} catch (err) {
	console.error(err);
	process.exit(1);
}
