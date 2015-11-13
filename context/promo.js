var config = require('../config.json');
var router = require('touchka-service').Router();
var URL = config.AUTH_URL || 'http://localhost:3030';

var error = require('touchka-service').error;
var ok = require('touchka-service').ok;

router

.post('/', function(req, res) {
  var vendor_id = req.body.vendor_id;
  var values = {
    title: req.body.title.trim(),
    name: req.body.name.trim(),
    description: req.body.description.trim(),
    entity_type: (req.body.entity_type || vendor.entity_type).trim(),    
    vendor_id: parseInt(req.body.vendor_id),
    start_time: req.body.start_time,
    expire_time: req.body.expire_time,
    usage_limit: parseInt(req.body.usage_limit),
    use_limit: parseInt(req.body.use_limit),      
    code_limit: parseInt(req.body.code_limit),
    forward_points: parseInt(req.body.forward_points),
    backward_points: parseInt(req.body.backward_points),
    special: req.body.special ? true : false,
    forward_immediate: req.body.forward_immediate ? true : false,
    backward_immediate: req.body.backward_immediate ? true : false,
    active: req.body.active ? true : false
  };

  Promo.findOne({ name: values.name }, function(err, promo) {
    if (err) return error(err, res);
    if (promo) return ok(promo, res);

    Vendor.findOne({ vendor_id: vendor_id }, function(err, vendor) {
      if (err) return error(err, res);
      if (!vendor) return error('No vendor', res, 404);    

      Promo.create(values, function(err, result) {
        if (err) return error(err, res);
        ok(result, res);
      });
    });  
  });  
})

.get('/', function(req, res) {
  Promo.find(req.query, function(err, result) {
    if (err) return error(err, res);
    ok({ list: result }, res);
  });
})

.prefix('/:id')

.param('id', function(req, res, next, id) {
  if (!parseInt(id)) {
    return error(new Error('Please provide id.'), res, 400);
  }
  next();
})

.get('/', function(req, res) {
  Promo.findOne({ promo_id: req.params.id }, function(err, row) {
    if (err) return error(err, res);
    if (!row) return error(new Error('Promo campaign not found'), res, 404);    
    ok(row, res);
  });
})

.post('/', function(req, res) {
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
    if (err) return error(err, res);
    ok(result, res);
  });
})

.delete('/', function(req, res) {
  Promo.find({ promo_id: req.params.id }).remove().exec(function(err, result) {
    if (err) return error(err, res);
    ok(result, res);
  });
});

module.exports = router;

