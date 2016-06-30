/**
 * Created by jimmychou on 15/1/23.
 */
var express = require('express');
var db = require('../../services/db');
var async = require('async');
var router = express.Router();

router.post('/city.json',function(req,res){
    db.query('select t_cities.id id,t_cities.city city,t_provinces.province province,t_cities.lng lng,t_cities.lat lat from t_cities left join t_provinces on t_cities.provinceid = t_provinces.id where t_cities.opened = 1',function(err,result){
        if (err){
            console.error('在数据库查找城市信息失败',err);
            return res.json({success:false,message:'系统错误，请重试'});
        }
        return res.json({success:true,data:result});
    });
});

router.post('/district.json',function(req,res){
    var cityid = req.body.cityid;
    if (!cityid){
        return res.json({success:false,message:'无效的城市'});
    }
    db.query('select id,cityid,district from t_districts where cityid = ? and opened = 1',[cityid],function(err,result){
        if (err){
            console.error('在数据库按城市查找行政区失败',err);
            return res.json({success:false,message:'系统错误，请重试'});
        }
        return res.json({success:true,data:result});
    });
});

router.post('/zone.json',function(req,res){
    var districtid = req.body.districtid;
    if (!districtid){
        return res.json({success:false,message:'无效的区'});
    }
    db.query('select id,districtid,zone from t_zones where districtid = ? and opened = 1',[districtid],function(err,result){
        if (err){
            console.error('在数据库按区查找街道失败',err);
            return res.json({success:false,message:'系统错误，请重试'});
        }
        return res.json({success:true,data:result});
    });
});

router.post('/site.json',function(req,res){
    var zoneid = req.body.zoneid;
    if (!zoneid){
        return res.json({success:false,message:'无效的街道'});
    }
    db.query('select t_sites_zone.zoneid zoneid, t_sites.id id,t_sites.site site,t_sites.address address,t_sites.lng lng ,t_sites.lat lat from t_sites_zone left join t_sites on t_sites_zone.siteid = t_sites.id where t_sites_zone.zoneid = ?',[zoneid],function(err,result){
        if (err){
            console.error('在数据库按街道查找配送站失败',err);
            return res.json({success:false,message:'系统错误，请重试'});
        }
        return res.json({success:true,data:result});
    });
});

router.post('/workmate.json',function(req,res){
    var siteid = req.body.siteid;
    if (!siteid){
        return res.json({success:false,message:'无效的配送站'});
    }
    db.query('select t_sites_staff.siteid siteid,t_staffs.username username,t_staffs.mobile mobile,t_staffs.showname showname from t_sites_staff left join t_staffs on t_sites_staff.username = t_staffs.username where t_sites_staff.siteid = ?',[siteid],function(err,result){
        if (err){
            console.error('在数据库按配送站查找人员失败',err);
            return res.json({success:false,message:'系统错误，请重试'});
        }
        return res.json({success:true,data:result});
    });
});

module.exports = router;