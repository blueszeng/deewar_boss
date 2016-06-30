var dispatchdao = require('./dispatch');
var db = require('../db');
var async = require('async');
var moment = require('moment');

var order = function(vendorid,marketid,ordertime,quality,cityid,zoneid,address,contact,mobile,callback){
    //计算价格
    var priceobject = null;
    if (marketid == -1){
        priceobject = {
            price:quality*18,
            couponmoney:0,
            balanceuse:0,
            onlinepay:quality*18
        };
    }
    if (!priceobject){
        return callback('未配置的到位活动类型');
    }

    //使用优惠券和余额的事务
    db.getConnection(function(err, connection) {
        if (err){
            console.error('从数据库连接池获取连接失败',err);
            return callback('订单生成失败');
        }
        connection.beginTransaction(function(err){
            if (err){
                connection.release();
                return callback('订单生成失败');
            }
            async.waterfall([
                function(select_districtid){
                    connection.query('select districtid from t_zones where id = ?',[zoneid],function(err,result){
                        if (err){
                            console.error('在数据库中获取行政区错误',err);
                            return select_districtid('获取行政区错误');
                        }
                        if (result.length == 0){
                            return select_districtid('获取行政区错误');
                        }
                        return select_districtid(null,result[0].districtid);
                    });
                },
                function(districtid,select_user){
                    connection.query('select id from t_users where mobile = ? and channelid = 9',[mobile],function(err,result){
                        if (err){
                            console.error('在数据库中查询到位用户错误',err);
                            return select_user('获取用户错误');
                        }
                        if (result.length == 0){
                            return select_user(null,{
                                districtid:districtid,
                                userid:-1
                            });
                        } else {
                            return select_user(null,{
                                districtid:districtid,
                                userid:result[0].id
                            });
                        }
                    });
                },
                function(info,insert_user){
                    if (info.userid == -1){
                        connection.query('insert into t_users (mobile,createtime,channelid,updatetime) values (?,now(),9,now())',[mobile],function(err,result){
                            if (err){
                                console.error('插入到位用户错误',err);
                                return insert_user('用户生成错误');
                            }
                            return insert_user(null,{
                                districtid:info.districtid,
                                userid:result.insertId,
                                profile:1
                            })
                        });
                    } else {
                        return insert_user(null,{
                            districtid:info.districtid,
                            userid:info.userid,
                            profile:0
                        })
                    }
                },
                function(info,update_user){
                    if (info.profile == 1){
                        connection.query('insert into t_users_profile (userid,nickname,sex,updatetime) values (?,?,0,now())',[info.userid,contact],function(err){
                            if (err){
                                console.error('更新到位用户资料错误',err);
                                return update_user('用户更新错误');
                            }
                            return update_user(null,{
                                districtid:info.districtid,
                                userid:info.userid
                            });
                        });
                    } else {
                        return update_user(null,{
                            districtid:info.districtid,
                            userid:info.userid
                        });
                    }
                },
                function(info,select_address){
                    connection.query('select id from t_users_address where userid = ? and zoneid = ? and address = ? and contact = ? and mobile = ?',[info.userid,zoneid,address,contact,mobile],function(err,result){
                        if (err){
                            console.error('在数据库中查询到位用户地址错误',err);
                            return select_address('获取用户地址信息错误');
                        }
                        if (result.length == 0){
                            return select_address(null,{
                                districtid:info.districtid,
                                userid:info.userid,
                                addressid:-1
                            });
                        } else {
                            return select_address(null,{
                                districtid:info.districtid,
                                userid:info.userid,
                                addressid:result[0].id
                            });
                        }
                    });
                },
                function(info,insert_address){
                    if (info.addressid == -1){
                        connection.query('insert into t_users_address (userid,address,updatetime,contact,mobile,lastusetime,cityid,districtid,zoneid) values (?,?,now(),?,?,now(),?,?,?)',[info.userid,address,contact,mobile,cityid,info.districtid,zoneid],function(err,result){
                            if (err){
                                console.error('插入到位用户地址错误',err);
                                return insert_address('地址生成错误');
                            }
                            return insert_address(null,{
                                districtid:info.districtid,
                                userid:info.userid,
                                addressid:result.insertId
                            });
                        });
                    } else {
                        return insert_address(null,{
                            districtid:info.districtid,
                            userid:info.userid,
                            addressid:info.addressid
                        });
                    }
                },
                function(info,insert_order){
                    //计算上门时间
                    var doortimevalue = moment().startOf('day').add(ordertime, 'h').toDate();
                    connection.query('insert into t_orders (userid,status,addressid,doortime,quality,price,ordertime,couponmoney,balanceuse,paytime,cityid,districtid,zoneid,mobile,contact,address,marketid,channelid,vendorid) values (?,1,?,?,?,?,now(),?,?,now(),?,?,?,?,?,?,?,9,?)',[info.userid,info.addressid,doortimevalue,quality,priceobject.price,priceobject.couponmoney,priceobject.balanceuse,cityid,info.districtid,zoneid,mobile,contact,address,marketid,vendorid],function(err,result){
                        if (err){
                            console.error('插入到位订单错误',err);
                            return insert_order('订单生成错误');
                        }
                        return insert_order(null,{
                            orderid:result.insertId,
                            userid:info.userid
                        });
                    });
                },
                function(info,insert_pay){
                    var payedtime = moment().format('YYYYMMDDHHmmss');
                    connection.query('insert into t_orders_pay (orderid,userid,payedtime,transactionid,updatetime,totalfee,openid,tradetype) values (?,?,?,?,now(),?,?,2)',[info.orderid,info.userid,payedtime,vendorid,priceobject.onlinepay * 100,mobile],function(err){
                        if (err){
                            console.error('插入到位订单支付信息错误',err);
                            return insert_pay('订单支付信息错误');
                        }
                        return insert_pay(null,{
                            orderid:info.orderid,
                            userid:info.userid
                        });
                    });
                }
            ],function(err,result){
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
                    dispatchdao.start(result.orderid);
                    return callback(null);
                });
            });
        });
    });

};

exports.order = order;