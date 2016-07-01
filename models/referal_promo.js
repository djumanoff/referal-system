var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var Counter = require('../init').Counter;

var schema = new Schema({
	promo_id: Number,
	vendor_id: Number,	
	description: String,
	title: { type: String, required: true },
	name: { type: String, required: true },
	entity_type: { type: String, default: 'touchka'},	
	start_time: { type: Date, default: Date.now },
	expire_time: { type: Date, default: -1 },
	usage_limit: { type: Number, default: -1 },
	use_limit: { type: Number, default: 1 },
	code_limit: { type: Number, default: 0 },
	code_count: { type: Number, default: 0 },
	created_time: { type: Date, default: Date.now },
	updated_time: { type: Date, default: Date.now },
	forward_points: { type: Number, default: 0 },
	backward_points: { type: Number, default: 0 },
	special: { type: Boolean, default: false },
	active: { type: Boolean, default: true },
	forward_immediate: { type: Boolean, default: true },
	backward_immediate: { type: Boolean, default: false }
}, {
	collection: 'ref_promos'
});

schema.index({ promo_id: 1 }, { unique: true });
schema.index({ usage_limit: 1 });
schema.index({ use_limit: 1 });
schema.index({ start_time: 1 });
schema.index({ expire_time: 1 });
schema.index({ active: 1 });

schema.pre('save', function(next) {
	var self = this;
	if (!Counter) {
		return next();
	}
	self.updated_time = new Date();
	if (self.promo_id) {
		return next();
	}
	self.created_time = new Date();
	Counter.getId('ref_promo', function(err, id) {
		if (err) return next(err);
		self.created_time = new Date();
		self.promo_id = id;
		next();
	});
});

module.exports = function(conn) {
	var model = conn.model('ReferalPromo', schema);

	model.isActive = function() {
		var now = new Date();
		if (!this.active) {
			return false;
		}
		if (now < this.start_time) {
			return false;
		}
		if (now > this.expire_time) {
			return false;
		}
		return true;
	}

	return model;
};
