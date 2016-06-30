var debug = true
var os = require('os');

var moment = require('moment');
var async = require('async');
var db = require('../db');

var notify_expirecouponuser = require('../notify/expirecouponuser');
var exec = function(){
    async.waterfall([
        function(select_coupon){
            db.query('select t_users_coupon.notified,t_users_coupon.id usercouponid,t_users_coupon.userid,t_coupons.expiredate,t_users_coupon.gettime,t_coupons.cardname from t_users_coupon left join t_coupons on t_users_coupon.couponid = t_coupons.id where t_users_coupon.status = 0 and date(t_users_coupon.updatetime) <> date(now()) order by gettime limit 20',function(err,result){
                if (err){
                    console.error('在数据库查询未通知的有效中代金券错误',err);
                    return select_coupon(err);
                }
                if (result.length == 0){
                    return select_coupon('无需处理');
                }
                return select_coupon(null,result);
            });
        },
        function(coupons,update_time){
            async.forEachLimit(coupons,2,function(item,callback){
                db.query('update t_users_coupon set updatetime = now() where id = ?',item.usercouponid,function(err){
                    if (err){
                        console.error('更新数据库中优惠券处理日期错误',err);
                    }
                    return callback(null);
                });
            },function(){
                return update_time(null,coupons);
            });
        },
        function(coupons,dispatch_coupon){
            var now = moment();
            var expires = [];
            var notifies = [];
            for (var i = 0;i < coupons.length;i++){
                var expiretime = moment(coupons[i].gettime).add(coupons[i].expiredate, 'days');
                if (expiretime.isBefore(now)){
                    expires.push(coupons[i].usercouponid);
                } else {
                    if (coupons[i].notified == 0){
                        var notifytime = expiretime.subtract(3,'days');
                        if (notifytime.isSame(now,'day')){
                            notifies.push({
                                usercouponid:coupons[i].usercouponid,
                                userid:coupons[i].userid,
                                cardname:coupons[i].cardname
                            });
                        }
                    }
                }
            }
            return dispatch_coupon(null,{
                expires:expires,
                notifies:notifies
            })
        },
        function(coupons,deal_expire){
            async.forEachLimit(coupons.expires,2,function(item,callback){
                db.query('update t_users_coupon set status = 4,updatetime = now() where id = ?',item,function(err){
                    if (err){
                        console.error('更新数据库中优惠券超期状态错误',err);
                    }
                    return callback(null);
                });
            },function(){
                return deal_expire(null,{
                    expirenum:coupons.expires.length,
                    notifies:coupons.notifies
                });
            });
        },
        function(coupons,deal_notifiy){
            async.forEachLimit(coupons.notifies,2,function(item,callback){
                notify_expirecouponuser.start(item.userid,item.cardname);
                db.query('update t_users_coupon set notified = 1 where id = ?',[item.usercouponid],function(err){
                    if (err){
                        console.error('更新数据库中优惠券已通知状态错误',err);
                    }
                    return callback(null);
                });
            },function(){
                return deal_notifiy(null,{
                    expirenum:coupons.expirenum,
                    notifynum:coupons.notifies.length
                });
            });
        }
    ],function(err,result){
        if (err){
            return;
        }
        if (result.expirenum > 0){
            console.info('处理优惠券设置已超期' + result.expirenum + '张');
        }
        if (result.notifynum > 0){
            console.info('处理优惠券通知用户快过期' + result.notifynum + '张');
        }
    });
};

var checktime = function(){
    var hour = moment().hour();
    if (hour > 15 && hour < 21){
        exec();
    }
    setTimeout(checktime,5*60*1000);
};

var schedule = function(){
    console.log('过期优惠券提醒功能启动');
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
