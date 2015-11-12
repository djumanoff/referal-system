var router = require('touchka').Router();

var error = require('touchka').error;
var ok = require('touchka').ok;

router

.get('/', function(req, res) {
  Reward.find(req.query).exec(function(err, result) {
    if (err) return error(err, res);
    ok({ list: result }, res);
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

.post('/:reward_id/fulfil', function(req, res) {
  var reward_id = req.params.reward_id;

  Reward.findOne({ status: 'pending', reward_id: reward_id }, function(err, reward) {
    if (err) return error(err, res);
    if (!reward) return error(new Error('Reward not found.'), res, 404);

    Entity.findOne({ entity_type: reward.entity_type, entity_id: reward.entity_id }, function(err, entity) {
      if (err) return error(err, res);
      if (!entity) return error(new Error('Entity not found.'), res, 404);

      reward.status = 'fulfiled';
      reward.fulfiled_time = new Date();
      reward.save(function(err, result) {
        if (err) return error(err, res);
        
        entity.points += reward.points;
        entity.save();

        ok({ total: entity.points }, res);

        Transaction.create({
          to: {
            type: entity.entity_type,
            id: entity.entity_id
          },
          amount: reward.points
        }, function() {});
      });
    });
  });
});

module.exports = router;
