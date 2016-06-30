var express = require('express');
var db = require('../../services/db');
var rbaccore = require('../../services/rbac/core');
var dataquery = require('../../services/web/dataquery');
var router = express.Router();

router.get('/',function(req,res){
    if (!rbaccore.haspermission('order_expireout',req,res)){
        return;
    }
    return res.render('order/expireout/index',{
        info:req.query.info,
        error:req.query.error
    });
});

router.post('/list.html',function(req,res){
    if (!rbaccore.haspermission('order_expireout',req,res)){
        return;
    }
    var tabledefinition = {
        sSelectSql:'t_orders.id id,t_orders.ordertime ordertime,t_orders.status status,t_orders.quality quality,t_orders.price price,t_orders.doortime,t_cities.city city,t_orders.address address,t_orders.couponmoney couponmoney,t_orders.balanceuse balanceuse,t_districts.district district,t_zones.zone zone',
        sFromSql:'(select * from t_orders where status > 1 and status < 10 and TIMESTAMPDIFF(hour,doortime,now()) > 72) t_orders left join t_cities on t_orders.cityid = t_cities.id left join t_districts on t_orders.districtid = t_districts.id left join t_zones on t_orders.zoneid = t_zones.id',
        sCountColumnName:'t_orders.id',
        aoColumnDefs: [
            { mData: 'id', bSearchable: false },
            { mData: 'ordertime',bSearchable:false},
            { mData: 'status', bSearchable: true},
            { mData: 'quality', bSearchable: false },
            { mData: 'price', bSearchable: false},
            { mData: 'doortime', bSearchable: false},
            { mData: 'city', bSearchable: false},
            { mData: 'address', bSearchable: false},
            { mData: null, bSearchable: false},
            { mData: 'couponmoney', bSearchable: false},
            { mData: 'balanceuse', bSearchable: false},
            { mData: 'district', bSearchable: false},
            { mData: 'zone', bSearchable: false},
            { mData: 't_orders.id', bSearchable: true }
        ]};
    return dataquery.pagedata(tabledefinition,req,res);
});

module.exports = router;