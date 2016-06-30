var express = require('express');
var db = require('../../services/db');
var async = require('async');
var dataquery = require('../../services/web/dataquery');
var rbaccore = require('../../services/rbac/core');
var dispatchcoupon = require('../../services/coupon/dispatch');
var router = express.Router();

router.get('/',function(req,res){
    if (!rbaccore.haspermission('operation_couponsend',req,res)){
        return;
    }
    db.query('select * from t_coupons where cardtype = 0 and status = 1 order by id desc',function(err,result){
        if (err){
            console.error('在数据库获取所有优惠券类型异常',err);
        }
        return res.render('operation/couponsend/index',{
            coupons:result,
            info:req.query.info,
            error:req.query.error
        });
    });
});

router.post('/',function(req,res){
    if (!rbaccore.haspermission('operation_couponsend',req,res)){
        return;
    }
    var userids = req.body.userids;
    if (!userids){
        return res.redirect('/operation/couponsend/?error=无效的用户列表');
    }
    var couponid = req.body.couponid;
    if (!couponid){
        return res.redirect('/operation/couponsend/?error=无效的优惠券');
    }
    var remark = req.body.remark;
    if (!remark){
        return res.redirect('/operation/couponsend/?error=无效的赠送留言');
    }
    var useridarray = userids.split('\n');
    if (useridarray.length == 0){
        return res.redirect('/operation/couponsend/?error=无效的用户列表');
    }
    if (useridarray.length > 300){
        return res.redirect('/operation/couponsend/?error=每次最多批量发送300用户');
    }
    async.forEachLimit(useridarray, 3, function(item, callback) {
        dispatchcoupon.dispatchcoupon(item,couponid,remark,function(err){
            callback(err);
        });
    }, function(err) {
        if (err){
            return res.redirect('/operation/couponsend/?error=' + err);
        } else {
            return res.redirect('/operation/couponsend/?info=已成功对' + useridarray.length + '位用户发放优惠券');
        }
    });
});

module.exports = router;