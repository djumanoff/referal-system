var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var schema = new Schema({
	reward_id: Number,
	status: { type: String, enum: ['pending', 'fulfiled', 'expired', 'canceled'], default: 'pending' },
	points: { type: Number, default: 0 },  
  type: { type: String, enum: ['backward', 'forward'], default: 'backward' },
  entity_type: { type: String, default: 'unknown' },
  entity_id: { type: Number, default: 0 },
  created_time: { type: Date, default: Date.now },
  updated_time: { type: Date, default: Date.now },
  fulfiled_time: { type: Date, default: Date.now }
}, {
	collection: 'ref_rewards'
});

schema.index({ reward_id: 1 }, { unique: true });
schema.index({ applied_code: 1 });
schema.index({ applier_code: 1 });
schema.index({ entity_type: 1, entity_id: 1 });
schema.index({ type: 1 });
schema.index({ points: 1 });
schema.index({ status: 1 });

schema.pre('save', function(next) {
  var self = this;
  if (!Counter) {
  	return next();
  }
  self.updated_time = new Date();
  if (self.reward_id) {
    return next();
  }
  self.created_time = new Date();
  Counter.getId('ref_reward', function(err, id) {
  	if (err) return next(err);
  	self.reward_id = id;
    next();
  });
});

module.exports = function(conn) {
	var model = conn.model('ReferalReward', schema);

	return model;
};
