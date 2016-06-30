/**
 * Created by jimmychou on 15/1/21.
 */
var express = require('express');
var db = require('../../services/db');
var cancelorder = require('../../services/dao/cancelorder');
var async = require('async');
var orderutil = require('../../utils/order');
var notify_takeoverstaff = require('../../services/notify/takeoverstaff');
var notify_transstaff = require('../../services/notify/transstaff');
var taobaoapi = require('../../services/taobao/api');
var router = express.Router();

var takeoverprogress = function(orderid,username){
    db.query('select showname,mobile from t_staffs where username = ?',[username],function(err,result){
        if (err){
            console.error('获取人员基本信息错误',err);
            return;
        }
        if (result.length == 0){
            return;
        }
        var content = '已重新安排' + result[0].showname + '(电话：<a href="tel:' + result[0].mobile + '">' + result[0].mobile + '</a>)上门取鞋';
        db.query('insert into t_orders_progress (orderid,updatetime,content) values (?,now(),?)',[orderid,content],function(err){
            if (err){
                console.error('写入用户订单进度错误',err);
            }
        });
    });
};

router.post('/index.json',function(req,res){
    var dispatchtime = req.body.dispatchtime;
    if (!dispatchtime){
        dispatchtime = 0;
    }
    if (dispatchtime == 0){
        db.query('select UNIX_TIMESTAMP(t_orders.ordertime) ordertime,t_orders.cityid cityid,t_orders.districtid districtid,t_orders.zoneid zoneid,UNIX_TIMESTAMP(t_orders_getshoes.dispatchtime) dispatchtime,t_cities.city city,t_districts.district district,t_zones.zone zone,t_orders.contact contactname,t_orders.mobile contactmobile,t_orders.address address,t_orders_getshoes.id id,t_orders.id orderid,t_orders.quality quality,UNIX_TIMESTAMP(t_orders.doortime) doortime from t_orders_getshoes left join t_orders on t_orders_getshoes.orderid = t_orders.id left join t_cities on t_orders.cityid = t_cities.id left join t_districts on t_orders.districtid = t_districts.id left join t_zones on t_orders.zoneid = t_zones.id where t_orders_getshoes.username = ? and t_orders_getshoes.finished = 0 and t_orders_getshoes.canceled = 0 and t_orders_getshoes.dispatchtime > FROM_UNIXTIME(?)',[req.body.username,dispatchtime],function(err,result){
            if (err){
                console.error('查询待取鞋订单失败',err);
                return res.json({success:false,message:'系统错误，请重试'});
            }
            return res.json({success:true,data:{
                added:result,
                canceled:[]
            }});
        });
    } else {
        db.query('select UNIX_TIMESTAMP(t_orders.ordertime) ordertime,t_orders.cityid cityid,t_orders.districtid districtid,t_orders.zoneid zoneid,t_orders_getshoes.canceled canceled,UNIX_TIMESTAMP(t_orders_getshoes.dispatchtime) dispatchtime,t_cities.city city,t_districts.district district,t_zones.zone zone,t_orders.contact contactname,t_orders.mobile contactmobile,t_orders.address address,t_orders_getshoes.id id,t_orders.id orderid,t_orders.quality quality,UNIX_TIMESTAMP(t_orders.doortime) doortime from t_orders_getshoes left join t_orders on t_orders_getshoes.orderid = t_orders.id left join t_cities on t_orders.cityid = t_cities.id left join t_districts on t_orders.districtid = t_districts.id left join t_zones on t_orders.zoneid = t_zones.id where t_orders_getshoes.username = ? and t_orders_getshoes.finished = 0 and t_orders_getshoes.dispatchtime > FROM_UNIXTIME(?)',[req.body.username,dispatchtime],function(err,result){
            if (err){
                console.error('查询待取鞋订单失败',err);
                return res.json({success:false,message:'系统错误，请重试'});
            }
            if (result.length == 0){
                return res.json({success:true,data:{
                    added:[],
                    canceled:[]
                }});
            }
            var canceled = [];
            var added = [];
            for (var i = 0;i < result.length;i++){
                var order = result[i];
                if (order.canceled == 1){
                    canceled.push(order.id);
                } else {
                    delete order.canceled;
                    added.push(order);
                }
            }
            return res.json({success:true,data:{
                added:added,
                canceled:canceled
            }});
        });
    }
});

