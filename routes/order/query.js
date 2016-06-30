var express = require('express');
var db = require('../../services/db');
var async = require('async');
var rbaccore = require('../../services/rbac/core');
var numberutils = require('../../utils/number');
var datetimeutils = require('../../utils/datetime');
var router = express.Router();

router.get('/',function(req,res){
    if (!rbaccore.haspermission('order_query',req,res)){
        return;
    }
    return res.render('order/query/index',{
        info:req.query.info,
        error:req.query.error
    });
});

router.post('/search.html',function(req,res){
    if (!rbaccore.haspermission('order_query',req,res)){
        return;
    }
    var key = req.body.key;
    if (!key){
        return res.render('order/query/index',{
            error:'无效的查询内容'
        });
    }
    var array;
    var sql = 'select id from t_orders where id = ? limit 1';
    if (key.length == 14){
        array = [Number(key.substring(4,10))];
    } else {
        array = [key];
    }
    db.query(sql,array,function(err,result){
        if (err){
            console.error('订单查询错误',err);
            return res.render('order/query/index',{
                error:'系统发生异常'
            });
        }
        if (result.length == 0){
            return res.render('order/query/index',{
                error:'没有查询到相关数据'
            });
        }
        return res.redirect('/order/query/info.html?backurl=' + encodeURIComponent('/order/query/') + '&orderid=' + result[0].id);
    });
});


