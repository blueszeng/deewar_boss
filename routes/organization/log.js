/**
 * Created by jimmychou on 15/1/8.
 */
var express = require('express');
var dataquery = require('../../services/web/dataquery');
var rbaccore = require('../../services/rbac/core');
var moment = require('moment');
var router = express.Router();

router.get('/',function(req,res){
    if (!rbaccore.haspermission('organization_log',req,res)){
        return;
    }
    res.render('organization/log/index');
});

router.post('/list.html',function(req,res){
    if (!rbaccore.haspermission('organization_log',req,res)){
        return;
    }
    var startdate = req.body.startdate;
    if (!startdate){
        startdate = moment().subtract(7,'days').startOf('day');
    } else {
        startdate = moment(Number(startdate));
    }
    var stopdate = req.body.stopdate;
    if (!stopdate){
        stopdate = moment();
    } else {
        stopdate = moment(Number(stopdate));
    }

    var tabledefinition = {
        sTableName: 't_logs',
        sCountColumnName:'id',
        sDateColumnName:'updatetime',
        dateFrom:startdate,
        dateTo:stopdate,
        aoColumnDefs: [
            { mData: null, bSearchable:false},
            { mData: 'updatetime', bSearchable: false },
            { mData: 'username', bSearchable: true },
            { mData: 'ip', bSearchable: true },
            { mData: 'url', bSearchable: true },
            { mData: 'method', bSearchable: false },
            { mData: 'param', bSearchable: false}
        ]};
    return dataquery.pagedata(tabledefinition,req,res);
});

module.exports = router;