/**
 * Created by jimmychou on 15/2/3.
 */
var express = require('express');
var db = require('../../services/db');
var async = require('async');
var commissionagentdao = require('../../services/dao/commissionagent');
var notify_returnshoesuser = require('../../services/notify/returnshoesuser');
var router = express.Router();

router.post('/search.json',function(req,res){
    var orderid = req.body.orderid;
    if (!orderid){
        return res.json({success:false,message:'无效的订单'});
    }
    var username = req.body.username;
    //查询条件，已经洗完了的，没有被其他同事承接的
    db.query('select totals from t_orders_package where orderid = ? and status = 2',[orderid],function(err,result){
        if (err){
            console.error('查询可送鞋订单错误',err);
            return res.json({success:false,message:'系统错误'});
        }
        if (result.length == 0){
            return res.json({success:false,message:'鞋子尚未清洗完或无效的订单'});
        }
        var record = result[0];
        if (result.length != record.totals){
            return res.json({success:false,message:'鞋子尚未全部清洗完出厂'});
        }
        //再查询是不是有其他同事接单
        db.query('select username from t_orders_returnshoes where orderid = ? and finished = 0 and canceled = 0',[orderid],function(err,result){
            if (err){
                console.error('查询可送鞋订单错误',err);
                return res.json({success:false,message:'系统错误'});
            }
            if (result.length > 0){
                var record = result[0];
                if (record.username == username){
                    return res.json({success:false,message:'该订单的送鞋工单已接单了'});
                } else {
                    return res.json({success:false,message:'该订单的送鞋工单已由其他同事接单'});
                }
            }
            //开始查询订单信息
            db.query('select UNIX_TIMESTAMP(t_orders_getshoes.finishtime) gettime,UNIX_TIMESTAMP(t_orders.ordertime) ordertime,t_orders.cityid cityid,t_orders.districtid districtid,t_orders.zoneid zoneid,t_cities.city city,t_districts.district district,t_zones.zone zone,t_orders.contact contactname,t_orders.mobile contactmobile,t_orders.address address,t_orders.id orderid,t_orders.quality quality,UNIX_TIMESTAMP(t_orders.doortime) doortime from t_orders left join t_orders_getshoes on t_orders_getshoes.orderid = t_orders.id left join t_cities on t_orders.cityid = t_cities.id left join t_districts on t_orders.districtid = t_districts.id left join t_zones on t_orders.zoneid = t_zones.id where t_orders.id = ? and t_orders.status = 4',[orderid],function(err,result){
                if (err){
                    console.error('查询送鞋订单错误',err);
                    return res.json({success:false,message:'系统错误，请重试'});
                }
                if (result.length == 0){
                    return res.json({success:false,message:'鞋子尚未清洗完或无效的订单'});
                }
                return res.json({success:true,data:result[0]});
            });
        });
    });
});

