var debug = true;
var os = require('os');
var moment = require('moment');
var async = require('async');
var db = require('../db');
var taobaoApi = require('./api');
var taobaoOrderDao = require('../dao/taobaoorder');

var exec = function(){
    console.info('开始检查淘宝订单');
    //获取当前时间戳
    var now = moment();
    var endtime = now.add(2,'hours').valueOf();
    var starttime = now.subtract(1, 'days').valueOf();
    //syncStatus();
    taobaoApi.batchQueryOrders(starttime,endtime,null,null,function(err,result){
        if (err){
            console.error('批量获取淘宝订单错误',err);
            return;
        }
        if (result.length == 0){
            console.info('淘宝订单数量为0');
            return;
        }
        async.forEachLimit(result,3,function(item,callback){
            var taobaoorderid = item.order_id;
            var status = item.service_status;
            if (status == '已预约'){
                var quality = item.order_item_dolist.order_item_d_o[0].buy_amount;
                var ordertime = moment(item.service_apply_date,'YYYY-MM-DD HH:mm:ss').toDate();
                var doortime = moment(item.service_date,'YYYY-MM-DD HH:mm:ss').toDate();
                var address = item.buyer_address;
                var contact = item.buyer_name;
                var mobile = item.buyer_phone;
                //临时淘宝没有手机号码的处理方案
                mobile = mobile || '18926030755';
                db.query('select * from t_orders_taobao where taobaoorderid = ?',[taobaoorderid],function(err,dborderresult){
                    if (err){
                        console.error('在数据库查询淘宝临时订单错误',err,taobaoorderid);
                        return callback(null);
                    }
                    if (dborderresult.length == 0){
                        return db.query('insert into t_orders_taobao (taobaoorderid,quality,ordertime,doortime,address,contact,mobile,status) values (?,?,?,?,?,?,?,0)',[taobaoorderid,quality,ordertime,doortime,address,contact,mobile],function(err){
                            if (err){
                                console.error('在数据库生成淘宝临时订单错误',err,taobaoorderid);
                                return callback(null);
                            }
                        });
                    }
                    var temporder = dborderresult[0];
                    if (temporder.status == 1){
                        //已经人工匹配到地址
                        var taobaoName = item.buyer_nick;
                        async.series([
                            function(acceptTaobaoOrder){
                                taobaoApi.orderAccept(taobaoorderid,function(err){
                                    return acceptTaobaoOrder(err);
                                });
                            },
                            /*
                            function(dispachWorker){
                                taobaoApi.dispatchWorker(taobaoorderid,workerId,function(err){
                                    return dispachWorker(err);
                                });
                            },
                            */
                            function(updateTaobaoOrder){
                                db.query('update t_orders_taobao set status = 3,dealtime=now() where taobaoorderid = ?',[taobaoorderid],function(err){
                                    return updateTaobaoOrder(err);
                                });
                            },
                            function(dispatchOrder){
                                taobaoOrderDao.order(taobaoName,taobaoorderid,taobaoorderid,-1,ordertime,quality,temporder.cityid,temporder.zoneid,address,contact,mobile,function(err){
                                    return dispatchOrder(err);
                                });
                            }
                        ],function(err){
                            if (err){
                                console.error('处理淘宝订单错误',err,taobaoorderid);
                            }
                            return callback(null);
                        });
                    } else {
                        return callback(null);
                    }
                });
            } else {
                return callback(null);
            }
        },function(err){
            if (err){
                console.error('批量处理淘宝订单错误',err);
            } else {
                console.info('批量处理淘宝订单成功');
            }
        });
    });
};

