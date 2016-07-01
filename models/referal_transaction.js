var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var Counter = require('../init').Counter;

var schema = new Schema({
    transaction_id: Number,
    operation_id: Number,
    operation_type: String,
    from: {
        type: { type: String },
        id: Number
    },
    to: {
        type: { type: String },
        id: Number
    },
    amount: { type: Number, default: 0 },
    currency: { type: String, enum: ['points'], default: 'points' },
    created_time: { type: Date, default: Date.now },
    updated_time: { type: Date, default: Date.now }
}, {
	collection: 'ref_transactions'
});

schema.index({ transaction_id: 1 }, { unique: true });
schema.index({ operation_type: 1, operation_id: 1 });

schema.pre('save', function(next) {
    var self = this;
    if (!Counter) {
        return next();
    }
    self.updated_time = new Date();
    if (self.transaction_id) {
        return next();
    }
    self.created_time = new Date();
    Counter.getId('ref_transaction', function(err, id) {
        if (err) return next(err);
        self.transaction_id = id;
        next();
    });
});

module.exports = function(conn) {
	var model = conn.model('ReferalTransaction', schema);

	return model;
};
