/**
 * Created by jimmychou on 15/1/24.
 */
var async = require('async');
var db = require('../db');
var wechatpay = require('../pay/wechatpay');
var seedutil = require('../../utils/seed');
var notify_cancelorderstaff = require('../notify/cancelorderstaff');
var notify_cancelorderuser = require('../notify/cancelorderuser');

var start = function(orderid,canceler,reason,notifyperson,notifyuser,callback){
    //开始取消订单
    db.query('select t_orders.couponmoney couponmoney,t_orders.id id,t_users.mobile usermobile,t_users.wechatid wechatid,t_users.wechatactive wechatactive,t_orders_pay.transactionid transid,t_orders_pay.id payid,t_orders_pay.totalfee payfee,t_orders_pay.tradetype tradetype,t_orders.address address,t_orders.cityid cityid,t_orders.ordertime ordertime,t_orders.doortime doortime, t_orders.userid userid,t_orders.status status,t_orders.balanceuse balanceuse from t_orders left join t_users on t_orders.userid = t_users.id left join t_orders_pay on t_orders.id = t_orders_pay.orderid where t_orders.id = ?',[orderid],function(err,result){
        if (err){
            console.error('在数据库查询订单错误',err);
            return callback('系统错误，请重试');
        }
        if (result.length == 0){
            return callback('无效的订单');
        }
        var order = result[0];
        if (order.status != 1){
            return callback('当前状态无法取消');
        }
        //开始取消订单事务
        db.getConnection(function(err, connection) {
            if (err){
                console.error('从数据库连接池获取连接失败',err);
                return callback('系统错误，请重试');
            }
            connection.beginTransaction(function(err){
                if (err){
                    connection.release();
                    return callback('系统错误，请重试');
                }
                async.waterfall([
                    function(update_order){
                        connection.query('update t_orders set status = 99 where id = ?',[orderid],function(err){
                            update_order(err);
                        });
                    },
                    function(update_balance){
                        if (order.balanceuse > 0){
                            connection.query('update t_users_money set balance = balance + ' + order.balanceuse + ',updatetime = now() where userid = ?',[order.userid],function(err){
                                update_balance(err);
                            });
                        } else {
                            update_balance(null);
                        }
                    },
                    function(update_coupon){
                        if (order.couponmoney > 0){
                            connection.query('select couponid,gettime from t_users_coupon where userid = ? and status = 1 and orderid = ?',[order.userid,orderid],function(err,result){
                                if (err){
                                    console.error('在数据库查询需要撤销的优惠券使用错误',err);
                                    update_coupon(null);
                                } else {
                                    if (result.length == 0){
                                        update_coupon(null);
                                    } else {
                                        var coupon = result[0];
                                        seedutil.getseedcode12(function(code){
                                            connection.query('insert into t_users_coupon (userid,couponid,gettime,updatetime,couponcode,channelid,binded,status) values (?,?,?,now(),?,3,0,0)',[order.userid,coupon.couponid,coupon.gettime,code],function(err){
                                                update_coupon(err);
                                            });
                                        });
                                    }
                                }
                            });
                        } else {
                            update_coupon(null);
                        }
                    },
                    function(update_trade){
                        if (order.balanceuse > 0){
                            connection.query('insert into t_users_trade (userid,tradetime,tradetype,amount,orderid) values (?,now(),?,?,?)',[order.userid,'退款',order.balanceuse,orderid],function(err){
                                update_trade(err);
                            });
                        } else {
                            update_trade(null);
                        }
                    },
                    function(update_thirdpay){
                        if (order.payid != null && order.tradetype == 1){
                            connection.query('insert into t_finance_refund (payid,amount,isrefund,createtime,transid,tradetype,refundtime) values (?,?,1,now(),?,1,now())',[order.payid,order.payfee,order.transid],function(err){
                                if (err){
                                    return update_thirdpay(err);
                                }
                                return wechatpay.payment.refund({
                                    out_trade_no:orderid,
                                    out_refund_no:order.payid,
                                    total_fee:order.payfee,
                                    refund_fee:order.payfee
                                },function(err){
                                    if (err){
                                        console.error('微信支付退款失败',err);
                                        return update_thirdpay(err);
                                    } else {
                                        return update_thirdpay(null);
                                    }
                                });
                            });
                        } else if (order.payid != null && order.tradetype == 2) {
                            connection.query('insert into t_finance_refund (payid,amount,isrefund,createtime,transid,tradetype) values (?,?,0,now(),?,2)',[order.payid,order.payfee,order.transid],function(err){
                                update_thirdpay(err);
                            });
                        } else {
                            update_thirdpay(null);
                        }
                    },
                    function(update_failorder){
                        connection.query('update t_orders_fail set dealed = 1,dealtime = now() where orderid = ? and dealed = 0',[orderid],function(err){
                            update_failorder(err);
                        });
                    },
                    function(insert_progress){
                        var progresstext = '订单已由' + canceler + '因'+reason+'原因取消';
                        var tiptext = '';
                        if (order.payid != null && order.tradetype == 1){
                            progresstext += '，通过微信支付的' + (order.payfee / 100) + '元已退款到微信钱包';
                            tiptext += '通过微信支付的' + (order.payfee / 100) + '元已退款到微信钱包';
                        } else if (order.payid != null && order.tradetype == 2){
                            progresstext += '，通过支付宝付款的' + (order.payfee / 100) + '元将在1个工作日内退款';
                            tiptext += '通过支付宝付款的' + (order.payfee / 100) + '元将在1个工作日内退款';
                        }
                        if (order.balanceuse > 0){
                            progresstext += '，已退款' + order.balanceuse + '元到余额';
                            if (tiptext == ''){
                                tiptext = '已退款' + order.balanceuse + '元到余额';
                            } else {
                                tiptext += '，已退款' + order.balanceuse + '元到余额';
                            }
                        }
                        if (order.couponmoney > 0){
                            progresstext += '，已补偿' + order.couponmoney + '元优惠券一张';
                            if (tiptext == ''){
                                tiptext = '已补偿' + order.couponmoney + '元优惠券一张';
                            } else {
                                tiptext += '，已补偿' + order.couponmoney + '元优惠券一张';
                            }
                        }
                        connection.query('insert into t_orders_progress (orderid,updatetime,content) values (?,now(),?)',[orderid,progresstext],function(err){
                            insert_progress(err,tiptext);
                        });
                    },
                    function(tiptext,insert_cancelorder){
                        connection.query('insert into t_orders_cancel (orderid,canceltime,canceler,reason) values (?,now(),?,?)',[orderid,canceler,reason],function(err){
                            insert_cancelorder(err,tiptext);
                        });
                    },
                    function(tiptext,select_getshoes){
                        connection.query('select username from t_orders_getshoes where orderid = ? and canceled = 0 and finished = 0',[orderid],function(err,result){
                            select_getshoes(err,{
                                usernames:result,
                                tiptext:tiptext
                            });
                        });
                    },
                    function(usernames,update_getshoes){
                        connection.query('update t_orders_getshoes set canceled = 1,canceltime = now(),dispatchtime=now() where orderid = ? and canceled = 0 and finished = 0',[orderid],function(err){
                            update_getshoes(err,usernames);
                        });
                    }
                ],function(err,result){
                    if (err) {
                        console.warn('在数据库取消订单时出错回滚',err);
                        return connection.rollback(function(){
                            connection.release();
                            return callback('系统错误，请重试');
                        });
                    }
                    return connection.commit(function(err){
                        if (err){
                            return connection.rollback(function(){
                                connection.release();
                                return callback('系统错误，请重试');
                            });
                        }
                        connection.release();
                        if (notifyuser){
                            notify_cancelorderuser.start(order.wechatid,order.wechatactive,order.usermobile,result.tiptext,order.cityid,orderid,order.ordertime,canceler,reason,order.userid);
                        }
                        var usernames = result.usernames;
                        if (usernames.length > 0 && notifyperson){
                            notify_cancelorderstaff.start(usernames[0].username,order.doortime,order.address);
                        }
                        return callback(null);
                    });
                });
            });
        });
    });
};

exports.start = start;