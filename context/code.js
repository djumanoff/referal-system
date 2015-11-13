var router = require('touchka-service').Router();
var async = require('async');
var error = require('touchka-service').error;
var ok = require('touchka-service').ok;

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

.get('/:entity_type/:entity_id', function(req, res) {
  var entity_type = req.params.entity_type.trim();
  var entity_id = parseInt(req.params.entity_id);

  if (!entity_type) {
    return error(new Error('No entity type.'), res, 400);
  }

  if (!entity_id) {
    return error(new Error('No entity id.'), res, 400);
  }

  var now = new Date();
  Promo.findOne({ entity_type: entity_type, active: true, start_time: { $lt: now }, expire_time: { $gt: now } }).exec(function(err, promo) {
    if (err) return error(err, res);
    if (!promo) return error(new Error('Promo campaign does not exists.'), res, 400);
    if (promo.code_limit != 0 && promo.code_limit <= promo.code_count) return error(new Error('Code count exceeded.'), res, 401);

    Code.findOne({ entity_type: entity_type, entity_id: entity_id }).exec(function(err, code) {
      if (err) return error(err, res);
      if (code) return ok({
          code: code.code,
          forward_points: code.forward_points,
          backward_points: code.backward_points
        }, res);

      var values = {
        promo_id: promo.promo_id,
        vendor_id: promo.vendor_id,
        entity_id: entity_id,
        entity_type: entity_type,
        usage_limit: promo.usage_limit,
        use_limit: promo.use_limit,
        start_time: promo.start_time,
        expire_time: promo.expire_time,
        special: promo.special,
        forward_points: promo.forward_points,
        backward_points: promo.backward_points,
        backward_immediate: promo.backward_immediate,
        forward_immediate: promo.forward_immediate
      };

      Entity.create({ entity_type: entity_type, entity_id: entity_id, points: 0 }, function() {});

      Code.create(values, function(err, result) {
        if (err) return error(err, res);

        ok({
          code: result.code,
          forward_points: result.forward_points,
          backward_points: result.backward_points
        }, res);

        promo.code_count++;
        promo.save();
      });
    });    
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

.post('/:entity_type/:entity_id/apply/:code', function(req, res) {
  var code = req.params.code;
  var entity_type = req.params.entity_type;
  var entity_id = req.params.entity_id;

  if (!code) {
    return error(new Error('No promo code.'), res, 400);
  }

  if (!entity_type || !entity_id) {
    return error(new Error('No applier.'), res, 400);
  }
  
  Code.findOne({ code: code, entity_type: entity_type }).exec(function(err, applied) {
    if (err) return error(err, res);
    if (!applied) return error(new Error('Applied code is not part of the referal system.'), res, 400);
    if (applied.entity_id == entity_id) return error(new Error('Can not apply own promo code.'), res, 400);

    if (applied.usage_limit != -1 && applied.usage_limit <= applied.usage_count) 
      return error(new Error('Usage limit has been exceeded.'), res, 400);

    var now = Date.now();
    if (now < applied.start_time.getTime() || now > applied.expire_time.getTime()) 
      return error(new Error('Promo code has been expired.'), res, 401);

    var now = new Date();
    Code.findOne({ entity_type: entity_type, entity_id: entity_id, start_time: { $lt: now }, expire_time: { $gt: now } }).exec(function(err, applier) {
      if (err) return error(err, res);
      if (!applier) return error(new Error('Applier is not part of the referal system.'), res, 400);

      if (!applied.special && applier.use_limit != -1 && applier.use_limit <= applier.use_count)
        return error(new Error('Use limit has been exceeded.'), res, 401);

      var values = {
        applied: {
          type: applied.entity_type,
          id: applied.entity_id,
          code: applied.code,
          promo_id: applied.promo_id,
          vendor_id: applied.vendor_id
        },
        applier: {
          type: applier.entity_type,
          id: applier.entity_id,
          code: applier.code,
          promo_id: applier.promo_id,
          vendor_id: applier.vendor_id
        }
      };
      
      Network.findOne({ 'applied.code': applied.code, 'applier.code': applier.code }, function(err, result) {
        if (err) return error(err, res);
        if (result) return error(new Error('This promo code was already applied by this user.'), res, 400);

        values.apply_time = new Date();

        Network.create(values, function(err, result) {
          if (err) return error(err, res);
          applied.usage_count++;
          applied.save();

          async.parallel([
            function(cb) {
              if (applied.forward_points <= 0) {
                return cb();
              }
              var status = applied.forward_immediate ? 'fulfiled' : 'pending';
              var values = {
                entity_type: applier.entity_type,
                entity_id: applier.entity_id,
                points: applied.forward_points,
                type: 'forward',
                status: status
              };
              if (status == 'fulfiled') {
                values.fulfiled_time = new Date();
              }
              Reward.create(values, function(err, reward) {
                if (err) return cb(err);
                cb(null, reward);
              });
              if (applied.forward_immediate) {
                Entity.findOne({ entity_type: entity_type, entity_id: entity_id }, function(err, entity) {
                  if (!entity) return ;
                  Transaction.create({
                    to: {
                      type: entity_type,
                      id: entity_id
                    },
                    amount: applied.forward_points
                  }, function(){});

                  entity.points += applied.forward_points;
                  entity.save();
                });
              }
            },
            function(cb) {
              if (applied.special) {
                return cb();
              }
              applier.use_count++;
              applier.save();
              if (applied.backward_points <= 0) {
                return cb();
              }
              var status = applied.backward_immediate ? 'fulfiled' : 'pending';
              var values = {
                entity_type: applied.entity_type,
                entity_id: applied.entity_id,
                points: applied.backward_points,
                type: 'backward',
                status: status
              };
              if (status == 'fulfiled') {
                values.fulfiled_time = new Date();
              }
              Reward.create(values, function(err, reward) {
                if (err) return cb(err);
                cb(null, reward);
              });
              if (applied.backward_immediate) {
                Entity.findOne({ entity_type: applied.entity_type, entity_id: applied.entity_id }, function(err, entity) {
                  if (!entity) return ;
                  Transaction.create({
                    to: {
                      type: applied.entity_type,
                      id: applied.entity_id
                    },
                    amount: applied.backward_points
                  }, function(){});
                  
                  entity.points += applied.backward_points;
                  entity.save();
                });
              }
            }
          ], function(err, results) {
            if (err) return error(err, res);
            var response = {};
            if (results[0]) {
              response.forward_reward = {
                reward_id: results[0].reward_id,
                points: results[0].points,
                entity_type: results[0].entity_type,
                entity_id: results[0].entity_id,
                status: results[0].status
              };
            }
            if (results[1]) {
              response.backward_reward = {
                reward_id: results[1].reward_id,
                points: results[1].points,
                entity_type: results[1].entity_type,
                entity_id: results[1].entity_id,
                status: results[1].status
              };
            }
            ok(response, res);
          });
        });
      });
    });
  });
});

module.exports = router;