var syncStatus = function(){
    db.query('select t_orders_taobao.notify,t_orders_taobao.taobaoorderid,t_orders.status,t_orders.id from t_orders_taobao left join t_orders on t_orders_taobao.taobaoorderid = t_orders.vendorid and t_orders.channelid=6 where t_orders_taobao.status = 3',function(err,result){
        if (err){
            console.error('在数据库查询淘宝订单状态错误',err);
            return;
        }
        if (result.length > 0){
            async.forEachLimit(result,3,function(item,callback){
                var taobaoorderid = item.taobaoorderid;
                var orderid = item.id;
                //查询订单在淘宝的状态
                taobaoApi.queryServiceLog(taobaoorderid,function(err,result){
                    if (err){
                        console.error('查询淘宝订单状态错误',err);
                        return callback(null);
                    }
                    var processId = result.process_id;
                    var processName = result.process_name;
                    if (processName == '已接单' && item.status > 0 && item.notify == 0 && item.status < 99){
                        dispatchWorker(taobaoorderid,orderid,processId,function(err){
                            if (err){
                                console.error('通知用户取送人员安排错误',err);
                            }
                            return callback(null);
                        });
                    } else if (processName == '已接单' && item.status > 1 && item.status < 99){
                        taobaoApi.finishServiceLog(taobaoorderid,processId,function(err){
                            if (err){
                                console.error('设置淘宝订单为已上门状态错误',err);
                            }
                            return callback(null);
                        });
                    } else if (processName == '已上门' && item.status > 2 && item.status < 99){
                        taobaoApi.finishServiceLog(taobaoorderid,processId,function(err){
                            if (err){
                                console.error('设置淘宝订单为已收衣状态错误',err);
                            }
                            return callback(null);
                        });
                    } else if (processName == '已收衣' && item.status > 4 && item.status < 99) {
                        taobaoApi.finishServiceLog(taobaoorderid,processId,function(err){
                            if (err){
                                console.error('设置淘宝订单为已送衣状态错误',err);
                            }
                            return callback(null);
                        });
                    } else if (processName == '已送回'){
                        db.query('update t_orders_taobao set status = 10 where taobaoorderid = ?',[taobaoorderid],function(err){
                            if (err){
                                console.error('在数据库中更新淘宝订单状态错误',err);
                            }
                            return callback(null);
                        });
                    } else {
                        return callback(null);
                    }
                });
            },function(err){
                if (err){
                    console.error('批量同步淘宝订单状态错误',err);
                } else {
                    console.info('批量同步淘宝订单状态成功');
                }
            });
        } else {
            console.info('需要同步状态的淘宝订单数量为0');
        }
    });
};


var dispatchWorker = function(taobaoorderid,orderid,processId,callback){
    async.waterfall([
        function(getDispatch){
            db.query('select t_staffs.showname,t_staffs.mobile from t_orders_getshoes left join t_staffs on t_orders_getshoes.username = t_staffs.username where t_orders_getshoes.orderid = ? and t_orders_getshoes.canceled = 0',[orderid],function(err,result){
                if (err){
                    console.error('在数据库查询取鞋人员错误',err);
                    return getDispatch(err);
                }
                if (result.length == 0){
                    return getDispatch('无效的订单');
                }
                return getDispatch(null,result[0]);
            });
        },
        function(staffinfo,taobaoServiceLog){
            taobaoApi.startServiceLog(taobaoorderid,processId,'已安排' + staffinfo.showname + '（' + staffinfo.mobile + '）上门取鞋',function(err,result){
                if (err){
                    console.error('调用淘宝创建服务过程错误',err);
                    return taobaoServiceLog(err);
                }
                if (result.create_success){
                    return taobaoServiceLog(null);
                } else {
                    return taobaoServiceLog('调用淘宝创建服务过程失败');
                }
            });
        },
        function(updateTaobaoOrder){
            db.query('update t_orders_taobao set notify = 1 where taobaoorderid = ?',[taobaoorderid],function(err){
                return updateTaobaoOrder(err);
            })
        }
    ],function(err){
        callback(err);
    });
};

var checktime = function(){
    exec();
    setTimeout(checktime,5*60*1000);
};

var schedule = function(){
    console.log('淘宝订单处理功能启动');
    /*
    //获取WORKERID
    if (!workerId){
        taobaoApi.getWorkerId(function(err,result){
            if (err){
                console.error('获取淘宝服务人员ID错误',err);
            } else {
                workerId = result;
                checktime();
            }
        });
    } else {
        checktime();
    }
    */
    checktime();
};

var start = function(){
    if (debug){
        schedule();
    } else {
        var hostname = os.hostname();
        console.info('主机名称：' + hostname);
        if (hostname == 'web_company_1'){
            schedule();
        }
    }
};

exports.start = start;