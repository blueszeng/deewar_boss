/**
 * Created by jimmychou on 15/1/18.
 */
var db = require('../db');
var notify_dispatchstaff = require('../notify/dispatchstaff');
var notify_dispatchuser = require('../notify/dispatchuser');
var async = require('async');

var dispatcherror = function(orderid,progress,reason){
    db.query('insert into t_orders_fail (orderid,updatetime,dealed,reason,progress) values (?,now(),0,?,?)',[orderid,reason,progress],function(err){
        console.error('写入订单失败纪录错误',err);
    });
};

exports.start = function(orderid){
    db.query('insert into t_orders_progress (orderid,updatetime,content) values (?,now(),?)',[orderid,'订单已确定，开始安排取鞋人员'],function(err){
        if (err){
            console.error('写入订单进度到数据库出错',err);
        }
        db.query('SELECT t_sites_staff.username username,t_staffs.showname showname,t_staffs.mobile mobile,t_orders.doortime doortime,t_orders.address address ' +
        'FROM t_sites_staff LEFT OUTER JOIN t_sites ON t_sites_staff.siteid = t_sites.id ' +
        'LEFT OUTER JOIN t_sites_zone ON t_sites.id = t_sites_zone.siteid ' +
        'LEFT OUTER JOIN t_orders ON t_orders.zoneid = t_sites_zone.zoneid ' +
        'left outer join t_staffs on t_sites_staff.username = t_staffs.username where t_orders.id = ?',[orderid],function(err,result){
            if (err){
                console.error('查询订单对应的取鞋人员出错',err);
                return dispatcherror(orderid,1,'查询订单的取鞋人员系统错误');
            }
            if (result.length == 0){
                return dispatcherror(orderid,1,'订单没有对应的取鞋人员');
            }
            //随机使用一个取鞋人员
            var index = Math.floor(Math.random()*result.length);
            var username = result[index].username;
            var showname = result[index].showname;
            var mobile = result[index].mobile;
            var doortime = result[index].doortime;
            var address = result[index].address;
            //开始事务处理写入 待取鞋订单以及订单进度
            db.getConnection(function(err,connection){
                if (err){
                    console.error('从数据库连接池获取连接失败',err);
                    return dispatcherror(orderid,1,'写入订单对应的取鞋工单系统错误');
                }
                return connection.beginTransaction(function(err) {
                    if (err) {
                        connection.release();
                        return dispatcherror(orderid,1,'写入订单对应的取鞋工单系统错误');
                    }
                    async.series([
                        function (insert_tickets){
                            connection.query('insert into t_orders_getshoes (orderid,username,canceled,finished,dispatchtime) values (?,?,0,0,now())',[orderid,username],function(err){
                                insert_tickets(err);
                            });
                        },
                        function (insert_progress){
                            return connection.query('insert into t_orders_progress (orderid,updatetime,content) values (?,now(),?)',[orderid,'已安排' + showname + '(电话：<a href="tel:' + mobile + '">' + mobile + '</a>)上门取鞋'],function(err){
                                return insert_progress(err);
                            });
                        }
                    ],function(err){
                        if (err) {
                            console.error('写入订单对应对应的取鞋工单出错回滚',err);
                            return connection.rollback(function(){
                                connection.release();
                                return dispatcherror(orderid,1,'写入订单对应的取鞋工单系统错误');
                            });
                        }
                        return connection.commit(function(err){
                            if (err){
                                return connection.rollback(function(){
                                    connection.release();
                                    return dispatcherror(orderid,1,'写入订单对应的取鞋工单系统错误');
                                });
                            }
                            connection.release();
                            //开始通知取鞋人员
                            notify_dispatchstaff.start(username,doortime,address);
                            notify_dispatchuser.start(orderid,showname,mobile);
                        });
                    });
                });
            });
        });
    });
};