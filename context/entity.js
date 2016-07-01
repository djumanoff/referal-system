var router = require('express').Router();
var Entity = require('../init').Entity;

router

.param('id', function(req, res, next, id) {
  if (!parseInt(id)) {
    return next({ message: 'Please provide correct entity id.', status: 400 });
  }
  next();
})
.param('type', function(req, res, next, type) {
  if (!type) {
    return next({ message: 'Please provide correct entity type.', status: 400 });
  }
  next();
})

/**
 * Get information about the entity
 *
 * Examples:
 * GET /entities/touchka/41
 *
 * RESPONSE:
 * {
 *   entity_type: 'touchka',
 *   entity_id: 41,
 *   points: 800
 * }
 *
 * @param type <string> - type of the entity prev. registered in the system (touchka, halva, etc.)
 * @param id <integer> - ID of the entity
 * @return object - information about the entity
 */

.get('/:type/:id', function(req, res, next) {
  Entity.findOne({ entity_id: req.params.id, entity_type: req.params.type }).exec(function(err, row) {
    if (err) return next({ message: err.message, status: err.code || 500 });
    if (!row) return next({ message: 'Entity not found.', status: 404 });

    res.response = {
      entity_type: row.entity_type,
      entity_id: row.entity_id,
      points: row.points
    };

    next();
  });
})

/**
 * Redeem points of the entity
 *
 * Examples:
 * GET /entities/touchka/41/points/800/redeem
 *
 * RESPONSE:
 * {}
 *
 * @param type <string> - type of the entity prev. registered in the system (touchka, halva, etc.)
 * @param id <integer> - ID of the entity
 * @param amount <integer> - number of points to redeem
 * @param operation_id <integer> - operation id to ensure idempotency
 * @param operation_type <string> | optional - operation type
 * @return {}
 */

.post('/:type/:id/points/:amount/redeem', function(req, res, next) {
  var amount = req.params.amount;
  var operation_type = req.body.operation_type || req.params.type;
  var operation_id = req.body.operation_id;

  if (!operation_id) {
    return next({ message: 'You need to specify operation id', status: 400 });
  }

  Transaction.findOne({ operation_type: operation_type, operation_id: operation_id }, function(err, operation) {
    if (err) return next({ message: err.message, status: 500 });
    if (operation) return next();

    Entity.findOne({ entity_id: req.params.id, entity_type: req.params.type }, function(err, row) {
      if (err) return next({ message: err.message, status: 500 });
      if (!row) return next({ message: 'Entity not found.', status: 404 });

      Transaction.create({
        operation_type: operation_type,
        operation_id: operation_id,
        to: {
          type: row.entity_type,
          id: row.entity_id
        },
        amount: (-amount)
      }, function(err, trans) {
        if (err) return next({ message: err.message });
        if (!trans) return next({ message: 'Server error.' });

        row.points -= amount;
        row.save();

        next();
      });
    });
  });
})

// .delete('/', function(req, res, next) {
//   Entity.find({ entity_id: req.params.id, entity_type: req.params.type }).remove().exec(function(err, result) {
//     if (err) return error(err, res);
//     ok(result, res);
//   });
// })
;

module.exports = router;