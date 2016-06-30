var express = require('express');
var db = require('../../services/db');
var async = require('async');
var moment = require('moment');
var string = require('string');
var rbaccore = require('../../services/rbac/core');
var taobaoorderdao = require('../../services/dao/taobaoorder');
var router = express.Router();

router.get('/',function(req,res){
    if (!rbaccore.haspermission('custom_taobao',req,res)){
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
        return res.render('custom/taobao/index',{
            ordertimes:ordertimes,
            cities:result,
            info:req.query.info,
            error:req.query.error
        });
    });
});

router.post('/',function(req,res){
    var taobaoname = req.body.taobaoname;
    if (!taobaoname){
        return res.redirect('/custom/taobao/?error=无效的淘宝买家账号');
    }
    var vendorid = req.body.vendorid;
    if (!vendorid){
        return res.redirect('/custom/taobao/?error=无效的淘宝交易号');
    }
    var payid = req.body.payid;
    if (!payid){
        return res.redirect('/custom/taobao/?error=无效的支付宝交易号');
    }
    var marketid = req.body.marketid;
    if (!marketid){
        return res.redirect('/custom/taobao/?error=无效的淘宝活动类型');
    }
    var quality = req.body.quality;
    if (!quality){
        return res.redirect('/custom/taobao/?error=无效的洗护数量');
    }
    var ordertime = req.body.ordertime;
    if (!ordertime){
        return res.redirect('/custom/taobao/?error=无效的取鞋时间');
    }
    var cityid = req.body.cityid;
    if (!cityid){
        return res.redirect('/custom/taobao/?error=无效的服务城市');
    }
    var zoneid = req.body.zoneid;
    if (!zoneid){
        return res.redirect('/custom/taobao/?error=无效的服务街道');
    }
    var address = req.body.address;
    if (!address){
        return res.redirect('/custom/taobao/?error=无效的服务街道');
    }
    var contact = req.body.contact;
    if (!contact){
        return res.redirect('/custom/taobao/?error=无效的联系人');
    }
    var mobile = req.body.mobile;
    if (!mobile){
        return res.redirect('/custom/taobao/?error=无效的联系电话');
    }
    taobaoorderdao.order(taobaoname,vendorid,payid,marketid,ordertime,quality,cityid,zoneid,address,contact,mobile,function(err){
        if (err){
            return res.redirect('/custom/taobao/?error=' + err);
        }
        return res.redirect('/custom/taobao/?info=淘宝订单处理成功');
    });
});

router.post('/parsecopy.json',function(req,res){
    var info = req.body.info;
    if (!info){
        return res.json({success:false,message:'无效的淘宝物流信息'});
    }
    var infoarrays = info.split('，');
    if (infoarrays.length < 4 || infoarrays.length > 5){
        return res.json({success:false,message:'无效的淘宝物流信息格式'});
    }
    var taobaoaddress = infoarrays[2];
    var taobaoaddressarray = taobaoaddress.split(' ');
    if (taobaoaddressarray.length < 4 || taobaoaddressarray.length > 6){
        return res.json({success:false,message:'无效的淘宝物流地址格式'});
    }
    var contact = infoarrays[0];
    var mobile = infoarrays[1];
    var city,zone,address;
    if (taobaoaddressarray.length == 4){
        city = taobaoaddressarray[0];
        zone = taobaoaddressarray[2];
        address = taobaoaddressarray[3];
    } else {
        city = taobaoaddressarray[1];
        zone = taobaoaddressarray[3];
        address = taobaoaddressarray[4];
    }
    city = string(city).chompRight('市').s;
    zone = string(zone).chompRight('街道').s;
    db.query('select t_zones.id zoneid,t_cities.id cityid from t_zones left join t_districts on t_zones.districtid = t_districts.id left join t_cities on t_districts.cityid = t_cities.id where t_zones.opened = 1 and t_zones.zone = ? and t_cities.city = ?',[zone,city],function(err,result){
        if (err){
            console.error('在数据库查询街道和城市信息错误',err);
            return res.json({success:false,message:'没有匹配的地址信息'});
        }
        if (result.length == 0){
            return res.json({success:false,message:'没有匹配的地址信息'});
        }
        var zone = result[0];
        return res.json({success:true,data:{
            contact:contact,
            mobile:mobile,
            cityid:zone.cityid,
            zoneid:zone.zoneid,
            address:address
        }});
    });
});


module.exports = router;