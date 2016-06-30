/**
 * Created by jimmychou on 15/1/12.
 */
var express = require('express');
var db = require('../../services/db');
var cache = require('../../services/cache');
var async = require('async');
var dataquery = require('../../services/web/dataquery');
var rbaccore = require('../../services/rbac/core');
var router = express.Router();

router.get('/',function(req,res){
    if (!rbaccore.haspermission('operation_zone',req,res)){
        return;
    }
    db.query('select * from t_provinces',function(err,result){
        if (err){
            console.error('在数据库获取所有的省份失败',err);
        }
        return res.render('operation/zone/index',{
            info:req.query.info,
            error:req.query.error,
            provinces:result
        });
    });
});

router.post('/list.html',function(req,res){
    if (!rbaccore.haspermission('operation_zone',req,res)){
        return;
    }
    var tabledefinition = {
        sSelectSql:'t_cities.city city,t_provinces.province province,t_cities.lng lng,t_cities.lat lat,t_cities.opened opened,t_cities.id id,t_cities.provinceid provinceid',
        sFromSql:'t_cities left join t_provinces on t_cities.provinceid = t_provinces.id',
        sCountColumnName:'t_cities.id',
        aoColumnDefs: [
            { mData: 'city', bSearchable: true },
            { mData: 'province', bSearchable: false },
            { mData: 'opened', bSearchable: true },
            { mData: 'lng', bSearchable: false },
            { mData: 'lat', bSearchable: false },
            { mData: null, bSearchable: false},
            { mData: 'id', bSearchable: false},
            { mData: 'provinceid', bSearchable: true}
        ]};
    return dataquery.pagedata(tabledefinition,req,res);
});

router.get('/edit.html',function(req,res){
    if (!rbaccore.haspermission('operation_zone_edit',req,res)){
        return;
    }
    var cityid = req.query.cityid;
    if (!cityid){
        return res.redirect('/operation/zone/?error=无法编辑城市信息');
    }
    db.query('select t_cities.id id,city,province,lng,lat,opened from t_cities left join t_provinces on t_cities.provinceid = t_provinces.id where t_cities.id = ?',[cityid],function(err,result){
        if (err){
            console.error('无法在数据库中获取城市信息',err);
            return res.redirect('/operation/zone/?error=无法编辑城市信息');
        }
        if (result.length == 0){
            return res.redirect('/operation/zone/?error=无法编辑城市信息');
        }
        return res.render('operation/zone/edit',{
            city:result[0],
            error:req.query.error
        });
    });
});

router.post('/edit.html',function(req,res){
    if (!rbaccore.haspermission('operation_zone_edit',req,res)){
        return;
    }
    var cityid = req.body.cityid;
    if (!cityid){
        return res.redirect('/operation/zone/?error=无法编辑城市信息');
    }
    var openedvalue = req.body.opened;
    var opened = 0;
    if (openedvalue && openedvalue == 'on'){
        opened = 1;
    }
    db.query('update t_cities set lng = ?,lat = ?,opened = ? where id = ?',[req.body.lng,req.body.lat,opened,cityid],function(err){
        if (err){
            console.log('在数据库编辑城市信息错误');
            return res.redirect('/operation/zone/edit.html?cityid=' + cityid + '&error=编辑城市信息失败');
        }
        //清除开通城市缓存
        cache.delete('city_opened',function(err){
            if (err){
                console.error('清空已开通城市缓存失败',err);
            }
        });
        return res.redirect('/operation/zone/?info=成功编辑城市信息');
    });
});

router.get('/district.html',function(req,res){
    if (!rbaccore.haspermission('operation_zone_district',req,res)){
        return;
    }
    var cityid = req.query.cityid;
    if (!cityid){
        return res.redirect('/operation/zone/?error=无法编辑城市街道信息');
    }
    db.query('select city from t_cities where id = ?',[cityid],function(err,result){
        if (err){
            console.error('在数据库中查询城市失败',err);
            return res.redirect('/operation/zone/?error=无法编辑城市街道信息');
        }
        if (result.length == 0){
            return res.redirect('/operation/zone/?error=无法编辑城市街道信息');
        }
        var cityname = result[0].city;
        db.query('select id,district from t_districts where cityid = ?',[cityid],function(err,result){
            if (err){
                console.error('在数据库根据城市获取所有的行政区失败',err);
            }
            return res.render('operation/zone/district',{
                cityid:cityid,
                city:cityname,
                districts:result
            });
        });
    });
});

