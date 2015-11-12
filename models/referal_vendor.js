var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var schema = new Schema({
	vendor_id: Number,
	title: String, 
	name: String,	
  entity_type: { type:String, default: 'touchka' },
	created_time: { type: Date, default: Date.now },
	updated_time: { type: Date, default: Date.now }
}, {
	collection: 'ref_vendors'
});

schema.index({ vendor_id: 1 }, { unique: true });
schema.index({ name: 1 }, { unique: true });
schema.index({ entity_type: 1 }, { unique: true });

schema.pre('save', function(next) {
  var self = this;
  if (!Counter) {
  	return next();
  }
  self.updated_time = new Date();
  if (self.vendor_id) {
    return next();
  }
  self.created_time = new Date();
  Counter.getId('ref_vendor', function(err, id) {
  	if (err) return next(err);
  	self.vendor_id = id;
    next();
  });
});

module.exports = function(conn) {
	var model = conn.model('ReferalVendor', schema);

	return model;
};
