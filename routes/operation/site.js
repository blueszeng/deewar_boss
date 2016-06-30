/**
 * Created by jimmychou on 15/1/12.
 */
var express = require('express');
var db = require('../../services/db');
var async = require('async');
var dataquery = require('../../services/web/dataquery');
var rbaccore = require('../../services/rbac/core');
var router = express.Router();

router.get('/',function(req,res){
    if (!rbaccore.haspermission('operation_site',req,res)){
        return;
    }
    db.query('select id,city from t_cities where opened = 1',function(err,result){
        if (err){
            console.error('在数据库获取所有开放运营的城市失败',err);
        }
        return res.render('operation/site/index',{
            info:req.query.info,
            error:req.query.error,
            cities:result
        });
    });
});

router.post('/list.html',function(req,res){
    if (!rbaccore.haspermission('operation_site',req,res)){
        return;
    }
    var tabledefinition = {
        sSelectSql:'t_sites.updatetime updatetime,t_sites.id id,t_sites.site site,t_cities.city city,t_sites.cityid cityid,t_sites.address address,t_staffs.showname showname,t_staffs.mobile mobile',
        sFromSql:'t_sites left join t_cities on t_sites.cityid = t_cities.id left join t_staffs on t_sites.admin = t_staffs.username',
        sCountColumnName:'t_sites.id',
        aoColumnDefs: [
            { mData: 'site', bSearchable: true },
            { mData: 'address', bSearchable: false},
            { mData: 'city', bSearchable: false },
            { mData: 'showname', bSearchable: false},
            { mData: 'updatetime', bSearchable: false},
            { mData: null, bSearchable: false},
            { mData: 'id', bSearchable: false},
            { mData: 'cityid', bSearchable: true},
            { mData: 'mobile', bSearchable: false}
        ]};
    return dataquery.pagedata(tabledefinition,req,res);
});

router.get('/add.html',function(req,res){
    if (!rbaccore.haspermission('operation_site_add',req,res)){
        return;
    }
    db.query('select id,city,lng,lat from t_cities where opened = 1',function(err,result){
        if (err){
            console.error('在数据库获取所有开放运营的城市失败',err);
        }
        return res.render('operation/site/add',{
            cities:result,
            error:req.query.error
        });
    });
});

router.post('/add.html',function(req,res){
    if (!rbaccore.haspermission('operation_site_add',req,res)){
        return;
    }
    var site = req.body.site;
    if (!site){
        return res.render('operation/site/add',{
            error:'无效的配送点名称'
        });
    }
    var cityid = req.body.cityid;
    if (!cityid){
        return res.render('operation/site/add',{
            error:'无效的配送点所属城市'
        });
    }
    var admin = req.body.admin;
    if (!admin){
        return res.render('operation/site/add',{
            error:'无效的配送点管理员'
        });
    }
    var address = req.body.address;
    if (!address){
        return res.render('operation/site/add',{
            error:'无效的配送点地址'
        });
    }
    var zones = req.body.zones;
    if (!zones){
        return res.render('operation/site/add',{
            error:'无效的配送点覆盖范围'
        });
    }
    var persons = req.body.persons;
    if (!persons){
        return res.render('operation/site/add',{
            error:'无效的配送点人员分配'
        });
    }
    return db.getConnection(function(err,connection){
        if (err){
            console.error('在数据库连接池获取连接失败',err);
            return res.render('operation/site/add',{
                error:'增加配送点失败'
            });
        }
        return connection.beginTransaction(function(err){
            if (err){
                console.error('数据库开始执行事务失败',err);
                connection.release();
                return res.render('operation/site/add',{
                    error:'增加配送点失败'
                });
            }
            return async.waterfall([
                function(insert_site){
                    connection.query('insert into t_sites (site,cityid,address,lng,lat,admin,updatetime) values (?,?,?,?,?,?,now())',[site,cityid,address,req.body.lng,req.body.lat,admin],function(err,result){
                        if (err){
                            insert_site(err);
                        } else {
                            insert_site(null,result.insertId);
                        }
                    });
                },
                function(siteid,insert_sitezone){
                    var zonearray = zones.split(',');
                    async.forEach(zonearray,function(item,callback){
                        connection.query('insert into t_sites_zone (siteid,zoneid,updatetime) values (?,?,now())',[siteid,item],function(err){
                            callback(err);
                        });
                    },function(err){
                        if (err){
                            insert_sitezone(err);
                        } else {
                            insert_sitezone(null,siteid);
                        }
                    });
                },
                function(siteid,insert_sitestaff){
                    var personarray = persons.split(',');
                    async.forEach(personarray,function(item,callback){
                        connection.query('insert into t_sites_staff (siteid,username,updatetime) values (?,?,now())',[siteid,item],function(err){
                            callback(err);
                        });
                    },function(err){
                        insert_sitestaff(err);
                    });
                }
            ],function(err){
                if (err) {
                    console.error('在数据库增加配送点时出错回滚',err);
                    return connection.rollback(function(err){
                        if (err){
                            console.error('数据库出错回滚错误',err);
                        }
                        connection.release();
                        return res.render('operation/site/add',{
                            error:'增加配送点失败'
                        });
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
                            return res.render('operation/site/add',{
                                error:'增加配送点失败'
                            });
                        });
                    }
                    connection.release();
                    return res.redirect('/operation/site/?info=增加配送点' + site + '成功');
                });
            });
        });
    });
});

