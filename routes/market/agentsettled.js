var express = require('express');
var db = require('../../services/db');
var async = require('async');
var dataquery = require('../../services/web/dataquery');
var rbaccore = require('../../services/rbac/core');
var router = express.Router();

router.get('/',function(req,res){
    if (!rbaccore.haspermission('market_agentsettled',req,res)){
        return;
    }
    return res.render('market/agentsettled/index');
});

router.post('/list.html',function(req,res){
    if (!rbaccore.haspermission('market_agentsettled',req,res)){
        return;
    }
    var staff = req.session.staff;
    var tabledefinition = {
        sSelectSql:'orders.orderid,t_zones.zone,t_orders.address,orders.villagekey,orders.commission,orders.commissiontime,orders.settledtime,orders.settleid',
        sFromSql:'(select t_agents_order.orderid,t_agents_order.commission,t_agents_order.commissiontime,t_agents_order.settledtime,t_agents_order.settleid,t_agents_order.villagekey from t_agents_order left join t_agents_village on t_agents_order.villageid = t_agents_village.id where t_agents_village.username = \'' + staff.username + '\' and t_agents_order.settled = 1) orders left join t_orders on orders.orderid = t_orders.id left join t_zones on t_orders.zoneid = t_zones.id',
        sCountColumnName:'agents.username',
        aoColumnDefs: [
            { mData: 'orderid', bSearchable: false },
            { mData: 'zone', bSearchable: false },
            { mData: 'address', bSearchable: false },
            { mData: 'villagekey', bSearchable: false },
            { mData: 'commission', bSearchable: false},
            { mData: 'commissiontime', bSearchable: false},
            { mData: 'settleid', bSearchable: false},
            { mData: 'settledtime', bSearchable: false}
        ]};
    return dataquery.pagedata(tabledefinition,req,res);
});


module.exports = router;