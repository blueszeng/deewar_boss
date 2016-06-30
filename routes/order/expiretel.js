var express = require('express');
var db = require('../../services/db');
var rbaccore = require('../../services/rbac/core');
var dataquery = require('../../services/web/dataquery');
var router = express.Router();

router.get('/',function(req,res){
    if (!rbaccore.haspermission('order_expiretel',req,res)){
        return;
    }
    return res.render('order/expiretel/index',{
        info:req.query.info,
        error:req.query.error
    });
});


router.post('/list.html',function(req,res){
    if (!rbaccore.haspermission('order_expiretel',req,res)){
        return;
    }
    var tabledefinition = {
        sSelectSql:'t_orders.contact usernickname,t_orders.mobile usermobile,t_orders.id orderid,t_orders.doortime,calls.calltime,t_staffs.username staffusername,t_staffs.showname staffshowname,t_orders.address',
        sFromSql:'t_orders_getshoes left join (select ticketid,min(calltime) calltime from t_orders_call where calltype = 0 group by ticketid) calls on t_orders_getshoes.id = calls.ticketid left join t_orders on t_orders_getshoes.orderid = t_orders.id left join t_staffs on t_orders_getshoes.username = t_staffs.username where t_orders_getshoes.canceled = 0 and (t_orders.doortime < calls.calltime or calls.calltime is null) and t_orders.id > 1374 and t_orders.doortime < now() and t_orders_getshoes.finishtime > t_orders.doortime',
        sCountColumnName:'t_orders.id',
        aoColumnDefs: [
            { mData: 'orderid', bSearchable: false },
            { mData: 'usernickname',bSearchable:false},
            { mData: 'usermobile', bSearchable: false},
            { mData: 'address', bSearchable: false },
            { mData: 'doortime', bSearchable: false},
            { mData: 'calltime', bSearchable: false},
            { mData: 'staffusername', bSearchable: false},
            { mData: 'staffshowname', bSearchable: false},
            { mData: null, bSearchable: false},
            { mData: 't_orders.id', bSearchable: true },
            { mData: 't_staffs.username', bSearchable: true }
        ]};
    return dataquery.pagedata(tabledefinition,req,res);
});

module.exports = router;