router.get('/edit.html',function(req,res){
    if (!rbaccore.haspermission('operation_site_edit',req,res)){
        return;
    }
    var siteid = req.query.siteid;
    if (!siteid){
        return res.redirect('/operation/site/?error=编辑配送点错误');
    }
    async.parallel({
        cities:function(callback){
            db.query('select id,city,lng,lat from t_cities where opened = 1',function(err,result){
                callback(err,result);
            });
        },
        site:function(callback){
            db.query('select id,site,cityid,address,lng,lat,admin from t_sites where id = ?',[siteid],function(err,result){
                if (err){
                    return callback(err);
                }
                if (result.length == 0){
                    return callback('无效的配送点');
                }
                return callback(null,result[0]);
            });
        },
        sitezones:function(callback){
            db.query('select zoneid from t_sites_zone where siteid = ?',[siteid],function(err,result){
                if (err){
                    return callback(err);
                }
                var array = [];
                for (var i = 0; i < result.length;i++){
                    array.push(result[i].zoneid);
                }
                return callback(null,array.join(','));
            });
        },
        sitestaffs:function(callback){
            db.query('select username from t_sites_staff where siteid = ?',[siteid],function(err,result){
                if (err){
                    return callback(err);
                }
                var array = [];
                for (var i = 0; i < result.length;i++){
                    array.push(result[i].username);
                }
                return callback(null,array.join(','));
            });
        }
    },function(err,result){
        if (err){
            console.error('在数据库编辑配送点获取数据错误',err);
            return res.redirect('/operation/site/?error=编辑配送点错误');
        }
        return res.render('operation/site/edit',{
            cities:result.cities,
            site:result.site,
            sitezones:result.sitezones,
            sitestaffs:result.sitestaffs,
            error:req.query.error
        });
    });
});

