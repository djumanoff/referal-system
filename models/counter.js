var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var CounterSchema = new Schema({
	_id: { type: String, required: true },
	seq: { type: Number, default: 0 }
});

module.exports = function(conn) {
	var Counter = conn.model('Counter', CounterSchema);

	Counter.getId = function(entity, callback) {
		Counter.findByIdAndUpdate(entity, {$inc: {seq: 1}}, {upsert: true, 'new': true}, function(err, counter) {
	    if (err) return callback(err);
	    if (!counter) return callback(Error('no counter object'));

	    callback(null, counter.seq);
	  });
	};

	return Counter;
};