router.post('/listdistrict.html',function(req,res){
    if (!rbaccore.haspermission('operation_zone_district',req,res)){
        return;
    }
    var cityid = req.query.cityid;
    if (!cityid){
        cityid = 0;
    }
    var tabledefinition = {
        sSelectSql:'t_zones.zone zone,t_districts.district district,t_zones.opened opened,t_zones.updatetime updatetime,t_zones.id id,t_districts.id districtid',
        sFromSql:'t_zones left join t_districts on t_zones.districtid = t_districts.id',
        sCountColumnName:'t_zones.id',
        sWhereAndSql:'t_districts.cityid = ' + cityid,
        aoColumnDefs: [
            { mData: 'zone', bSearchable: true },
            { mData: 'district', bSearchable: false },
            { mData: 'opened', bSearchable: false },
            { mData: 'updatetime', bSearchable: false },
            { mData: null, bSearchable: false},
            { mData: 'id', bSearchable: false},
            { mData: 'districtid', bSearchable: true},
            { mData: 't_zones.opened', bSearchable: true}
        ]};
    return dataquery.pagedata(tabledefinition,req,res);
});

router.get('/adddistrict.html',function(req,res){
    if (!rbaccore.haspermission('operation_zone_district_add',req,res)){
        return;
    }
    var cityid = req.query.cityid;
    if (!cityid){
        return res.redirect('/operation/zone/?error=无法新增街道');
    }
    db.query('select city from t_cities where id = ?',[cityid],function(err,result){
        if (err){
            console.error('在数据库中查询城市失败',err);
            return res.redirect('/operation/zone/?error=无法新增街道信息');
        }
        if (result.length == 0){
            return res.redirect('/operation/zone/?error=无法新增街道信息');
        }
        var cityname = result[0].city;
        db.query('select id,district from t_districts where cityid = ?',[cityid],function(err,result){
            if (err){
                console.error('在数据库根据城市获取所有的行政区失败',err);
            }
            return res.render('operation/zone/adddistrict',{
                cityid:cityid,
                city:cityname,
                districts:result
            });
        });
    });
});

router.post('/adddistrict.html',function(req,res){
    if (!rbaccore.haspermission('operation_zone_district_add',req,res)){
        return;
    }
    var cityid = req.body.cityid;
    if (!cityid){
        return res.redirect('/operation/zone/?error=无法新增街道');
    }
    var districtid = req.body.districtid;
    var district = req.body.district;
    if (districtid == -1 && !district){
        return res.redirect('/operation/zone/adddistrict.html?cityid=' + cityid + '&error=无效的行政区');
    }
    var zone = req.body.zone;
    if (!zone){
        return res.redirect('/operation/zone/adddistrict.html?cityid=' + cityid + '&error=无效的街道名称');
    }
    var openedvalue = req.body.opened;
    var opened = 0;
    if (openedvalue && openedvalue == 'on'){
        opened = 1;
    }
    return db.getConnection(function(err,connection){
        if (err){
            console.error('在数据库连接池获取连接失败',err);
            return res.redirect('/operation/zone/adddistrict.html?cityid=' + cityid + '&error=新增街道失败');
        }
        return connection.beginTransaction(function(err){
            if (err){
                console.error('数据库开始执行事务失败',err);
                connection.release();
                return res.redirect('/operation/zone/adddistrict.html?cityid=' + cityid + '&error=新增街道失败');
            }
            return async.waterfall([
                function(needupdate_district){
                    if (districtid == -1){
                        connection.query('insert t_districts (cityid,district,opened,updatetime) values (?,?,?,now())',[cityid,district,opened],function(err,result){
                            if (err){
                                needupdate_district(err);
                            } else {
                                needupdate_district(null,result.insertId);
                            }
                        });
                    } else {
                        if (opened == 1){
                            connection.query('update t_districts set opened = 1,updatetime = now() where id = ?',[districtid],function(err){
                                if (err){
                                    needupdate_district(err);
                                } else {
                                    needupdate_district(null,districtid);
                                }
                            });
                        } else {
                            needupdate_district(null,districtid);
                        }
                    }
                },
                function(newdistrictid,insert_zone){
                    connection.query('insert into t_zones (districtid,zone,opened,updatetime) values (?,?,?,now())',[newdistrictid,zone,opened],function(err){
                        if (err){
                            insert_zone(err);
                        } else {
                            insert_zone(null,newdistrictid);
                        }
                    });
                }
            ],function(err,result){
                if (err) {
                    console.error('在数据库插入新的街道时出错回滚',err);
                    return connection.rollback(function(err){
                        if (err){
                            console.error('数据库出错回滚错误',err);
                        }
                        connection.release();
                        return res.redirect('/operation/zone/adddistrict.html?cityid=' + cityid + '&error=新增街道失败');
                    });
                }
                return connection.commit(function(err){
                    if (err){
                        console.error('数据库提交失败',err);
                        return connection.rollback(function(err){
                            if (err){
                                console.error('数据库出错回滚错误',err);
                            }
                            connection.release();
                            return res.redirect('/operation/zone/adddistrict.html?cityid=' + cityid + '&error=新增街道失败');
                        });
                    }
                    connection.release();
                    cache.delete('district_opened_' + cityid);
                    cache.delete('zone_opened_' + result);
                    return res.redirect('/operation/zone/district.html?cityid=' + cityid + '&info=新增街道' + zone + '成功');
                });
            });
        });
    });
});

