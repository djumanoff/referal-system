var router = require('express').Router();

var Reward = require('../init').Reward;
var Entity = require('../init').Entity;
var Transaction = require('../init').Transaction;

router

.get('/', function(req, res, next) {
  Reward.find(req.query).exec(function(err, result) {
    if (err) return next(err);
    res.response = { list: result };
    next();
  });
})

/**
 * Fulfil reward
 *
 * Examples:
 * GET /rewards/41/fulfil
 *
 * RESPONSE:
 * {
 *   total: 0
 * }
 *
 * @param reward_id <integer> - ID of the reward
 * @return object - total number of points left to user
 */

.post('/:reward_id/fulfil', function(req, res, next) {
  var reward_id = req.params.reward_id;

  Reward.findOne({ status: 'pending', reward_id: reward_id }, function(err, reward) {
    if (err) return next(err);
    if (!reward) return next({ message: 'Reward not found.', status: 404 });

    Entity.findOne({ entity_type: reward.entity_type, entity_id: reward.entity_id }, function(err, entity) {
      if (err) return next(err);
      if (!entity) return next({ message: 'Entity not found.', status: 404 });

      reward.status = 'fulfiled';
      reward.fulfiled_time = new Date();
      reward.save(function(err, result) {
        if (err) return next(err);
        
        entity.points += reward.points;
        entity.save();        

        Transaction.create({
          to: {
            type: entity.entity_type,
            id: entity.entity_id
          },
          amount: reward.points
        }, function() {});

        res.response = { total: entity.points };
        next();
      });
    });
  });
});

module.exports = router;
