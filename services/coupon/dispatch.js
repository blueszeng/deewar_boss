var debug = true;
var db = require('../db');
var async = require('async');
var seedutils = require('../../utils/seed');
var notify_dispatchcouponuser = require('../notify/dispatchcouponuser');

exports.dispatchcoupon = function(userid,couponid,remark,callback){
    db.query('select wechatid,wechatactive from t_users where id = ?',[userid],function(err,result){
        if (err){
            console.error('在数据库根据用户ID查用户信息错误',err);
            return callback(null);
        }
        if (result.length == 0){
            return callback(null);
        }
        var user = result[0];
        async.waterfall([
            function(getcode){
                seedutils.getseedcode12(function(code){
                    getcode(null,code);
                })
            },
            function(code,insertcoupon){
                db.query('insert into t_users_coupon (userid,couponid,status,updatetime,gettime,couponcode,channelid,binded) values (?,?,0,now(),now(),?,999,0)',[userid,couponid,code],function(err){
                    insertcoupon(err);
                });
            },
            function(sendmessage){
                notify_dispatchcouponuser.start(user.wechatid,user.wechatactive,couponid,remark);
                return sendmessage(null);
            }
        ],function(err){
            callback(err);
        });
    });
};