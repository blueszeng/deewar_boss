/**
 * Created by jimmychou on 15/1/20.
 */
var express = require('express');
var db = require('../../services/db');
var async = require('async');
var router = express.Router();

router.post('/index.json',function(req,res){
    async.parallel({
        today:function(callback){
            db.query('select count(t_orders_getshoes.id) rows,ifnull(UNIX_TIMESTAMP(MIN(t_orders.doortime)),0) doortime from t_orders_getshoes left join t_orders on t_orders_getshoes.orderid = t_orders.id where t_orders_getshoes.username = ? and t_orders_getshoes.canceled = 0 and t_orders_getshoes.finished = 0 and t_orders.doortime between curdate() and date_add(curdate(),interval 1 day)',[req.body.username],function(err,result){
                callback(err,result);
            });
        },
        tomorrow:function(callback){
            db.query('select count(t_orders_getshoes.id) rows,ifnull(UNIX_TIMESTAMP(MIN(t_orders.doortime)),0) doortime from t_orders_getshoes left join t_orders on t_orders_getshoes.orderid = t_orders.id where t_orders_getshoes.username = ? and t_orders_getshoes.canceled = 0 and t_orders_getshoes.finished = 0 and t_orders.doortime between date_add(curdate(),interval 1 day) and date_add(curdate(),interval 2 day)',[req.body.username],function(err,result){
                callback(err,result);
            });
        },
        timeout:function(callback){
            db.query('select count(t_orders_getshoes.id) rows,ifnull(UNIX_TIMESTAMP(MIN(t_orders.doortime)),0) doortime from t_orders_getshoes left join t_orders on t_orders_getshoes.orderid = t_orders.id where t_orders_getshoes.username = ? and t_orders_getshoes.canceled = 0 and t_orders_getshoes.finished = 0 and t_orders.doortime <= curdate()',[req.body.username],function(err,result){
                callback(err,result);
            });
        },
        returns:function(callback){
            db.query('select count(t_orders_returnshoes.id) rows from t_orders_returnshoes where username = ? and finished = 0 and canceled = 0',[req.body.username],function(err,result){
                callback(err,result);
            });
        }
    },function(err,result){
        if (err){
            console.error('在数据库查询今日和明日的取鞋订单错误',err);
            return res.json({success:false,message:'系统错误，请重试'});
        }
        return res.json({
            success:true,
            data:[{
                type:0,
                lasttime:result.today[0].doortime,
                nums:result.today[0].rows
            },{
                type:1,
                lasttime:result.tomorrow[0].doortime,
                nums:result.tomorrow[0].rows
            },{
                type:2,
                lasttime:result.timeout[0].doortime,
                nums:result.timeout[0].rows
            },{
                type:3,
                lasttime:0,
                nums:result.returns[0].rows
            }]
        })
    });
});

module.exports = router;