var express = require('express');
var db = require('../../services/db');
var async = require('async');
var dataquery = require('../../services/web/dataquery');
var rbaccore = require('../../services/rbac/core');
var router = express.Router();

router.get('/',function(req,res){
    if (!rbaccore.haspermission('custom_taobaoaddr',req,res)){
        return;
    }
    return res.render('custom/taobaoaddr/index',{
        info:req.query.info,
        error:req.query.error
    });
});

router.post('/list.html',function(req,res){
    if (!rbaccore.haspermission('custom_taobaoaddr',req,res)){
        return;
    }
    var tabledefinition = {
        sSelectSql:'t_orders_taobao.*',
        sFromSql:'(select * from t_orders_taobao where status = 0) t_orders_taobao',
        sCountColumnName:'taobaoorderid',
        aoColumnDefs: [
            { mData: 'taobaoorderid', bSearchable: true },
            { mData: 'ordertime', bSearchable: false },
            { mData: 'quality', bSearchable: false },
            { mData: 'doortime', bSearchable: false },
            { mData: 'address', bSearchable: false },
            { mData: 'contact', bSearchable: false },
            { mData: 'mobile', bSearchable: false },
            { mData: null, bSearchable: false}
        ]};
    return dataquery.pagedata(tabledefinition,req,res);
});

router.get('/reject.html',function(req,res){
    if (!rbaccore.haspermission('custom_taobaoaddr',req,res)){
        return;
    }
    var taobaoorderid = req.query.taobaoorderid;
    if (!taobaoorderid){
        return res.redirect('/custom/taobaoaddr/?error=无法拒绝接单');
    }
    db.query('update t_orders_taobao set status = 2,dealtime = now() where taobaoorderid = ?',[taobaoorderid],function(err){
        if (err){
            console.error('在数据库中更新淘宝临时订单错误',err,taobaoorderid);
            return res.redirect('/custom/taobaoaddr/?error=无法拒绝接单');
        } else {
            return res.redirect('/custom/taobaoaddr/?info=拒绝接单成功');
        }
    });
});

router.get('/accept.html',function(req,res){
    if (!rbaccore.haspermission('custom_taobaoaddr',req,res)){
        return;
    }
    var taobaoorderid = req.query.taobaoorderid;
    if (!taobaoorderid){
        return res.redirect('/custom/taobaoaddr/?error=无效的淘宝订单');
    }
    db.query('select * from t_orders_taobao where taobaoorderid = ?',[taobaoorderid],function(err,result){
        if (err){
            console.error('在数据库中查询淘宝临时订单异常',err);
            return res.redirect('/custom/taobaoaddr/?error=无效的淘宝临时订单');
        }
        if (result.length == 0){
            return res.redirect('/custom/taobaoaddr/?error=无效的淘宝临时订单');
        }
        var taobaoorder = result[0];
        db.query('select id,city from t_cities where opened = 1',function(err,result){
            if (err){
                console.error('在数据库获取所有开放运营的城市失败',err);
            }
            return res.render('custom/taobaoaddr/accept',{
                taobaoorder:taobaoorder,
                cities:result
            });
        });
    });
});

router.post('/accept.html',function(req,res){
    if (!rbaccore.haspermission('custom_taobaoaddr',req,res)){
        return;
    }
    var taobaoorderid = req.body.taobaoorderid;
    if (!taobaoorderid){
        return res.redirect('/custom/taobaoaddr/?error=无效的淘宝临时订单');
    }
    var cityid = req.body.cityid;
    if (!cityid){
        return res.redirect('/custom/taobaoaddr/?error=无效的服务城市');
    }
    var zoneid = req.body.zoneid;
    if (!zoneid){
        return res.redirect('/custom/taobaoaddr/?error=无效的服务街道');
    }
    db.query('update t_orders_taobao set status = 1,cityid=?,zoneid=?,dealtime=now() where taobaoorderid=?',[cityid,zoneid,taobaoorderid],function(err){
        if (err){
            console.error('在数据库中更新淘宝临时订单错误',err);
            return res.redirect('/custom/taobaoaddr/?error=处理淘宝临时订单异常');
        } else {
            return res.redirect('/custom/taobaoaddr/?info=淘宝临时订单地址匹配成功');
        }
    });
});


module.exports = router;