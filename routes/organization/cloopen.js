var express = require('express');
var rbaccore = require('../../services/rbac/core');
var cloopenapi = require('../../services/cloopen/api');
var router = express.Router();


router.get('/',function(req,res){
    if (!rbaccore.haspermission('organization_cloopen',req,res)){
        return;
    }
    return res.render('organization/cloopen/index',{
        info:req.query.info,
        error:req.query.error
    });
});


router.post('/',function(req,res){
    if (!rbaccore.haspermission('organization_cloopen',req,res)){
        return;
    }
    var modulename = req.body.modulename;
    var actionname = req.body.actionname;
    var params= req.body.params;
    var reqmethod = req.body.reqmethod;
    if (!modulename || !actionname){
        return res.render('organization/cloopen/index',{
            modulename:modulename,
            actionname:actionname,
            params:params,
            reqmethod:reqmethod,
            error:'错误的模块名或方法名'
        });
    }
    if (reqmethod && Number(reqmethod) === 1){
        cloopenapi.dodebug(null,modulename,actionname,params,function(err,data){
            if (err){
                return res.render('organization/cloopen/index',{
                    modulename:modulename,
                    actionname:actionname,
                    params:params,
                    reqmethod:reqmethod,
                    error:err
                });
            }
            return res.render('organization/cloopen/index',{
                modulename:modulename,
                actionname:actionname,
                params:params,
                reqmethod:reqmethod,
                content:JSON.stringify(data)
            });
        });
    } else {
        cloopenapi.dodebug(true,modulename,actionname,params,function(err,data){
            if (err){
                return res.render('organization/cloopen/index',{
                    modulename:modulename,
                    actionname:actionname,
                    params:params,
                    reqmethod:reqmethod,
                    error:err
                });
            }
            return res.render('organization/cloopen/index',{
                modulename:modulename,
                actionname:actionname,
                params:params,
                reqmethod:reqmethod,
                content:data
            });
        });
    }
});

module.exports = router;