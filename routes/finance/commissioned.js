var express = require('express');
var async = require('async');
var dataquery = require('../../services/web/dataquery');
var rbaccore = require('../../services/rbac/core');
var router = express.Router();

router.get('/',function(req,res){
    if (!rbaccore.haspermission('finance_commissioned',req,res)){
        return;
    }
    return res.render('finance/commissioned/index');
});

router.post('/list.html',function(req,res){
    if (!rbaccore.haspermission('finance_commissioned',req,res)){
        return;
    }
    var tabledefinition = {
        sSelectSql:'id,requesttime,agentname,commission,settletime,settleno,staffname,remark',
        sFromSql:'(select id,requesttime,agentname,commission,settletime,settleno,staffname,remark from t_finance_commission where settled = 1) commissions',
        sCountColumnName:'commissions.id',
        aoColumnDefs: [
            { mData: null, bSearchable: false},
            { mData: 'id', bSearchable: true },
            { mData: 'requesttime', bSearchable: false },
            { mData: 'agentname', bSearchable: true },
            { mData: 'commission', bSearchable: false },
            { mData: 'settletime', bSearchable: false },
            { mData: 'settleno', bSearchable: false },
            { mData: 'staffname', bSearchable: false },
            { mData: null, bSearchable: false},
            { mData: 'remark', bSearchable: false}
        ]};
    return dataquery.pagedata(tabledefinition,req,res);
});

module.exports = router;