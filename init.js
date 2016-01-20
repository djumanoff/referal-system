var mongoose = require('mongoose');
var config = require('./config.json');

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

	GLOBAL.Counter = require('./models/counter')(conn);
	GLOBAL.Vendor = require('./models/referal_vendor')(conn);
	GLOBAL.Network = require('./models/referal_network')(conn);
	GLOBAL.Code = require('./models/referal_code')(conn);
	GLOBAL.Promo = require('./models/referal_promo')(conn);
	GLOBAL.Reward = require('./models/referal_reward')(conn);
	GLOBAL.Entity = require('./models/referal_entity')(conn);
	GLOBAL.Transaction = require('./models/referal_transaction')(conn);

	process.on('exit', function() {
		conn.close();
	});

	return conn;
} catch (e) {
	process.exit(0);
	return false;
}

module.exports = conn;
