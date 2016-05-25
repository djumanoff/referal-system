'use strict';

var config = require('./config');
var name = require('./package').name;

var express = require('express');
var bodyParser = require('body-parser');
var busy = require('busy');
var logger = require('morgan');

var app = express();

var port = config.port || 3000;
var env = config.env || 'dev';

app	
	.enable('trust proxy')
	.disable('etag')
	.get('/health', function(req, res) {
		return res.json({
			uptime: process.uptime(),
			memoryUsage: process.memoryUsage(),
			pid: process.pid
		});
	})
	.use(function(req, res, next) {
		if (busy.blocked) {
			return next({
				message: 'Service is overloaded.'
			});
		} else {
			next();
		}
	})
	.use(express.query())
	.use(bodyParser.json())
	.use(bodyParser.urlencoded({ extended: true }))

	// .use(logger(':date[iso] :method :url :status :response-time ms - :res[content-length]'))

	.use('/entities', require('./context/entity'))
	.use('/codes', require('./context/code'))
	.use('/promos', require('./context/promo'))
	.use('/vendors', require('./context/vendor'))
	.use('/rewards', require('./context/reward'))	
	.use(function(req, res, next) {
		if (res.response) {
			return next(null, req, res);
		}
		res.status(404);
		res.response = {
			path: req.originalUrl,
			message: 'Not found' 
		};
		return next(null, req, res);
	})
	.use(function(err, req, res, next) {
		res.status(err.status || 500);
		res.response = {
			message: err.message,
			stack: err.stack
		};
		return next(null, req, res);
	})
	.use(function(req, res) {		
		log(req, res);
		return res.json(res.response);
	})	
	.listen(port, function() {
		require('./init');
	});


function log(req, res) {
	var data = { query: req.query, body: req.body, params: req.params };
	var date = new Date();

	console.log(
		// date.toLocaleDateString() + ' ' + date.toLocaleTimeString()
		date.toISOString()
		+ ' ' + req.method
		+ ' ' + req.originalUrl 
		+ ' ' + res.statusCode 
		+ ' ' + JSON.stringify(data) 
		+ '\t' + JSON.stringify(res.response)
	);
}