router.get('/deldistrict.html',function(req,res){
    if (!rbaccore.haspermission('operation_zone_district_del',req,res)){
        return;
    }
    var zoneid = req.query.zoneid;
    if (!zoneid){
        return res.redirect('/operation/zone/?error=无法删除街道');
    }
    //获取ZONE对应的DISTRICT以及CITY
    db.query('select t_zones.districtid districtid,t_districts.cityid cityid from t_zones left join t_districts on t_zones.districtid = t_districts.id where t_zones.id = ?',[zoneid],function(err,result){
        if (err){
            console.error('在数据库查找街道失败',err);
            return res.redirect('/operation/zone/?error=无法删除街道');
        }
        if (result.length == 0){
            return res.redirect('/operation/zone/?error=无法删除街道');
        }
        var districtid = result[0].districtid;
        var cityid = result[0].cityid;
        return db.getConnection(function(err,connection){
            if (err){
                console.error('在数据库连接池获取连接失败',err);
                return res.redirect('/operation/zone/district.html?cityid=' + cityid + '&error=删除街道失败');
            }
            return connection.beginTransaction(function(err){
                if (err){
                    console.error('数据库开始执行事务失败',err);
                    connection.release();
                    return res.redirect('/operation/zone/district.html?cityid=' + cityid + '&error=删除街道失败');
                }
                return async.waterfall([
                    function(query_childs){
                        connection.query('select id from t_zones where districtid = ? and id != ?',[districtid,zoneid],function(err,result){
                            if (err){
                                query_childs(err);
                            } else {
                                if (result.length > 0){
                                    query_childs(null,false);
                                } else {
                                    query_childs(null,true);
                                }
                            }
                        });
                    },
                    function(needdelete,delete_district){
                        if (needdelete == true){
                            connection.query('delete from t_districts where id = ?',[districtid],function(err){
                                delete_district(err);
                            });
                        } else {
                            delete_district(null);
                        }
                    },
                    function(delete_zone){
                        connection.query('delete from t_zones where id = ?',[zoneid],function(err){
                            delete_zone(err);
                        });
                    }
                ],function(err){
                    if (err) {
                        console.error('在数据库删除街道时出错回滚',err);
                        return connection.rollback(function(err){
                            if (err){
                                console.error('数据库出错回滚错误',err);
                            }
                            connection.release();
                            return res.redirect('/operation/zone/district.html?cityid=' + cityid + '&error=删除街道失败');
                        });
                    }
                    return connection.commit(function(err){
                        if (err){
                            console.error('数据库提交失败',err);
                            return connection.rollback(function(err){
                                if (err){
                                    console.error('数据库出错回滚错误',err);
                                }
                                connection.release();
                                return res.redirect('/operation/zone/district.html?cityid=' + cityid + '&error=删除街道失败');
                            });
                        }
                        connection.release();
                        cache.delete('district_opened_' + cityid);
                        cache.delete('zone_opened_' + result);
                        return res.redirect('/operation/zone/district.html?cityid=' + cityid + '&info=删除街道成功');
                    });
                });
            });
        });
    });
});

