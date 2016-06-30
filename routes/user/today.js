var express = require('express');
var db = require('../../services/db');
var rbaccore = require('../../services/rbac/core');
var dataquery = require('../../services/web/dataquery');
var router = express.Router();

router.get('/',function(req,res){
    if (!rbaccore.haspermission('user_today',req,res)){
        return;
    }
    return res.render('user/today/index');
});

router.post('/list.html',function(req,res){
    if (!rbaccore.haspermission('user_today',req,res)){
        return;
    }
    var tabledefinition = {
        sSelectSql:'t_users_profile.nickname nickname,t_users.id id,t_users.updatetime updatetime,t_users.createtime createtime,t_users.wechatactive wechatactive,t_users_profile.avatar avatar,t_users_profile.sex sex,t_users.mobile mobile',
        sFromSql:'(select * from t_users where to_days(t_users.createtime) = to_days(now())) t_users left join t_users_profile on t_users.id = t_users_profile.userid',
        sCountColumnName:'t_users.id',
        aoColumnDefs: [
            { mData: 'avatar', bSearchable: false },
            { mData: 'nickname',bSearchable:false},
            { mData: 'sex', bSearchable: false},
            { mData: 'mobile', bSearchable: false },
            { mData: 'createtime', bSearchable: false},
            { mData: 'wechatactive', bSearchable: false},
            { mData: 'updatetime', bSearchable: false},
            { mData: null, bSearchable: false},
            { mData: 'id', bSearchable: false}
        ]};
    return dataquery.pagedata(tabledefinition,req,res);
});

module.exports = router;