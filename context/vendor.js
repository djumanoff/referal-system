var router = require('express').Router();

var config = require('../config.json');
var URL = config.AUTH_URL || 'http://localhost:3030';

var Vendor = require('../init').Vendor;

router

.post('/', function(req, res, next) {
  var now = Date.now();
  var values = {
    title: (req.body.title && req.body.title.trim()) || '',
    name: (req.body.name && req.body.name.trim()) || '',
    entity_type: (req.body.entity_type && req.body.entity_type.trim()) || '',
    created_time: now,
    updated_time: now
  };
  Vendor.findOne({ name: values.name }).exec(function(err, vendor) {
    if (err) return next(err);
    if (vendor) {
      res.response = vendor;
      return next();
    }
    
    Vendor.create(values, function(err, result) {
      if (err) return next(err);
      res.response = result;
      return next();
    });
  });  
})

.get('/', function(req, res, next) {
  var query = req.query;
  var skip = query.skip || 0;
  var limit = query.limit || 40;

  delete query.skip; 
  delete query.limit;

  Vendor.find(query).exec(function(err, result) {
    if (err) return next(err);
    res.response = { list: result };
    return next();
  });
})

.param('id', function(req, res, next, id) {
  if (!parseInt(id)) {
    return next({ message: 'Please provide correct vendor id.', status: 400 });
  }
  next();
})

.get('/:id', function(req, res, next) {
  Vendor.findOne({ vendor_id: req.params.id }).exec(function(err, row) {
    if (err) return next(err);
    if (!row) return next({ message: 'Vendor not found.', status: 404 });

    res.response = row;
    next();
  });
})

.post('/:id', function(req, res, next) {
  var values = {};

  if (req.body.title) {
    values.title = req.body.title.trim();
  }
  
  values.updated_time = Date.now();
  Vendor.update({ vendor_id: req.params.id }, values).exec(function(err, result) {
    if (err) return next(err);

    res.response = result;
    next();
  });
})

.delete('/:id', function(req, res, next) {
  Vendor.find({ vendor_id: req.params.id }).remove().exec(function(err, result) {
    if (err) return next(err);
    res.response = result;
    next();
  });
});

module.exports = router;