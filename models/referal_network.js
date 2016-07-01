var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var schema = new Schema({
	applied: {
        type: { type: String },
        id: Number,
        code: { type: String, required: true },
        promo_id: Number,
        vendor_id: Number
    },
    applier: {
        type: { type: String },
        id: Number,
        code: { type: String, required: true },
        promo_id: Number,
        vendor_id: Number
    },
    apply_time: { type: Date, default: Date.now }
}, {
	collection: 'ref_network'
});

schema.index({ 'applier.promo_id': 1 });
schema.index({ 'applier.vendor_id': 1 });
schema.index({ 'applied.promo_id': 1 });
schema.index({ 'applied.vendor_id': 1 });
schema.index({ 'applier.code': 1, 'applied.code': 1 }, { unique: true });
schema.index({ 'applied.code': 1 });
schema.index({ 'applier.code': 1 });
schema.index({ apply_time: 1 });

module.exports = function(conn) {
    var model = conn.model('ReferalNetwork', schema);

    return model;
};
