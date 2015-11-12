var router = require('touchka').Router();
var URL = require('touchka').argv.AUTH_URL || 'http://localhost:3030';

var error = require('touchka').error;
var ok = require('touchka').ok;

router

.post('/', function(req, res) {
  var now = Date.now();
  var values = {
    title: req.body.title.trim(),
    name: req.body.name.trim(),
    entity_type: req.body.entity_type.trim(),
    created_time: now,
    updated_time: now
  };
  Vendor.findOne({ name: values.name }).exec(function(err, vendor) {
    if (err) return error(err, res);
    if (vendor) return ok(vendor, res);
    
    Vendor.create(values, function(err, result) {
      if (err) return error(err, res);
      ok(result, res);
    });
  });  
})

.get('/', function(req, res) {
  var query = req.query;
  var skip = query.skip || 0;
  var limit = query.limit || 40;

  delete query.skip; delete query.limit;

  Vendor.find(query).exec(function(err, result) {
    if (err) return error(err, res);
    ok({ list: result }, res);
  });
})

.prefix('/:id')

.param('id', function(req, res, next, id) {
  if (!parseInt(id)) {
    return error(new Error('Please provide correct vendor id.'), res, 400);
  }
  next();
})

.get('/', function(req, res) {
  Vendor.findOne({ vendor_id: req.params.id }).exec(function(err, row) {
    if (err) return error(err, res);
    if (!row) return error('Vendor not found.', res, 404);

    ok(row, res);
  });
})

.post('/', function(req, res) {
  var values = {};

  if (req.body.title) {
    values.title = req.body.title.trim();
  }
  
  values.updated_time = Date.now();
  Vendor.update({ vendor_id: req.params.id }, values).exec(function(err, result) {
    if (err) return error(err, res);
    ok(result, res);
  });
})

.delete('/', function(req, res) {
  Vendor.find({ vendor_id: req.params.id }).remove().exec(function(err, result) {
    if (err) return error(err, res);
    ok(result, res);
  });
});

module.exports = router;