router.get('/editdistrict.html',function(req,res){
    if (!rbaccore.haspermission('operation_zone_district_edit',req,res)){
        return;
    }
    var zoneid = req.query.zoneid;
    if (!zoneid){
        return res.redirect('/operation/zone/?error=无法编辑街道');
    }
    //获取ZONE对应的DISTRICT以及CITY
    db.query('select t_zones.opened opened,t_zones.zone zone,t_cities.city city,t_zones.districtid districtid,t_districts.cityid cityid from t_zones left join t_districts on t_zones.districtid = t_districts.id left join t_cities on t_districts.cityid = t_cities.id where t_zones.id = ?',[zoneid],function(err,result) {
        if (err) {
            console.error('在数据库查找街道失败', err);
            return res.redirect('/operation/zone/?error=无法编辑街道');
        }
        if (result.length == 0) {
            return res.redirect('/operation/zone/?error=无法编辑街道');
        }
        var cityname = result[0].city;
        var districtid = result[0].districtid;
        var cityid = result[0].cityid;
        var zonename = result[0].zone;
        var opened = result[0].opened;
        db.query('select id,district from t_districts where cityid = ?',[cityid],function(err,result){
            if (err){
                console.error('在数据库根据城市获取所有的行政区失败',err);
            }
            return res.render('operation/zone/editdistrict',{
                cityid:cityid,
                city:cityname,
                zone:zonename,
                zoneid:zoneid,
                districtid:districtid,
                districts:result,
                opened:opened
            });
        });
    });
});

router.post('/editdistrict.html',function(req,res){
    if (!rbaccore.haspermission('operation_zone_district_edit',req,res)){
        return;
    }
    var zoneid = req.body.zoneid;
    if (!zoneid){
        return res.redirect('/operation/zone/?error=无法编辑街道');
    }
    var cityid = req.body.cityid;
    if (!cityid){
        return res.redirect('/operation/zone/editdistrict.html?zoneid='+zoneid+'&error=无法编辑街道');
    }
    var olddistrictid = req.body.olddistrictid;
    if (!olddistrictid){
        return res.redirect('/operation/zone/editdistrict.html?zoneid='+zoneid+'&error=无法编辑街道');
    }
    var districtid = req.body.districtid;
    var district = req.body.district;
    if (districtid == -1 && !district){
        return res.redirect('/operation/zone/editdistrict.html?zoneid=' + zoneid + '&error=无效的行政区');
    }
    var zone = req.body.zone;
    if (!zone){
        return res.redirect('/operation/zone/editdistrict.html?zoneid=' + zoneid + '&error=无效的街道名称');
    }
    var openedvalue = req.body.opened;
    var opened = 0;
    if (openedvalue && openedvalue == 'on'){
        opened = 1;
    }
    return db.getConnection(function(err,connection){
        if (err){
            console.error('在数据库连接池获取连接失败',err);
            return res.redirect('/operation/zone/editdistrict.html?zoneid=' + zoneid + '&error=编辑街道失败');
        }
        return connection.beginTransaction(function(err){
            if (err){
                console.error('数据库开始执行事务失败',err);
                connection.release();
                return res.redirect('/operation/zone/editdistrict.html?zoneid=' + zoneid + '&error=编辑街道失败');
            }
            return async.waterfall([
                function(update_district){
                    if (districtid == -1){
                        //新的行政区
                        connection.query('insert into t_districts (cityid,district,opened,updatetime) values (?,?,?,now())',[cityid,district,opened],function(err,result){
                            if (err){
                                update_district(err);
                            } else {
                                update_district(null,true,result.insertId);
                            }
                        });
                    } else {
                        if (olddistrictid == districtid){
                            //行政区不变
                            if (opened == 1){
                                connection.query('update t_districts set opened = 1,updatetime = now() where id = ?',[districtid],function(err){
                                    if (err){
                                        update_district(err);
                                    } else {
                                        update_district(null,false,districtid);
                                    }
                                });
                            } else {
                                update_district(null,true,districtid);
                            }
                        } else {
                            //更换了行政区
                            update_district(null,true,districtid);
                        }
                    }
                },
                function(needcheckolddistrict,newdistrictid,check_district){
                    if (needcheckolddistrict == true){
                        connection.query('select opened from t_zones where districtid = ? and id != ?',[olddistrictid,zoneid],function(err,result){
                            if (err){
                                check_district(err);
                            } else {
                                if (result.length == 0){
                                    //删除DISTRICT
                                    connection.query('delete from t_districts where id = ?',[olddistrictid],function(err){
                                        if (err){
                                            check_district(err);
                                        } else {
                                            check_district(null,newdistrictid);
                                        }
                                    });
                                } else {
                                    var oldopened = false;
                                    for (var i = 0;i < result.length;i++){
                                        if (result[i].opened == 1){
                                            oldopened = true;
                                            break;
                                        }
                                    }
                                    connection.query('update t_districts set opened = ?,updatetime = now() where id = ?',[(oldopened == true ? 1 : 0),olddistrictid],function(err){
                                        if (err){
                                            check_district(err);
                                        } else {
                                            check_district(null,newdistrictid);
                                        }
                                    });
                                }
                            }
                        });
                    } else {
                        check_district(null,newdistrictid);
                    }
                },
                function(newdistrictid,update_zone){
                    connection.query('update t_zones set zone = ?,opened = ?,districtid = ?,updatetime = now() where id = ?',[zone,opened,newdistrictid,zoneid],function(err){
                        if (err){
                            update_zone(err);
                        } else {
                            update_zone(null,newdistrictid);
                        }
                    });
                }
            ],function(err,result){
                if (err) {
                    console.error('在数据库编辑街道时出错回滚',err);
                    return connection.rollback(function(err){
                        if (err){
                            console.error('数据库出错回滚错误',err);
                        }
                        connection.release();
                        return res.redirect('/operation/zone/editdistrict.html?zoneid=' + zoneid + '&error=编辑街道失败');
                    });
                }
                return connection.commit(function(err){
                    if (err){
                        console.error('数据库提交失败',err);
                        return connection.rollback(function(err){
                            if (err){
                                console.error('数据库出错回滚错误',err);
                            }
                            connection.release();
                            return res.redirect('/operation/zone/editdistrict.html?zoneid=' + zoneid + '&error=新增街道失败');
                        });
                    }
                    connection.release();
                    cache.delete('district_opened_' + cityid);
                    cache.delete('zone_opened_' + olddistrictid);
                    cache.delete('zone_opened_' + result);
                    return res.redirect('/operation/zone/district.html?cityid=' + cityid + '&info=编辑街道' + zone + '成功');
                });
            });
        });
    });
});

