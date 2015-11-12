var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var schema = new Schema({
	entity_id: Number,
  entity_type: { type: String, default: 'touchka_user' },
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
  var self = this;
  self.updated_time = new Date();
  if (self.entity_id) {
  	return next();
  }
  self.created_time = new Date();
});

module.exports = function(conn) {
	var model = conn.model('ReferalEntity', schema);

	return model;
};