router.post('/get.json',function(req,res){
    var orderid = req.body.orderid;
    if (!orderid){
        return res.json({success:false,message:'无效的订单'});
    }
    var username = req.body.username;
    //查询条件，已经洗完了的，没有被其他同事承接的
    db.query('select totals from t_orders_package where orderid = ? and status = 2',[orderid],function(err,result){
        if (err){
            console.error('查询可送鞋订单错误',err);
            return res.json({success:false,message:'系统错误'});
        }
        if (result.length == 0){
            return res.json({success:false,message:'鞋子尚未清洗完或无效的订单'});
        }
        var record = result[0];
        if (result.length != record.totals){
            return res.json({success:false,message:'鞋子尚未全部清洗完出厂'});
        }
        //再查询是不是有其他同事接单
        db.query('select username from t_orders_returnshoes where orderid = ? and finished = 0 and canceled = 0',[orderid],function(err,result){
            if (err){
                console.error('查询可送鞋订单错误',err);
                return res.json({success:false,message:'系统错误'});
            }
            if (result.length > 0){
                var record = result[0];
                if (record.username == username){
                    return res.json({success:false,message:'该订单的送鞋工单已接单了'});
                } else {
                    return res.json({success:false,message:'该订单的送鞋工单已由其他同事接单'});
                }
            }
            db.query('select showname,mobile from t_staffs where username = ?',[username],function(err,result){
                if (err){
                    console.error('查询人员信息错误', err);
                    return res.json({success: false, message: '系统错误'});
                }
                if (result.length == 0){
                    return res.json({success: false, message: '系统错误'});
                }
                var showname = result[0].showname;
                var mobile = result[0].mobile;
                //开始接送鞋工单事务
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
                            function(update_ticket){
                                connection.query('insert into t_orders_returnshoes (orderid,dispatchtime,username,canceled,finished) values (?,now(),?,0,0)',[orderid,username],function(err){
                                    update_ticket(err);
                                });
                            },
                            function(insert_progress){
                                connection.query('insert into t_orders_progress (orderid,updatetime,content) values (?,now(),?)',[orderid,'已分配' + showname + '(' + mobile + ')送回您交洗的鞋子'],function(err){
                                    insert_progress(err);
                                });
                            }
                        ],function(err){
                            if (err) {
                                console.warn('在数据库生成送鞋工单时出错回滚',err);
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
            });
        });
    });
});

router.post('/index.json',function(req,res){
    var dispatchtime = req.body.dispatchtime;
    if (!dispatchtime){
        dispatchtime = 0;
    }
    if (dispatchtime == 0){
        db.query('select UNIX_TIMESTAMP(t_orders.ordertime) ordertime,t_orders.cityid cityid,t_orders.districtid districtid,t_orders.zoneid zoneid,UNIX_TIMESTAMP(t_orders_returnshoes.dispatchtime) dispatchtime,t_cities.city city,t_districts.district district,t_zones.zone zone,t_orders.contact contactname,t_orders.mobile contactmobile,t_orders.address address,t_orders_returnshoes.id id,t_orders.id orderid,t_orders.quality quality,UNIX_TIMESTAMP(t_orders.doortime) doortime,UNIX_TIMESTAMP(t_orders_getshoes.finishtime) gettime from t_orders_returnshoes left join t_orders on t_orders_returnshoes.orderid = t_orders.id left join t_cities on t_orders.cityid = t_cities.id left join t_districts on t_orders.districtid = t_districts.id left join t_zones on t_orders.zoneid = t_zones.id left join t_orders_getshoes on t_orders_returnshoes.orderid = t_orders_getshoes.orderid where t_orders_returnshoes.username = ? and t_orders_returnshoes.finished = 0 and t_orders_returnshoes.canceled = 0 and t_orders_returnshoes.dispatchtime > FROM_UNIXTIME(?)',[req.body.username,dispatchtime],function(err,result){
            if (err){
                console.error('查询待送鞋工单失败',err);
                return res.json({success:false,message:'系统错误，请重试'});
            }
            return res.json({success:true,data:{
                added:result,
                canceled:[]
            }});
        });
    } else {
        db.query('select UNIX_TIMESTAMP(t_orders.ordertime) ordertime,t_orders.cityid cityid,t_orders.districtid districtid,t_orders.zoneid zoneid,t_orders_returnshoes.canceled canceled,UNIX_TIMESTAMP(t_orders_returnshoes.dispatchtime) dispatchtime,t_cities.city city,t_districts.district district,t_zones.zone zone,t_orders.contact contactname,t_orders.mobile contactmobile,t_orders.address address,t_orders_returnshoes.id id,t_orders.id orderid,t_orders.quality quality,UNIX_TIMESTAMP(t_orders.doortime) doortime,UNIX_TIMESTAMP(t_orders_getshoes.finishtime) gettime from t_orders_returnshoes left join t_orders on t_orders_returnshoes.orderid = t_orders.id left join t_cities on t_orders.cityid = t_cities.id left join t_districts on t_orders.districtid = t_districts.id left join t_zones on t_orders.zoneid = t_zones.id left join t_orders_getshoes on t_orders_getshoes.orderid = t_orders_returnshoes.orderid where t_orders_returnshoes.username = ? and t_orders_returnshoes.finished = 0 and t_orders_returnshoes.dispatchtime > FROM_UNIXTIME(?)',[req.body.username,dispatchtime],function(err,result){
            if (err){
                console.error('查询待送鞋工单失败',err);
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

router.post('/cancel.json',function(req,res){
    var ticketid = req.body.ticketid;
    if (!ticketid){
        return res.json({success:false,message:'无效的送鞋工单'});
    }
    var username = req.body.username;
    db.query('select orderid,username,canceled,finished from t_orders_returnshoes where id = ?',[ticketid],function(err,result){
        if (err){
            console.error('查询送鞋工单错误',err);
            return res.json({success:false,message:'系统错误'});
        }
        if (result.length == 0){
            return res.json({success:false,message:'无效的送鞋工单'});
        }
        var ticket = result[0];
        if (ticket.username != username){
            return res.json({success:false,message:'无效的送鞋工单'});
        }
        if (ticket.canceled == 1 || ticket.finished == 1){
            return res.json({success:false,message:'无效的送鞋工单'});
        }
        db.query('update t_orders_returnshoes set dispatchtime = now(),canceled = 1,canceltime = now() where id = ?',[ticketid],function(err){
            if (err){
                console.error('修改送鞋工单状态失败',err);
                return res.json({success:false,message:'系统错误'});
            }
            return res.json({success:true,data:true});
        });
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
        return res.json({success:false,message:'无效的送鞋工单'});
    }
    db.query('insert into t_orders_call (orderid,ticketid,calltype,calltime) values (?,?,1,now())',[orderid,ticketid],function(err){
        if (err){
            console.error('插入物流送鞋电话记录失败',err);
        }
        return res.json({success:true,data:mobile});
    });
});

router.post('/return.json',function(req,res){
    var ticketid = req.body.ticketid;
    if (!ticketid){
        return res.json({success:false,message:'无效的送鞋工单'});
    }
    var username = req.body.username;
    db.query('select t_orders.quality quality,t_orders.ordertime ordertime,t_orders.cityid cityid,t_users.id userid,t_users.wechatactive wechatactive,t_users.wechatid wechatid,t_users.mobile usermobile,t_orders_returnshoes.orderid orderid,t_orders_returnshoes.username username,t_orders_returnshoes.canceled canceled,t_orders_returnshoes.finished finished,t_staffs.showname showname,t_staffs.mobile mobile from t_orders_returnshoes left join t_staffs on t_orders_returnshoes.username = t_staffs.username left join t_orders on t_orders_returnshoes.orderid = t_orders.id left join t_users on t_orders.userid = t_users.id where t_orders_returnshoes.id = ?',[ticketid],function(err,result){
        if (err){
            console.error('查询送鞋工单错误',err);
            return res.json({success:false,message:'系统错误'});
        }
        if (result.length == 0){
            return res.json({success:false,message:'无效的送鞋工单'});
        }
        var ticket = result[0];
        if (ticket.username != username){
            return res.json({success:false,message:'无效的送鞋工单'});
        }
        if (ticket.canceled == 1 || ticket.finished == 1){
            console.warn('网络状态不好，重复点击，TICKETID ＝ ' + ticketid);
            return res.json({success:true,data:true});
        }
        var orderid = ticket.orderid;
        var showname = ticket.showname;
        var mobile = ticket.mobile;
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
                        connection.query('update t_orders_returnshoes set finished = 1, finishtime = now() where id = ?',[ticketid],function(err){
                            update_ticket(err);
                        });
                    },
                    function(insert_progress){
                        connection.query('insert into t_orders_progress (orderid,updatetime,content) values (?,now(),?)',[orderid,showname + '(' + mobile + ')已送回您交洗的鞋子，订单已完成'],function(err){
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
                        //发送微信模版消息给用户，提示订单完成
                        notify_returnshoesuser.start(ticket.wechatid,ticket.wechatactive,ticket.usermobile,ticket.cityid,orderid,ticket.ordertime,ticket.quality,showname,mobile,ticket.userid);
                        commissionagentdao.startcommission(orderid);
                        return res.json({success:true,data:true});
                    });
                });
            });
        });
    });
});

module.exports = router;