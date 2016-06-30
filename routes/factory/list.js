/**
 * Created by jimmychou on 15/1/27.
 */
var express = require('express');
var rbaccore = require('../../services/rbac/core');
var dataquery = require('../../services/web/dataquery');
var router = express.Router();

router.get('/',function(req,res){
    if (!rbaccore.haspermission('factory_list',req,res)){
        return;
    }
    return res.render('factory/list/index');
});

router.post('/list.html',function(req,res){
    if (!rbaccore.haspermission('factory_list',req,res)){
        return;
    }
    var tabledefinition = {
        sSelectSql:'orderid,status,recvtime,packagecode,intime,batchcode,lpad(labelcode,4,0) labelcode,outtime,id,ordinal,totals',
        sFromSql: 't_orders_package',
        sCountColumnName:'id',
        aoColumnDefs: [
            { mData: 'orderid', bSearchable: true },
            { mData: 'status', bSearchable: true },
            { mData: 'recvtime', bSearchable: false },
            { mData: 'packagecode', bSearchable: true },
            { mData: 'intime', bSearchable: false },
            { mData: 'batchcode', bSearchable: true },
            { mData: 'labelcode', bSearchable: true },
            {mData: 'outtime', bSearchable: false},
            { mData: null, bSearchable: false},
            { mData: null, bSearchable: false},
            { mData: 'id', bSearchable: true },
            {mData: 'ordinal', bSearchable: false},
            {mData: 'totals', bSearchable: false}
        ]};
    return dataquery.pagedata(tabledefinition,req,res);
});

module.exports = router;