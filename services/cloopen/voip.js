var express = require('express');
var cloopenapi = require('./api');
var db = require('../db');
var router = express.Router();

router.post('/state',function(req,res){
    var agentid = req.body.agentid;
    if (!agentid){
        return res.json({success:false,message:'无效的座席号'});
    }
    var state = req.body.state;
    if (!state){
        return res.json({success:false,message:'无效的状态'});
    }
    cloopenapi.agentready(agentid,state,function(err){
        if (err){
            return res.json({success:false,message:err});
        }
        return res.json({success:true,data:true});
    });
});

router.post('/querycall',function(req,res){
    var agentid = req.body.agentid;
    if (!agentid){
        return res.json({success:false,message:'无效的座席号'});
    }
    db.query('select lastcallid,lastnumber from t_customs where agentid = ?',[agentid],function(err,result){
        if (err || result == 0){
            return res.json({success:false,message:'无效的座席号'});
        }
        var call = result[0];
        return res.json({success:true,data:{
            callid:call.lastcallid,
            callnumber:call.lastnumber
        }});
    });
});

router.post('/transfercall',function(req,res){
    var callid = req.body.callid;
    var mobile = req.body.mobile;
    if (!callid){
        return res.json({success:false,message:'无效的CALLID'});
    }
    if (!mobile){
        return res.json({success:false,message:'无效的转接号码'});
    }
    cloopenapi.transferto(callid,mobile,function(err){
        if (err){
            return res.json({success:false,message:err});
        }
        return res.json({success:true,data:true});
    });
});

module.exports = router;