router.post('/search.json',function(req,res){
    var orderno = req.body.orderno;
    if (!orderno){
        return res.json({success:false,message:'无效的订单号'});
    }
    if (orderno.length < 14){
        return res.json({success:false,message:'错误的订单号长度'});
    }
    //处理订单号
    var orderid = orderutil.parseorderno(orderno);
    db.query('select UNIX_TIMESTAMP(t_orders.ordertime) ordertime,t_orders.cityid cityid,t_orders.districtid districtid,t_orders.zoneid zoneid,t_orders_getshoes.username username,t_cities.city city,t_districts.district district,t_zones.zone zone,t_orders.contact contactname,t_orders.mobile contactmobile,t_orders.address address,t_orders_getshoes.id id,t_orders.id orderid,t_orders.quality quality,UNIX_TIMESTAMP(t_orders.doortime) doortime from t_orders left join t_orders_getshoes on t_orders_getshoes.orderid = t_orders.id left join t_cities on t_orders.cityid = t_cities.id left join t_districts on t_orders.districtid = t_districts.id left join t_zones on t_orders.zoneid = t_zones.id where t_orders.id = ? and t_orders.status = 1 and t_orders_getshoes.canceled = 0 and t_orders_getshoes.finished = 0',[orderid],function(err,result){
        if (err){
            console.error('查询取鞋订单错误',err);
            return res.json({success:false,message:'系统错误，请重试'});
        }
        if (result.length == 0){
            return res.json({success:false,message:'没有此订单号对应的取鞋工单'});
        }
        return res.json({success:true,data:result[0]});
    });
});

router.post('/takeover.json',function(req,res){
    var username = req.body.username;
    var ticketid = req.body.ticketid;
    if (!ticketid){
        return res.json({success:false,message:'无效的取鞋工单'});
    }
    db.query('select orderid,username from t_orders_getshoes where id = ? and finished = 0 and canceled = 0',[ticketid],function(err,result){
        if (err){
            console.error('查询取鞋工单错误',err);
            return res.json({success:false,message:'系统错误，请重试'});
        }
        if (result.length == 0){
            return res.json({success:false,message:'无效的取鞋工单'});
        }
        var oldusername = result[0].username;
        if (oldusername == username){
            return res.json({success:true,data:true});
        }
        var orderid = result[0].orderid;
        db.query('update t_orders_getshoes set username = ?,dispatchtime = now() where id = ?',[username,ticketid],function(err){
            //开始通知原用户单已取消
            if (err){
                console.error('更新取鞋工单任务人错误',err);
                return res.json({success:false,message:'系统错误，请重试'});
            }
            db.query('select doortime,address from t_orders where id = ?',[orderid],function(err,result){
                if (err){
                    console.error('更新取鞋工单任务时获取订单信息错误',err);
                    return;
                }
                if (result.length == 0){
                    return;
                }
                notify_takeoverstaff.start(oldusername,result[0].doortime,result[0].address);
            });
            takeoverprogress(orderid,username);
            return res.json({success:true,data:true});
        });
    });
});

router.post('/trans.json',function(req,res){
    var username = req.body.username;
    var newusername = req.body.newusername;
    if (!newusername){
        return res.json({success:false,message:'无效的工单处理人'});
    }
    if (newusername == username){
        return res.json({success:false,message:'不能转交自己处理'});
    }
    var ticketid = req.body.ticketid;
    if (!ticketid){
        return res.json({success:false,message:'无效的取鞋工单'});
    }
    db.query('select orderid,username from t_orders_getshoes where id = ? and finished = 0 and canceled = 0',[ticketid],function(err,result){
        if (err){
            console.error('查询取鞋工单错误',err);
            return res.json({success:false,message:'系统错误，请重试'});
        }
        if (result.length == 0){
            return res.json({success:false,message:'无效的取鞋工单'});
        }
        var oldusername = result[0].username;
        if (oldusername != username){
            return res.json({success:false,message:'无效的取鞋工单'});
        }
        var orderid = result[0].orderid;
        db.query('update t_orders_getshoes set username = ?,dispatchtime = now() where id = ?',[newusername,ticketid],function(err){
            //开始通知新用户有单转交
            if (err){
                console.error('更新取鞋工单任务人错误',err);
                return res.json({success:false,message:'系统错误，请重试'});
            }
            db.query('select doortime,address from t_orders where id = ?',[orderid],function(err,result){
                if (err){
                    console.error('更新取鞋工单任务时获取订单信息错误',err);
                    return;
                }
                if (result.length == 0){
                    return;
                }
                notify_transstaff.start(newusername,result[0].doortime,result[0].address);
            });
            takeoverprogress(orderid,newusername);
            return res.json({success:true,data:true});
        });
    });
});

router.post('/cancel.json',function(req,res){
    var orderid = req.body.orderid;
    if (!orderid){
        return res.json({success:false,message:'无效的订单'});
    }
    cancelorder.start(orderid,'物流人员',req.body.reason,false,true,function(err){
        if (err){
            console.error('取消订单错误',err);
            return res.json({success:false,message:err});
        }
        return res.json({success:true,data:true});
    });
});