router.post('/edit.html',function(req,res){
    if (!rbaccore.haspermission('operation_site_edit',req,res)){
        return;
    }
    var siteid = req.body.siteid;
    if (!siteid){
        return res.redirect('/operation/site/?error=无法编辑配送点');
    }
    var site = req.body.site;
    if (!site){
        return res.redirect('/operation/site/edit.html?siteid=' + siteid + '&error=无效的配送点名称');
    }
    var cityid = req.body.cityid;
    if (!cityid){
        return res.redirect('/operation/site/edit.html?siteid=' + siteid + '&error=无效的配送点所属城市');
    }
    var admin = req.body.admin;
    if (!admin){
        return res.redirect('/operation/site/edit.html?siteid=' + siteid + '&error=无效的配送点管理员');
    }
    var address = req.body.address;
    if (!address){
        return res.redirect('/operation/site/edit.html?siteid=' + siteid + '&error=无效的配送点地址');
    }
    var zones = req.body.zones;
    if (!zones){
        return res.redirect('/operation/site/edit.html?siteid=' + siteid + '&error=无效的配送点覆盖范围');
    }
    var persons = req.body.persons;
    if (!persons){
        return res.redirect('/operation/site/edit.html?siteid=' + siteid + '&error=无效的配送点人员分配');
    }
    return db.getConnection(function(err,connection){
        if (err){
            console.error('在数据库连接池获取连接失败',err);
            return res.redirect('/operation/site/edit.html?siteid=' + siteid + '&error=编辑配送点失败');
        }
        return connection.beginTransaction(function(err){
            if (err){
                console.error('数据库开始执行事务失败',err);
                connection.release();
                return res.redirect('/operation/site/edit.html?siteid=' + siteid + '&error=编辑配送点失败');
            }
            return async.series([
                function(update_site){
                    connection.query('update t_sites set site=?,cityid=?,address=?,lng=?,lat=?,admin=?,updatetime=now() where id = ?',[site,cityid,address,req.body.lng,req.body.lat,admin,siteid],function(err){
                        update_site(err);
                    });
                },
                function(delete_sitezone){
                    connection.query('delete from t_sites_zone where siteid = ?',[siteid],function(err){
                        delete_sitezone(err);
                    });
                },
                function(delete_sitestaff){
                    connection.query('delete from t_sites_staff where siteid = ?',[siteid],function(err){
                        delete_sitestaff(err);
                    });
                },
                function(insert_sitezone){
                    var zonearray = zones.split(',');
                    async.forEach(zonearray,function(item,callback){
                        connection.query('insert into t_sites_zone (siteid,zoneid,updatetime) values (?,?,now())',[siteid,item],function(err){
                            callback(err);
                        });
                    },function(err){
                        insert_sitezone(err);
                    });
                },
                function(insert_sitestaff){
                    var personarray = persons.split(',');
                    async.forEach(personarray,function(item,callback){
                        connection.query('insert into t_sites_staff (siteid,username,updatetime) values (?,?,now())',[siteid,item],function(err){
                            callback(err);
                        });
                    },function(err){
                        insert_sitestaff(err);
                    });
                }
            ],function(err){
                if (err) {
                    console.error('在数据库编辑配送点时出错回滚',err);
                    return connection.rollback(function(err){
                        if (err){
                            console.error('数据库出错回滚错误',err);
                        }
                        connection.release();
                        return res.redirect('/operation/site/edit.html?siteid=' + siteid + '&error=编辑配送点失败');
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
                            return res.redirect('/operation/site/edit.html?siteid=' + siteid + '&error=编辑配送点失败');
                        });
                    }
                    connection.release();
                    return res.redirect('/operation/site/?info=编辑配送点' + site + '成功');
                });
            });
        });
    });
});

router.get('/del.html',function(req,res){
    if (!rbaccore.haspermission('operation_site_del',req,res)){
        return;
    }
    var siteid = req.query.siteid;
    if (!siteid){
        return res.redirect('/operation/site/?error=无法删除配送点');
    }
    return db.getConnection(function(err,connection){
        if (err){
            console.error('在数据库连接池获取连接失败',err);
            return res.redirect('/operation/site/?error=删除配送点失败');
        }
        return connection.beginTransaction(function(err){
            if (err){
                console.error('数据库开始执行事务失败',err);
                connection.release();
                return res.redirect('/operation/site/?error=删除配送点失败');
            }
            return async.series([
                function(delete_site){
                    connection.query('delete from t_sites where id = ?',[siteid],function(err){
                        delete_site(err);
                    });
                },
                function(delete_sitezone){
                    connection.query('delete from t_sites_zone where siteid = ?',[siteid],function(err){
                        delete_sitezone(err);
                    });
                },
                function(delete_sitestaff){
                    connection.query('delete from t_sites_staff where siteid = ?',[siteid],function(err){
                        delete_sitestaff(err);
                    });
                }
            ],function(err){
                if (err) {
                    console.error('在数据库编辑配送点时出错回滚',err);
                    return connection.rollback(function(err){
                        if (err){
                            console.error('数据库出错回滚错误',err);
                        }
                        connection.release();
                        return res.redirect('/operation/site/?error=删除配送点失败');
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
                            return res.redirect('/operation/site/?error=删除配送点失败');
                        });
                    }
                    connection.release();
                    return res.redirect('/operation/site/?info=删除配送点成功');
                });
            });
        });
    });
});

module.exports = router;

