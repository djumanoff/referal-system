var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var rndstr = require("randomstring");

var schema = new Schema({
	code_id: { type: Number, default: 0 },
	promo_id: { type: Number, default: 0 },
	vendor_id: { type: Number, default: 0 },
	code: String,
	usage_limit: { type: Number, default: -1 },
	use_limit: { type: Number, default: 1 },
	usage_count: { type: Number, default: 0 },
	use_count: { type: Number, default: 0 },
	start_time: { type: Date, default: Date.now },
	expire_time: { type: Date, default: -1 },
	entity_type: { type: String, default: 'unknown' },
	entity_id: { type: Number, required: true },
	created_time: { type: Date, default: Date.now },
	updated_time: { type: Date, default: Date.now },
	forward_points: { type: Number, default: 0 },
	backward_points: { type: Number, default: 0 },
	special: { type: Boolean, default: false },
	forward_immediate: { type: Boolean, default: true },
	backward_immediate: { type: Boolean, default: false }
}, {
	collection: 'ref_codes'
});

schema.index({ entity_type: 1, entity_id: 1 });
schema.index({ promo_id: 1 });
schema.index({ code_id: 1 });
schema.index({ code: 1 }, { unique: true });
schema.index({ special: 1 });
schema.index({ start_time: 1 });
schema.index({ expire_time: 1 });

schema.pre('save', function(next) {
    var self = this;
    if (!Counter) {
        return next();
    }
    self.updated_time = new Date();
        if (self.code_id) {
        return next();
    }
    self.created_time = new Date();

    Counter.getId('ref_code', function(err, id) {
        if (err) return next(err);
        self.code_id = id;
        self.code = rndstr.generate(6).toUpperCase() + self.entity_type[0].toUpperCase() + self.entity_id;
        next();
    });
});

module.exports = function(conn) {
	var model = conn.model('ReferalCode', schema);

	model.isActive = function() {
		var now = Date.now();
		if (now < this.start_time.getTime()) {
			return false;
		}
		if (now > this.expire_time.getTime()) {
			return false;
		}
		return true;
	}

	return model;
};
