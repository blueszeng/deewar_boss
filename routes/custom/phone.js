/**
 * Created by jimmychou on 15/1/8.
 */
var express = require('express');
var dataquery = require('../../services/web/dataquery');
var rbaccore = require('../../services/rbac/core');
var moment = require('moment');
var router = express.Router();

router.get('/',function(req,res){
    if (!rbaccore.haspermission('custom_phone',req,res)){
        return;
    }
    res.render('custom/phone/index');
});

router.post('/list.html',function(req,res){
    if (!rbaccore.haspermission('custom_phone',req,res)){
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
        sTableName: 't_calls',
        sCountColumnName:'callid',
        sDateColumnName:'fromtime',
        dateFrom:startdate,
        dateTo:stopdate,
        aoColumnDefs: [
            { mData: null, bSearchable:false},
            { mData: 'fromtime', bSearchable: true },
            { mData: 'fromphone', bSearchable: true },
            { mData: 'iswork', bSearchable: true },
            { mData: 'agentid', bSearchable: true },
            { mData: 'endtime', bSearchable: false },
            { mData: null, bSearchable: false},
            { mData: 'recordurl', bSearchable:false},
            { mData: 'callid', bSearchable: false},
            { mData: 'tophone', bSearchable: false},
            { mData: 'errorcode', bSearchable: false},
            { mData: 'userhanguptime', bSearchable: false},
            { mData: 'agenthanguptime', bSearchable: false}
        ]};
    return dataquery.pagedata(tabledefinition,req,res);
});

module.exports = router;