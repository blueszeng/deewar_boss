var express = require('express');
var db = require('../../services/db');
var async = require('async');
var moment = require('moment');
var string = require('string');
var rbaccore = require('../../services/rbac/core');
var nashuiorderdao = require('../../services/dao/nashuiorder');
var router = express.Router();

router.get('/',function(req,res){
    if (!rbaccore.haspermission('custom_nashui',req,res)){
        return;
    }
    var ordertimes = [];
    for (var i = 0; i < 3;i++){
        var daytext = moment().add(i, 'days').format('M月D日');
        var dayname;
        switch(i){
            case 0:
                dayname = '今天';
                break;
            case 1:
                dayname = '明天';
                break;
            case 2:
                dayname = '后天';
                break;
        }
        ordertimes.push({
            name:dayname + '（' + daytext + '）',
            childs:[{
                text:'上午（10点－12点）',
                value:i*24+10
            },{
                text:'中午（12点－14点）',
                value:i*24+12
            },{
                text:'下午（14点－18点）',
                value:i*24+14
            },{
                text:'晚上（18点－21点）',
                value:i*24+18
            }]
        });
    }
    db.query('select id,city from t_cities where opened = 1',function(err,result){
        if (err){
            console.error('在数据库获取所有开放运营的城市失败',err);
        }
        return res.render('custom/nashui/index',{
            ordertimes:ordertimes,
            cities:result,
            info:req.query.info,
            error:req.query.error
        });
    });
});

router.post('/',function(req,res){
    var vendorid = req.body.vendorid;
    if (!vendorid){
        return res.redirect('/custom/nashui/?error=' + encodeURIComponent('无效的那谁订单号'));
    }
    var marketid = req.body.marketid;
    if (!marketid){
        return res.redirect('/custom/nashui/?error=' + encodeURIComponent('无效的那谁活动类型'));
    }
    var quality = req.body.quality;
    if (!quality){
        return res.redirect('/custom/nashui/?error=' + encodeURIComponent('无效的洗护数量'));
    }
    var ordertime = req.body.ordertime;
    if (!ordertime){
        return res.redirect('/custom/nashui/?error=' + encodeURIComponent('无效的取鞋时间'));
    }
    var cityid = req.body.cityid;
    if (!cityid){
        return res.redirect('/custom/nashui/?error=' + encodeURIComponent('无效的服务城市'));
    }
    var zoneid = req.body.zoneid;
    if (!zoneid){
        return res.redirect('/custom/nashui/?error=' + encodeURIComponent('无效的服务街道'));
    }
    var address = req.body.address;
    if (!address){
        return res.redirect('/custom/nashui/?error=' + encodeURIComponent('无效的服务街道'));
    }
    var contact = req.body.contact;
    if (!contact){
        return res.redirect('/custom/nashui/?error=' + encodeURIComponent('无效的联系人'));
    }
    var mobile = req.body.mobile;
    if (!mobile){
        return res.redirect('/custom/nashui/?error=' + encodeURIComponent('无效的联系电话'));
    }
    nashuiorderdao.order(vendorid,marketid,ordertime,quality,cityid,zoneid,address,contact,mobile,function(err){
        if (err){
            return res.redirect('/custom/nashui/?error=' + err);
        }
        return res.redirect('/custom/nashui/?info=' + encodeURIComponent('那谁订单处理成功'));
    });
});

module.exports = router;