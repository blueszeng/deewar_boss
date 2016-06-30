var express = require('express');
var db = require('../../services/db');
var cache = require('../../services/cache');
var async = require('async');
var dataquery = require('../../services/web/dataquery');
var rbaccore = require('../../services/rbac/core');
var router = express.Router();

router.get('/',function(req,res){
    if (!rbaccore.haspermission('user_coupon',req,res)){
        return;
    }
    return res.render('user/coupon/index',{
        info:req.query.info,
        error:req.query.error
    });
});

router.post('/list.html',function(req,res){
    if (!rbaccore.haspermission('user_coupon',req,res)){
        return;
    }
    var tabledefinition = {
        sSelectSql:'t_users_coupon.gettime gettime,t_coupons.cardname cardname,t_coupons.amount amount,t_coupons.expiredate expiredate,t_users_coupon.status cstatus,t_users_coupon.channelid channelid,t_users_coupon.binded binded,t_users_profile.userid userid,t_users_profile.nickname nickname,t_users_coupon.id cid',
        sFromSql:'t_users_coupon left join t_coupons on t_users_coupon.couponid = t_coupons.id left join t_users_profile on t_users_coupon.userid = t_users_profile.userid',
        sCountColumnName:'t_users_coupon.id',
        aoColumnDefs: [
            { mData: 'gettime', bSearchable: false },
            { mData: 'cardname', bSearchable: false },
            { mData: 'amount', bSearchable: false },
            { mData: 'expiredate', bSearchable: false },
            { mData: 'cstatus', bSearchable: false },
            { mData: 'channelid', bSearchable: true},
            { mData: 'binded', bSearchable: true},
            { mData: 'nickname', bSearchable: false},
            { mData: null, bSearchable: false},
            { mData: 'userid', bSearchable: false},
            { mData: 'cid', bSearchable: false}
        ]};
    return dataquery.pagedata(tabledefinition,req,res);
});

module.exports = router;