var express = require('express');
var db = require('../../services/db');
var async = require('async');
var dataquery = require('../../services/web/dataquery');
var rbaccore = require('../../services/rbac/core');
var wechatcard = require('../../services/coupon/wechatcard');
var wechatapi = require('../../services/wechat/api');
var router = express.Router();

router.get('/',function(req,res){
    if (!rbaccore.haspermission('operation_coupon',req,res)){
        return;
    }
    return res.render('operation/coupon/index',{
        info:req.query.info,
        error:req.query.error
    });
});

router.post('/list.html',function(req,res){
    if (!rbaccore.haspermission('operation_coupon',req,res)){
        return;
    }
    var tabledefinition = {
        sTableName: 't_coupons',
        sCountColumnName:'id',
        aoColumnDefs: [
            { mData: 'id', bSearchable: true },
            { mData: 'cardtype', bSearchable: true },
            { mData: 'amount', bSearchable: false },
            { mData: 'expiredate', bSearchable: true },
            { mData: 'cardname', bSearchable: false },
            { mData: 'status', bSearchable:true},
            { mData: 'updatetime', bSearchable: false},
            { mData: 'getlimit', bSearchable:false},
            { mData: null, bSearchable: false}
        ]};
    return dataquery.pagedata(tabledefinition,req,res);
});

router.get('/add.html',function(req,res){
    if (!rbaccore.haspermission('operation_coupon_add',req,res)){
        return;
    }
    return res.render('operation/coupon/add');
});

router.post('/add.html',function(req,res){
    if (!rbaccore.haspermission('operation_coupon_add',req,res)){
        return;
    }
    var cardname = req.body.cardname;
    if (!cardname){
        return res.render('operation/coupon/add',{
            error:'无效的卡券名称'
        });
    }
    var amount = req.body.amount;
    if (!amount){
        return res.render('operation/coupon/add',{
            error:'无效的优惠金额'
        });
    }
    var expiredate = req.body.expiredate;
    if (!expiredate){
        return res.render('operation/coupon/add',{
            error:'无效的失效天数'
        });
    }
    var getlimit = req.body.getlimit;
    if (!getlimit){
        getlimit = 1;
    }
    wechatcard.createcard(cardname,amount,expiredate,getlimit,function(err,result){
        if (err){
            return res.render('operation/coupon/add',{
                error:err
            });
        }
        db.query('insert into t_coupons (cardtype,cardid,amount,status,updatetime,expiredate,cardname,getlimit) values (0,?,?,1,now(),?,?,?)',[result,amount,expiredate,cardname,getlimit],function(err,dbresult){
            if (err){
                return res.render('operation/coupon/add',{
                    error:'微信卡券创建成功但插入数据库失败'
                });
            }
            return res.redirect('/operation/coupon/?info=新增优惠券[' + cardname + ']成功');
        });
    });
});

router.get('/qrcode.html',function(req,res){
    if (!rbaccore.haspermission('operation_coupon_add',req,res)){
        return;
    }
    var id = req.query.id;
    if (!id){
        return res.redirect('/operation/coupon/?error=无效的优惠券类型');
    }
    //调用微信接口
    wechatapi.createLimitQRCode('c' + id,function(err,result){
        if (err){
            return res.redirect('/operation/coupon/?error=生成优惠券投放二维码失败');
        }
        return res.render('operation/coupon/qrcode',{
            imgsrc:wechatapi.showQRCodeURL(result.ticket)
        });
    });
});


module.exports = router;