router.post('/call.json',function(req,res){
    var orderid = req.body.orderid;
    if (!orderid){
        return res.json({success:false,message:'无效的订单'});
    }
    var mobile = req.body.mobile;
    if (!mobile){
        return res.json({success:false,message:'无效的用户联系电话'});
    }
    var ticketid = req.body.ticketid;
    if (!ticketid){
        return res.json({success:false,message:'无效的取鞋工单'});
    }
    db.query('insert into t_orders_call (orderid,ticketid,calltype,calltime) values (?,?,0,now())',[orderid,ticketid],function(err){
        if (err){
            console.error('插入物流取鞋电话记录失败',err);
        }
        return res.json({success:true,data:mobile});
    });
});

router.post('/recv.json',function(req,res){
    var ticketid = req.body.ticketid;
    var orderid = req.body.orderid;
    var packagecode = req.body.packagecode;
    if (!ticketid){
        return res.json({success:false,message:'无效的取鞋工单'});
    }
    if (!orderid){
        return res.json({success:false,message:'无效的订单'});
    }
    db.query('select status from t_orders where id = ?',[orderid],function(err,result){
        if (err || result.length == 0){
            console.error('取鞋时查询订单错误');
            return res.json({success:false,message:'无效的订单'});
        }
        var status = result[0].status;
        if (status != 1){
            //可能是重复操作
            return res.json({success:true,data:true});
        }
        if (!packagecode || packagecode.length == 0){
            //开始结束订单事务
            db.getConnection(function(err, connection) {
                if (err){
                    console.error('从数据库连接池获取连接失败',err);
                    return res.json({success:false,message:'系统错误，请重试'});
                }
                connection.beginTransaction(function(err){
                    if (err){
                        connection.release();
                        return res.json({success:false,message:'系统错误，请重试'});
                    }
                    async.series([
                        function(update_order){
                            connection.query('update t_orders set status = 10 where id = ?',[orderid],function(err){
                                update_order(err);
                            });
                        },
                        function(update_ticket){
                            connection.query('update t_orders_getshoes set finished = 1, finishtime = now() where id = ?',[ticketid],function(err){
                                update_ticket(err);
                            });
                        },
                        function(insert_progress){
                            connection.query('insert into t_orders_progress (orderid,updatetime,content) values (?,now(),?)',[orderid,'您没有交付任何鞋子清洗，订单已完成'],function(err){
                                insert_progress(err);
                            });
                        }
                    ],function(err){
                        if (err) {
                            console.warn('在数据库完成订单时出错回滚',err);
                            return connection.rollback(function(){
                                connection.release();
                                return res.json({success:false,message:'系统错误，请重试'});
                            });
                        }
                        return connection.commit(function(err){
                            if (err){
                                return connection.rollback(function(){
                                    connection.release();
                                    return res.json({success:false,message:'系统错误，请重试'});
                                });
                            }
                            connection.release();
                            return res.json({success:true,data:true});
                        });
                    });
                });
            });
        } else {
            var packages = packagecode.split(',');
            //开始改变订单状态，STATUS= 2事务
            db.getConnection(function(err, connection) {
                if (err){
                    console.error('从数据库连接池获取连接失败',err);
                    return res.json({success:false,message:'系统错误，请重试'});
                }
                connection.beginTransaction(function(err){
                    if (err){
                        connection.release();
                        return res.json({success:false,message:'系统错误，请重试'});
                    }
                    async.series([
                        function(update_order){
                            connection.query('update t_orders set status = 2 where id = ?',[orderid],function(err){
                                update_order(err);
                            });
                        },
                        function(update_ticket){
                            connection.query('update t_orders_getshoes set finished = 1, finishtime = now() where id = ?',[ticketid],function(err){
                                update_ticket(err);
                            });
                        },
                        function(insert_progress){
                            connection.query('insert into t_orders_progress (orderid,updatetime,content) values (?,now(),?)',[orderid,'已接收到您的' + packages.length + '双鞋子，开始发往工厂清洗'],function(err){
                                insert_progress(err);
                            });
                        },
                        function(insert_package){
                            async.forEach(packages,function(item,callback){
                                var ordinal = packages.indexOf(item);
                                if (ordinal < 0){
                                    callback(new Error('无效的对象'));
                                } else {
                                    connection.query('insert into t_orders_package (orderid,packagecode,recvtime,status,ordinal,totals) values (?,?,now(),0,?,?)',[orderid,item,ordinal + 1,packages.length],function(err){
                                        callback(err);
                                    });
                                }
                            },function(err){
                                insert_package(err);
                            });
                        }
                    ],function(err){
                        if (err) {
                            console.warn('在数据库完成订单时出错回滚',err);
                            return connection.rollback(function(){
                                connection.release();
                                return res.json({success:false,message:'系统错误，请重试'});
                            });
                        }
                        return connection.commit(function(err){
                            if (err){
                                return connection.rollback(function(){
                                    connection.release();
                                    return res.json({success:false,message:'系统错误，请重试'});
                                });
                            }
                            connection.release();
                            return res.json({success:true,data:true});
                        });
                    });
                });
            });
        }
    });
});

module.exports = router;