var config = require('../config.json');
var router = require('express').Router();
var URL = config.AUTH_URL || 'http://localhost:3030';

// var error = require('touchka-service').error;
// var ok = require('touchka-service').ok;

router

.post('/', function(req, res, next) {
  var vendor_id = req.body.vendor_id;
  var values = {
    title: (req.body.title && req.body.title.trim()) || '',
    name: (req.body.name && req.body.name.trim()) || '',
    description: (req.body.description && req.body.description.trim()) || '',
    entity_type: (req.body.entity_type && req.body.entity_type.trim()) || '',
    vendor_id: parseInt(req.body.vendor_id),
    start_time: req.body.start_time || new Date(),
    expire_time: req.body.expire_time || null,
    usage_limit: parseInt(req.body.usage_limit) || 0,
    use_limit: parseInt(req.body.use_limit) || 0,
    code_limit: parseInt(req.body.code_limit) || 0,
    forward_points: parseInt(req.body.forward_points) || 0,
    backward_points: parseInt(req.body.backward_points) || 0,
    special: req.body.special ? true : false,
    forward_immediate: req.body.forward_immediate ? true : false,
    backward_immediate: req.body.backward_immediate ? true : false,
    active: req.body.active ? true : false
  };

  Promo.findOne({ name: values.name }, function(err, promo) {
    if (err) return next(err);
    if (promo) {
      res.response = promo;
      return next();
    }

    Vendor.findOne({ vendor_id: vendor_id }, function(err, vendor) {
      if (err) return next(err);
      if (!vendor) return next({ message: 'No vendor', status: 404 });

      values.entity_type = values.entity_type || vendor.entity_type;

      Promo.create(values, function(err, result) {
        if (err) return next(err);
        res.response = result;
        next();
      });
    });  
  });  
})

.get('/', function(req, res, next) {
  Promo.find(req.query, function(err, result) {
    if (err) return error(err);
    res.response = { list: result };
    next();
  });
})

.param('id', function(req, res, next, id) {
  if (!parseInt(id)) {
    return next({ message: 'Please provide id.', status: 400 });
  }
  next();
})

.get('/:id', function(req, res, next) {
  Promo.findOne({ promo_id: req.params.id }, function(err, row) {
    if (err) return next(err);
    if (!row) return next({ message: 'Promo campaign not found', status: 404 });

    res.response = row;
    next();
  });
})

.post('/:id', function(req, res, next) {
  var values = {};

  if (req.body.title) {
    values.title = req.body.title.trim();
  }
  if (req.body.description) {
    values.description = req.body.description.trim();
  }
  if (req.body.start_time) {
    values.start_time = req.body.start_time;
  }
  if (req.body.expire_time) {
    values.expire_time = req.body.expire_time;
  }
  if (req.body.usage_limit) {
    values.usage_limit = req.body.usage_limit;
  }
  if (req.body.use_limit) {
    values.use_limit = req.body.use_limit;
  }
  if (req.body.code_limit) {
    values.code_limit = req.body.code_limit;
  }
  if (req.body.forward_points) {
    values.forward_points = req.body.forward_points;
  }
  if (req.body.backward_points) {
    values.backward_points = req.body.backward_points;
  }

  values.forward_immediate = req.body.forward_immediate ? true : false;
  values.backward_immediate = req.body.backward_immediate ? true : false;
  values.active = req.body.active ? true : false;
  values.special = req.body.special ? true : false;
    
  Promo.update({ promo_id: req.params.id }, values).exec(function(err, result) {
    if (err) return next(err);

    res.response = result;
    next();
  });
})

.delete('/:id', function(req, res, next) {
  Promo.find({ promo_id: req.params.id }).remove().exec(function(err, result) {
    if (err) return next(err);

    res.response = result;
    next();
  });
});

module.exports = router;

