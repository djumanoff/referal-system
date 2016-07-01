var async   = require('async');
var errors  = require('./errors');

var models  = require('../init');

var NotFound = errors.NotFound,
    ServerError = errors.ServerError,
    Forbidden = errors.Forbidden,
    BadRequest = errors.BadRequest;

var Code    = models.Code,
    Entity  = models.Entity,
    Reward  = models.Reward,
    Network = models.Network,
    Promo   = models.Promo;

function redeemPoints(params, callback) {
    var amount = params.amount || false;
    var operation_type = params.operation_type || false;
    var operation_id = parseInt(params.operation_id || false);
    var entity_type = params.entity_type || false;
    var entity_id = parseInt(params.entity_id || false);

    if (!operation_id) {
        return callback(BadRequest('You need to specify operation id'));
    }
    if (!operation_type) {
        return callback(BadRequest('You need to specify operation type'));
    }
    if (amount === false) {
        return callback(BadRequest('You need to specify amount'));
    }
    if (!entity_type) {
        return callback(BadRequest('You need to specify entity type'));
    }
    if (entity_id > 0) {
        return callback(BadRequest('You need to specify entity id'));
    }

    Transaction.findOne({ operation_type: operation_type, operation_id: operation_id }, function(err, operation) {
        if (err) return callback(ServerError(err.message));
        if (operation) return callback(null, operation);

        Entity.findOne({ entity_id: entity_id, entity_type: entity_type }, function(err, entity) {
            if (err) return callback(ServerError(err.message));
            if (!entity) return callback(NotFound('Entity not found.'));

            entity.points += amount;
            if (entity.points <= 0) {
                return callback(Forbidden('Not enough points'));
            }

            Transaction.create({
                operation_type: operation_type,
                operation_id: operation_id,
                to: {
                    type: entity.entity_type,
                    id: entity.entity_id
                },
                amount: amount
            }, function(err, trans) {
                if (err) return callback(ServerError(err.message));
                if (!trans) return callback(ServerError('Database server error.'));
                
                entity.save(function(err, row) {
                    if (err) return callback(ServerError(err.message));
                    callback(null, row);
                });                
            });
        });
    });
};
module.exports.redeemPoints = redeemPoints;

function getEntity(params, callback) {
    Entity.findOne(params).exec(function(err, row) {
        if (err) return callback(ServerError(err.message));
        if (!row) return callback(NotFound('Entity not found.'));
        callback(null, row);
    });
};
module.exports.getEntity = getEntity;

function applyPromoCode(params, callback) {
    var code = params.code;
    var entity_type = params.entity_type;
    var entity_id = params.entity_id;

    if (!code) {
        return callback(BadRequest('No promo code.'));
    }

    if (!entity_type || !entity_id) {
        return callback(BadRequest('No applier.'));
    }

    Code.findOne({ code: code, entity_type: entity_type }).exec(function(err, applied) {
        if (err) return callback(ServerError(err.message));

        if (!applied) {
            return callback(Forbidden('Applied code is not part of the referal system.'));
        }
        if (applied.entity_id == entity_id) {
            return callback(Forbidden('Can not apply own promo code.'));
        }
        if (applied.usage_limit != 0 && applied.usage_limit <= applied.usage_count) {
            return callback(Forbidden('Usage limit has been exceeded.'));
        }

        var now = Date.now();
        if (now < applied.start_time.getTime() || now > applied.expire_time.getTime()) {
            return callback(Forbidden('Promo code has been expired.'));
        }

        var now = new Date();
        Code.findOne({ entity_type: entity_type, entity_id: entity_id, start_time: { $lt: now }, expire_time: { $gt: now } }).exec(function(err, applier) {
            if (err) return callback(ServerError(err.message));
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
                if (err) return callback(ServerError(err.message));

                if (result) return callback({ message: 'This promo code was already applied by this user.', status: 400 });

                values.apply_time = new Date();

                Network.create(values, function(err, result) {
                    if (err) return callback(ServerError(err.message));

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
                        if (err) return callback(ServerError(err.message));

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
        if (err) return callback({ message: err.message, status: 500 });
        if (!promo) return callback({ message: 'Promo campaign does not exists.', status: 400 });
        if (promo.code_limit != 0 && promo.code_limit <= promo.code_count) 
            return callback({ message: 'Code count exceeded.', status: 401 });

        Code.findOne({ entity_type: entity_type, entity_id: entity_id }).exec(function(err, code) {
            if (err) return callback({ message: err.message, status: 500 });
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
                if (err) return callback({ message: err.message, status: 500 });

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