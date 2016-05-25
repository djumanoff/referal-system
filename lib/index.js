var async = require('async');


function applyPromoCode(params, callback) {
    var code = params.code;
    var entity_type = params.entity_type;
    var entity_id = params.entity_id;

    if (!code) {
        return callback({ message: 'No promo code.', status: 400 });
    }

    if (!entity_type || !entity_id) {
        return callback({ message: 'No applier.', status: 400 });
    }

    Code.findOne({ code: code, entity_type: entity_type }).exec(function(err, applied) {
        if (err) return callback({ message: err.message, status: err.code || 500 });

        if (!applied) return callback({ message: 'Applied code is not part of the referal system.', status: 400 });
        if (applied.entity_id == entity_id) return callback({ message: 'Can not apply own promo code.', status: 400 });

        if (applied.usage_limit != 0 && applied.usage_limit <= applied.usage_count) 
            return callback({ message: 'Usage limit has been exceeded.', status: 400 });

        var now = Date.now();
        if (now < applied.start_time.getTime() || now > applied.expire_time.getTime()) 
            return callback({ message: 'Promo code has been expired.', status: 401 });

        var now = new Date();
        Code.findOne({ entity_type: entity_type, entity_id: entity_id, start_time: { $lt: now }, expire_time: { $gt: now } }).exec(function(err, applier) {
            if (err) return callback({ message: err.message, status: err.code || 500 });
            if (!applier) return callback({ message: 'Applier is not part of the referal system.', status: 400 });

            if (!applied.special && applier.use_limit != 0 && applier.use_limit <= applier.use_count)
                return callback({ message: 'Use limit has been exceeded.', code: 401 });

            if (applied.code_id > applier.code_id) 
                return callback({ message: 'You can\'t use promo code of the newely registered user.', code: 401 });

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
                if (err) return callback({ message: err.message, status: err.code || 500 });

                if (result) return callback({ message: 'This promo code was already applied by this user.', status: 400 });

                values.apply_time = new Date();

                Network.create(values, function(err, result) {
                    if (err) return callback({ message: err.message, status: err.code || 500 });

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
                        if (err) return next({ message: err.message, status: err.code || 500 });

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

                        callback(null, response);
                    });
                });
            });
        });
    });
};
module.exports.applyPromoCode = applyPromoCode;


function getPromoCode(params, callback) {
    var entity_type = params.entity_type;
    var entity_id = parseInt(params.entity_id);

    if (!entity_type) {
        return callback({ message: 'No entity type.', status: 400 });
    }

    if (!entity_id) {
        return callback({ message: 'No entity id.', status: 400 });
    }

    var now = new Date();
    Promo.findOne({
        entity_type: entity_type, 
        active: true, 
        start_time: { $lt: now },
        expire_time: { $gt: now }
    }).exec(function(err, promo) {
        if (err) return callback({ message: err.message, status: err.code || 500 });
        if (!promo) return callback({ message: 'Promo campaign does not exists.', status: 400 });
        if (promo.code_limit != 0 && promo.code_limit <= promo.code_count) 
            return callback({ message: 'Code count exceeded.', status: 401 });

        Code.findOne({ entity_type: entity_type, entity_id: entity_id }).exec(function(err, code) {
            if (err) return callback({ message: err.message, status: err.code || 500 });
            if (code) {
                return callback(null, {
                    code: code.code,
                    forward_points: code.forward_points,
                    backward_points: code.backward_points
                });
            }

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
                if (err) return callback({ message: err.message, status: err.code || 500 });

                promo.code_count++;
                promo.save();

                return callback(null, {
                    code: result.code,
                    forward_points: result.forward_points,
                    backward_points: result.backward_points
                });
            });
        });    
    });
};
module.exports.getPromoCode = getPromoCode;