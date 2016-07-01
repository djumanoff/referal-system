var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var schema = new Schema({
	entity_id: Number,
    entity_type: { type: String, default: 'touchka' },
    details: Schema.Types.Mixed,
    stats: Schema.Types.Mixed,
    points: { type: Number, default: 0 },
    created_time: { type: Date, default: Date.now },
    updated_time: { type: Date, default: Date.now }
}, {
	collection: 'ref_entities'
});

schema.index({ entity_type: 1, entity_id: 1 }, { unique: true });
schema.index({ points: 1 });

schema.pre('save', function(next) {  
    this.updated_time = new Date();
    if (this.entity_id) {
        return next();
    }
    this.created_time = new Date();
});

module.exports = function(conn) {
	var model = conn.model('ReferalEntity', schema);

	return model;
};
