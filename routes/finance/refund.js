var express = require('express');
var async = require('async');
var db = require('../../services/db');
var dataquery = require('../../services/web/dataquery');
var rbaccore = require('../../services/rbac/core');
var router = express.Router();

router.get('/',function(req,res){
    if (!rbaccore.haspermission('finance_refund',req,res)){
        return;
    }
    return res.render('finance/refund/index',{
        info:req.query.info,
        error:req.query.error
    });
});

router.post('/list.html',function(req,res){
    if (!rbaccore.haspermission('finance_refund',req,res)){
        return;
    }
    var tabledefinition = {
        sSelectSql:'id,createtime,transid,tradetype,amount',
        sFromSql:'(select id,createtime,transid,tradetype,amount from t_finance_refund where isrefund = 0) refunds',
        sCountColumnName:'refunds.id',
        aoColumnDefs: [
            { mData: 'id', bSearchable: true },
            { mData: 'createtime', bSearchable: false },
            { mData: 'tradetype', bSearchable: true },
            { mData: 'amount', bSearchable: false },
            { mData: 'transid', bSearchable: true },
            { mData: null, bSearchable: false}
        ]};
    return dataquery.pagedata(tabledefinition,req,res);
});

router.get('/deal.html',function(req,res){
    if (!rbaccore.haspermission('finance_refund_deal',req,res)){
        return;
    }
    var id = req.query.id;
    if (!id){
        return res.redirect('/finance/refund/?error=无效的退费单');
    }
    db.query('select * from t_finance_refund where id = ?',[id],function(err,result){
        if (err){
            console.error('在数据库中查询退费单信息异常',err);
            return res.redirect('/finance/refund/?error=无效的退费单');
        }
        if (result.length == 0){
            return res.redirect('/finance/refund/?error=无效的退费单');
        }
        return res.render('finance/refund/deal',{
            refund:result[0]
        });
    });
});

router.post('/deal.html',function(req,res){
    if (!rbaccore.haspermission('finance_refund_deal',req,res)){
        return;
    }
    var id = req.body.id;
    if (!id){
        return res.redirect('/finance/refund/?error=无效的退费单');
    }
    db.query('update t_finance_refund set isrefund = 1,refundtime = now() where id = ?',[id],function(err){
        if (err){
            console.error('在数据库更新退费处理结果异常',err);
            return res.redirect('/finance/refund/?error=系统异常');
        }
        return res.redirect('/finance/refund/?info=退费处理成功');
    });
});

module.exports = router;