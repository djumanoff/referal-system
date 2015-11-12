var router = require('touchka').Router();

var error = require('touchka').error;
var ok = require('touchka').ok;

router

// .post('/', function(req, res) {
//   var now = new Date();
//   var values = {
//     entity_id: req.body.entity_id,
//     entity_type: req.body.entity_type.trim()
//   };
//   Entity.findOne(values).exec(function(err, entity) {
//     if (err) return error(err, res);
//     if (entity) return ok(entity, res);

//     values.created_time = now;
//     values.updated_time = now;

//     Entity.create(values, function(err, result) {
//       if (err) return error(err, res);
//       ok(result, res);
//     });
//   });
// })

// .get('/', function(req, res) {
//   Entity.find(req.query).exec(function(err, result) {
//     if (err) return error(err, res);
//     ok(result, res);
//   });
// })

.prefix('/:type/:id')

.param('id', function(req, res, next, id) {
  if (!parseInt(id)) {
    return error(new Error('Please provide correct entity id.'), res, 400);
  }
  next();
})
.param('type', function(req, res, next, type) {
  if (!type) {
    return error(new Error('Please provide correct entity type.'), res, 400);
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

.get('/', function(req, res) {
  Entity.findOne({ entity_id: req.params.id, entity_type: req.params.type }).exec(function(err, row) {
    if (err) return error(err, res);
    if (!row) return error('Entity not found.', res, 404);

    ok({
      entity_type: row.entity_type,
      entity_id: row.entity_id,
      points: row.points
    }, res);
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

.post('/points/:amount/redeem', function(req, res) {
  var amount = req.params.amount;
  var auth = req.headers.authorization;

  var operation_type = req.body.operation_type || req.params.type;
  var operation_id = req.body.operation_id;

  if (!operation_id) {
    return error(new Error('You need to specify operation id'), res, 400);
  }

  Transaction.findOne({ operation_type: operation_type, operation_id: operation_id }, function(err, operation) {
    if (err) return error(err, res);
    if (operation) return ok({}, res);

    Entity.findOne({ entity_id: req.params.id, entity_type: req.params.type }, function(err, row) {
      if (err) return error(err, res);
      if (!row) return error('Entity not found.', res, 404);

      Transaction.create({
        operation_type: operation_type,
        operation_id: operation_id,
        to: {
          type: row.entity_type,
          id: row.entity_id
        },
        amount: (-amount)
      }, function(err, trans) {
        if (err) return error(err, res);
        if (!trans) return error(new Error('Server error.'), res);

        row.points -= amount;
        row.save();

        ok({}, res);
      });
    });
  });
})

// .delete('/', function(req, res) {
//   Entity.find({ entity_id: req.params.id, entity_type: req.params.type }).remove().exec(function(err, result) {
//     if (err) return error(err, res);
//     ok(result, res);
//   });
// })
;

module.exports = router;