var express = require('express');
var db = require('../../services/db');
var async = require('async');
var dataquery = require('../../services/web/dataquery');
var rbaccore = require('../../services/rbac/core');
var wechatapi = require('../../services/wechat/api');
var router = express.Router();

router.get('/',function(req,res){
    if (!rbaccore.haspermission('operation_channel',req,res)){
        return;
    }
    return res.render('operation/channel/index',{
        info:req.query.info,
        error:req.query.error
    });
});

router.post('/list.html',function(req,res){
    if (!rbaccore.haspermission('operation_channel',req,res)){
        return;
    }
    var tabledefinition = {
        sTableName: 't_channels',
        sCountColumnName:'id',
        aoColumnDefs: [
            { mData: 'id', bSearchable: true },
            { mData: 'channeltype', bSearchable: true },
            { mData: 'channelname', bSearchable: false },
            { mData: 'channeldesc', bSearchable: false },
            { mData: null, bSearchable: false}
        ]};
    return dataquery.pagedata(tabledefinition,req,res);
});


router.get('/qrcode.html',function(req,res){
    if (!rbaccore.haspermission('operation_channel_qrcode',req,res)){
        return;
    }
    var id = req.query.id;
    if (!id){
        return res.redirect('/operation/channel/?error=无效的渠道ID');
    }
    //调用微信接口
    wechatapi.createLimitQRCode('u' + id,function(err,result){
        if (err){
            return res.redirect('/operation/channel/?error=生成渠道二维码失败');
        }
        return res.render('operation/channel/qrcode',{
            imgsrc:wechatapi.showQRCodeURL(result.ticket)
        });
    });
});


module.exports = router;