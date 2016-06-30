var express = require('express');
var async = require('async');
var db = require('../../services/db');
var dataquery = require('../../services/web/dataquery');
var rbaccore = require('../../services/rbac/core');
var router = express.Router();

router.get('/',function(req,res){
    if (!rbaccore.haspermission('finance_refunded',req,res)){
        return;
    }
    return res.render('finance/refunded/index');
});

router.post('/list.html',function(req,res){
    if (!rbaccore.haspermission('finance_refunded',req,res)){
        return;
    }
    var tabledefinition = {
        sSelectSql:'id,createtime,transid,tradetype,amount,refundtime',
        sFromSql:'(select id,createtime,transid,tradetype,amount,refundtime from t_finance_refund where isrefund = 1) refunds',
        sCountColumnName:'refunds.id',
        aoColumnDefs: [
            { mData: 'id', bSearchable: true },
            { mData: 'createtime', bSearchable: false },
            { mData: 'tradetype', bSearchable: true },
            { mData: 'amount', bSearchable: false },
            { mData: 'transid', bSearchable: true },
            { mData: 'refundtime', bSearchable: false },
            { mData: null, bSearchable: false}
        ]};
    return dataquery.pagedata(tabledefinition,req,res);
});

module.exports = router;