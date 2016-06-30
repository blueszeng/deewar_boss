var express = require('express');
var rbaccore = require('../../services/rbac/core');
var router = express.Router();
var redisClient = require('../../stores/redis');

router.get('/',function(req,res){
    if (!rbaccore.haspermission('organization_taobaokey',req,res)){
        return;
    }
    redisClient.get('taobao:session',function(err,result){
        if (err){
            return res.render('organization/taobaokey/index',{
                info:req.query.info,
                error:req.query.error
            });
        }
        if (!result){
            return res.render('organization/taobaokey/index',{
                info:req.query.info,
                error:req.query.error
            });
        }
        return res.render('organization/taobaokey/index',{
            sessionkey:result,
            info:req.query.info,
            error:req.query.error
        });
    });
});


router.post('/',function(req,res){
    if (!rbaccore.haspermission('organization_taobaokey',req,res)){
        return;
    }
    var sessionkey = req.body.sessionkey;
    if (!sessionkey){
        return res.render('organization/taobaokey/index',{
            error:'错误的SESSIONKEY'
        });
    }
    redisClient.setex('taobao:session',60*60*24*365,sessionkey,function(err,result){
        if (err){
            console.log('保存淘宝sessionkey错误',err);
            return res.render('organization/taobaokey/index',{
                sessionkey:sessionkey,
                error:'保存SESSIONKEY失败'
            });
        }
        return res.render('organization/taobaokey/index',{
            sessionkey:sessionkey,
            info:'保存SESSIONKEY成功'
        });
    });
});

module.exports = router;
