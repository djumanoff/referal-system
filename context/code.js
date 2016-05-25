var router = require('express').Router();
var lib = require('../lib');

router

/**
 * Get promo code for entity
 *
 * Examples:
 * GET /codes/touchka/41
 *
 * RESPONSE:
 * {
 *   code: FASE22,
 *   backward_points: 200,
 *   forward_points: 800
 * }
 *
 * @param entity_type <string> - type of the entity prev. registered in the system (touchka, halva, etc.)
 * @param entity_id <integer> - ID of the entity
 * @return object - information about promo code (code, backward reward points, forward reward points)
 */

.get('/:entity_type/:entity_id', function(req, res, next) {
  lib.getPromoCode(req.params, function(err, response) {
    if (err) return next(err);
    res.response = response;
    return next();
  });
})

/**
 * Method to apply promo code
 *
 * Examples:
 * POST /codes/touchka/41/apply/FASE22
 *
 * @param entity_type <string> - type of the entity prev. registered in the system (touchka, halva, etc.)
 * @param entity_id <integer> - ID of the entity
 * @param code <string> - promo code to apply
 * @return object - information about forward and backwrad rewards (status, points amount) if any
 */

.post('/:entity_type/:entity_id/apply/:code', function(req, res, next) {
  lib.applyPromoCode(req.params, function(err, response) {
    if (err) return next(err);
    res.response = response;
    return next();
  });
});

module.exports = router;
