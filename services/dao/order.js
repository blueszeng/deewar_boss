/**
 * Created by jimmychou on 15/2/13.
 */
var db = require('../db');
var dispatch = require('./dispatch');
var async = require('async');
var wechat = require('../wechat/api');
var wechatticket = require('../coupon/wechatcard');
var debug = true;

module.exports.deal = function(orderinfo,callback){
    //使用优惠券和余额的事务
    db.getConnection(function(err, connection) {
        if (err){
            console.error('从数据库连接池获取连接失败',err);
            return callback('订单处理失败');
        }
        connection.beginTransaction(function(err){
            if (err){
                connection.release();
                return callback('订单处理失败');
            }
            async.series([
                function(update_coupon){
                    if (orderinfo.coupon && orderinfo.coupon.money > 0 && orderinfo.coupon.couponid > -1){
                        connection.query('update t_users_coupon set status = 1,updatetime = now(),orderid = ? where id = ?',[orderinfo.orderid,orderinfo.coupon.couponid],function(err){
                            if (err){
                                update_coupon(err);
                            } else {
                                connection.query('select t_coupons.cardid cardid,t_users_coupon.couponcode couponcode,t_users_coupon.binded binded from t_users_coupon left join t_coupons on t_users_coupon.couponid = t_coupons.id where t_users_coupon.id = ?',[orderinfo.coupon.couponid],function(err,result){
                                    if (err){
                                        console.error('在数据库再次查询优惠券状态错误',err);
                                        update_coupon(null);
                                    } else {
                                        if (result.length == 0){
                                            update_coupon(null);
                                        } else {
                                            var coupon = result[0];
                                            if (coupon.binded == 1){
                                                wechatticket.consumecard(coupon.cardid,coupon.couponcode,function(err){
                                                    if (err){
                                                        update_coupon(err);
                                                    } else {
                                                        update_coupon(null);
                                                    }
                                                });
                                            } else {
                                                update_coupon(null);
                                            }
                                        }
                                    }
                                });
                            }
                        });
                    } else {
                        return update_coupon(null);
                    }
                },
                function(update_balance){
                    if (orderinfo.balanceuse != 0){
                        connection.query('update t_users_money set balance = balance - ? ,updatetime = now() where userid = ?',[orderinfo.balanceuse,orderinfo.userid],function(err){
                            if (err){
                                update_balance(err);
                            } else {
                                update_balance(null);
                            }
                        });
                    } else {
                        update_balance(null);
                    }
                },
                function(new_traderecord){
                    if (orderinfo.balanceuse != 0){
                        connection.query('insert into t_users_trade (userid,tradetype,tradetime,amount,orderid) values (?,?,now(),?,?)',[orderinfo.userid,'余额消费',orderinfo.balanceuse,orderinfo.orderid],function(err){
                            if (err){
                                new_traderecord(err);
                            } else {
                                new_traderecord(null);
                            }
                        });
                    } else {
                        new_traderecord(null);
                    }
                },
                function(update_order){
                    var cmoney = 0;
                    if (orderinfo.coupon && orderinfo.coupon.money > 0 && orderinfo.coupon.couponid > -1){
                        cmoney = orderinfo.coupon.money;
                    }
                    connection.query('update t_orders set status = 1,paytime = now(),couponmoney = ?,balanceuse = ? where id = ?',[cmoney,orderinfo.balanceuse,orderinfo.orderid],function(err){
                        if (err){
                            update_order(err);
                        } else {
                            update_order(null);
                        }
                    });
                }
            ],function(err){
                if (err) {
                    console.warn('在数据库执行订单交易时出错回滚',err);
                    return connection.rollback(function(){
                        connection.release();
                        return callback('订单处理失败');
                    });
                }
                return connection.commit(function(err){
                    if (err){
                        return connection.rollback(function(){
                            connection.release();
                            return callback('订单处理失败');
                        });
                    }
                    connection.release();
                    //开始进入订单派送处理过程
                    dispatch.start(orderinfo.orderid);
                    return callback(null);
                });
            });
        });
    });
};