// errors.js

var util = require('util');

function BadRequest() {
	Error.call(this);
	this.status = 400;
}
util.inherits(BadRequest, Error);
module.exports.BadRequest  = function(message) {
	return new BadRequest(message);
};


function ServerError() {
	Error.call(this);
	this.status = 500;
}
util.inherits(ServerError, Error);
module.exports.ServerError = function(message) {
	return new ServerError(message);	
};

function NotFound() {
	Error.call(this);
	this.status = 404;
}
util.inherits(NotFound, Error);
module.exports.NotFound    = function(message) {
	return new NotFound(message);
};


function Forbidden() {
	Error.call(this);
	this.status = 403;
}
util.inherits(Forbidden, Error);
module.exports.Forbidden    = function(message) {
	return new Forbidden(message);
};