router.post('/query.html',function(req,res){
    var cityid = req.body.cityid;
    if (!cityid){
        return res.json([]);
    }
    db.query('select t_zones.id id,CONCAT(t_zones.zone,\'(\',t_districts.district,\')\') text from t_zones left join t_districts on t_zones.districtid = t_districts.id where t_districts.cityid = ? and t_zones.opened = 1 order by t_zones.districtid',[cityid],function(err,result){
        if (err){
            console.error('在数据库按城市获取开通的区域错误',err);
            return res.json([]);
        }
        return res.json(result);
    });
});

var exitsdistrict = function(array,district){
    var exist = -1;
    for (var i = 0;i < array.length;i++){
        var districtobject = array[i];
        if (districtobject.text == district){
            exist = i;
            break;
        }
    }
    return exist;
};

router.post('/querygroup.html',function(req,res){
    var cityid = req.body.cityid;
    if (!cityid){
        return res.json([]);
    }
    db.query('select t_zones.id id,t_zones.zone,t_districts.district,t_districts.id did from t_zones left join t_districts on t_zones.districtid = t_districts.id where t_districts.cityid = ? and t_zones.opened = 1 order by t_zones.districtid',[cityid],function(err,result){
        if (err){
            console.error('在数据库按城市获取开通的区域错误',err);
            return res.json([]);
        }
        var array = [];
        for (var i = 0;i < result.length;i++){
            var zone = result[i];
            var index = exitsdistrict(array,zone.district);
            if (index > -1){
                var district = array[index];
                district.children.push({
                    id:zone.id,
                    text:zone.zone,
                    district:zone.district
                });
            } else {
                array.push({
                    text:zone.district,
                    children:[{
                        id:zone.id,
                        text:zone.zone,
                        district:zone.district
                    }]
                })
            }
        }
        return res.json(array);
    });
});

module.exports = router;