router.get('/info.html',function(req,res){
    if (!rbaccore.haspermission(['custom_query','custom_nashui','user_list_detail','user_today_detail','user_coupon_detail','order_query'],req,res)){
        return;
    }
    var orderid = req.query.orderid;
    if (!orderid){
        return res.render('order/query/index',{
            error:'没有查询到相关数据'
        });
    }
    var backurl = req.query.backurl;
    if (!backurl){
        backurl = '/order/query/';
    }
    async.parallelLimit({
        order:function(callback){
            db.query('select t_orders.*,t_cities.city city,t_districts.district district,t_zones.zone zone from t_orders left join t_cities on t_orders.cityid = t_cities.id left join t_districts on t_orders.districtid = t_districts.id left join t_zones on t_orders.zoneid = t_zones.id where t_orders.id = ?',[orderid],function(err,result){
                if (err){
                    return callback(err);
                }
                result[0].orderno = numberutils.paddingLeft(String(result[0].cityid),4) + numberutils.paddingLeft(String(result[0].id),6) + numberutils.paddingLeft(String(result[0].ordertime.getSeconds() * result[0].ordertime.getMinutes()),4);
                if (Number(result[0].status) > 0){
                    result[0].onlinepay = result[0].price - result[0].balanceuse - result[0].couponmoney;
                } else {
                    result[0].onlinepay = 0;
                }
                return callback(null,result[0]);
            });
        },
        getshoes:function(callback){
            db.query('select * from t_orders_getshoes left join t_staffs on t_orders_getshoes.username = t_staffs.username where orderid = ? order by dispatchtime',[orderid],function(err,result){
                if (err || result.length == 0){
                    return callback(null,null);
                }
                return callback(null,result);
            });
        },
        packages:function(callback){
            db.query('select recvtime,intime,outtime,batchcode,labelcode,packagecode,totals,ordinal from t_orders_package where orderid = ? order by ordinal',[orderid],function(err,result){
                if (err || result.length == 0){
                    return callback(null,null);
                }
                return callback(null,result);
            });
        },
        returnshoes:function(callback){
            db.query('select * from t_orders_returnshoes left join t_staffs on t_orders_returnshoes.username = t_staffs.username where orderid = ? order by dispatchtime',[orderid],function(err,result){
                if (err || result.length == 0){
                    return callback(null,null);
                }
                return callback(null,result);
            });
        },
        shoes:function(callback){
            db.query('select * from t_orders_shoes where orderid = ? order by ordinal',[orderid],function(err,result){
                if (err || result.length == 0){
                    return callback(null,null);
                }
                return callback(null,result);
            });
        },
        getcalls:function(callback){
            db.query('select t_orders_call.calltime,t_staffs.showname,t_staffs.mobile from t_orders_call left join t_orders_getshoes on t_orders_call.ticketid = t_orders_getshoes.id left join t_staffs on t_orders_getshoes.username = t_staffs.username where t_orders_call.orderid = ? and t_orders_call.calltype = 0 order by t_orders_call.calltime',[orderid],function(err,result){
                if (err || result.length == 0){
                    return callback(null,null);
                }
                return callback(null,result);
            });
        },
        returncalls:function(callback){
            db.query('select t_orders_call.calltime,t_staffs.showname,t_staffs.mobile from t_orders_call left join t_orders_getshoes on t_orders_call.ticketid = t_orders_getshoes.id left join t_staffs on t_orders_getshoes.username = t_staffs.username where t_orders_call.orderid = ? and t_orders_call.calltype = 1 order by t_orders_call.calltime',[orderid],function(err,result){
                if (err || result.length == 0){
                    return callback(null,null);
                }
                return callback(null,result);
            });
        },
        cancel:function(callback){
            db.query('select * from t_orders_cancel where orderid = ?',[orderid],function(err,result){
                if (err || result.length == 0){
                    return callback(null,null);
                }
                return callback(null,result[0]);
            });
        }
    },3,function(err,result){
        if (err){
            console.error('订单数据查询异常',err);
            return res.render('order/query/index',{
                error:'系统异常，查询数据出错'
            });
        }
        var timeline = [];
        timeline.push({
            time:result.order.ordertime,
            color:'green',
            title:'下单',
            desc:result.order.contact + '(' + result.order.mobile + ')下单' + result.order.quality + '双，预约' + datetimeutils.formatdatetime(result.order.doortime) + '至' + result.order.address + '取鞋'
        });
        var order = result.order;
        if (order.status == 99){
            if (result.cancel){
                timeline.push({
                    time:result.cancel.canceltime,
                    color:'red',
                    title:'取消订单',
                    desc:'由' + result.cancel.canceler + '因' + result.cancel.reason
                });
            }
        } else if (order.status > 0){
            timeline.push({
                time:result.order.paytime,
                color:'purple',
                title:'用户付款',
                desc:'用户成功付款'
            });
            if (result.getshoes){
                for(var i = 0;i < result.getshoes.length;i++){
                    timeline.push({
                        time:result.getshoes[i].dispatchtime,
                        color:'blue',
                        title:'分配取鞋工单',
                        desc:'分配' + result.getshoes[i].showname + '(' + result.getshoes[i].mobile + ')取鞋'
                    });
                    if (result.getshoes[i].canceled == 1){
                        timeline.push({
                            time:result.getshoes[i].canceltime,
                            color:'yellow',
                            title:'取消取鞋工单',
                            desc:result.getshoes[i].showname + '(' + result.getshoes[i].mobile + ')取消取鞋工单'
                        });
                    } else  if (result.getshoes[i].finished == 1) {
                        timeline.push({
                            time:result.getshoes[i].finishtime,
                            color:'green',
                            title:'上门取鞋',
                            desc:result.getshoes[i].showname + '(' + result.getshoes[i].mobile + ')上门取鞋'
                        });
                    }
                }
            }
            if (result.packages){
                for (var j = 0;j < result.packages.length;j++){
                    timeline.push({
                        time:result.packages[j].recvtime,
                        color:'purple',
                        title:'取鞋扫码',
                        desc:'第' + result.packages[j].ordinal + '双条码' + result.packages[j].packagecode + '，共' + result.packages[j].totals + '双'
                    });
                }
                for (var k = 0;k < result.packages.length;k++){
                    if (result.packages[k].intime){
                        timeline.push({
                            time:result.packages[k].intime,
                            color:'green',
                            title:'入厂',
                            desc:'第' + result.packages[k].ordinal + '双鞋入厂，批次号：' + result.packages[k].batchcode + '，吊牌号：' + result.packages[k].labelcode
                        });
                    }
                }
                for (var z = 0;z < result.packages.length;z++){
                    if (result.packages[z].outtime){
                        timeline.push({
                            time:result.packages[z].outtime,
                            color:'green',
                            title:'出厂',
                            desc:'第' + result.packages[z].ordinal + '双鞋清洁护理完毕出厂'
                        });
                    }
                }
            }
            if (result.returnshoes){
                for(var l = 0;l < result.returnshoes.length;l++){
                    timeline.push({
                        time:result.returnshoes[l].dispatchtime,
                        color:'blue',
                        title:'获取取鞋工单',
                        desc:result.returnshoes[l].showname + '(' + result.returnshoes[l].mobile + ')主动获取送鞋工单'
                    });
                    if (result.returnshoes[l].canceled == 1){
                        timeline.push({
                            time:result.returnshoes[l].canceltime,
                            color:'yellow',
                            title:'取消送鞋工单',
                            desc:result.returnshoes[l].showname + '(' + result.returnshoes[l].mobile + ')取消送鞋工单'
                        });
                    } else  if (result.returnshoes[l].finished == 1) {
                        timeline.push({
                            time:result.returnshoes[l].finishtime,
                            color:'green',
                            title:'上门送鞋',
                            desc:result.returnshoes[l].showname + '(' + result.returnshoes[l].mobile + ')上门送鞋完毕'
                        });
                    }
                }
            }
        }
        var infactory = null;
        if (result.packages){
            infactory = [];
            for (var m = 0;m < result.packages.length;m++){
                if (result.packages[m].intime){
                    if (String(result.packages[m].labelcode).length === 4){
                        result.packages[m].truelabel = result.packages[m].labelcode;
                    } else {
                        result.packages[m].truelabel = numberutils.paddingLeft(result.packages[m].labelcode,4);
                    }
                    infactory.push(result.packages[m]);
                }
            }
        }
        var shoes = null;
        if (result.shoes){
            shoes = [];
            for (var n =0;n < result.shoes.length;n++){
                result.shoes[n].truelabel = numberutils.paddingLeft(result.shoes[n].labelcode,4);
                shoes.push(result.shoes[n]);
            }
        }
        return res.render('order/query/info',{
            backurl:backurl,
            orderid:orderid,
            order:order,
            timeline:timeline,
            getcalls:result.getcalls,
            returncalls:result.returncalls,
            infactory:infactory,
            shoes:shoes
        });
    });
});




module.exports = router;