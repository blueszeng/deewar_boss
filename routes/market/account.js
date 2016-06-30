/**
 * Created by jimmychou on 15/1/8.
 */
var express = require('express');
var db = require('../../services/db');
var async = require('async');
var dataquery = require('../../services/web/dataquery');
var rbaccore = require('../../services/rbac/core');
var encodeutil = require('../../utils/encode');
var router = express.Router();

router.get('/',function(req,res){
    if (!rbaccore.haspermission('market_account',req,res)){
        return;
    }
    db.query('select id,city from t_cities where opened = 1',function(err,result){
        if (err){
            console.error('在数据库获取所有开放运营的城市失败',err);
        }
        return res.render('market/account/index',{
            info:req.query.info,
            error:req.query.error,
            cities:result
        });
    });
});

router.post('/list.html',function(req,res){
    if (!rbaccore.haspermission('market_account',req,res)){
        return;
    }
    var tabledefinition = {
        sSelectSql:'t_sales.username username,t_staffs.showname showname,t_staffs.mobile mobile,zones.zone,t_sales.updatetime updatetime,t_cities.city cityid,t_cities.city city',
        sFromSql:'t_sales left join t_staffs on t_sales.username = t_staffs.username left join t_cities on t_sales.cityid = t_cities.id left join (select t_sales_zone.username,GROUP_CONCAT(CONCAT(t_zones.zone,\'(\',t_districts.district,\')\')) zone from t_sales_zone left join t_zones on t_sales_zone.zoneid = t_zones.id left join t_districts on t_zones.districtid = t_districts.id group by t_sales_zone.username) zones on zones.username = t_sales.username',
        sCountColumnName:'t_sales.username',
        aoColumnDefs: [
            { mData: 'username', bSearchable: true },
            { mData: 'showname', bSearchable: true },
            { mData: 'mobile', bSearchable: true },
            { mData: 'city', bSearchable: false },
            { mData: 'zone', bSearchable: false },
            { mData: 'updatetime', bSearchable: false},
            { mData: null, bSearchable: false},
            { mData: 'cityid', bSearchable: true },
            { mData: 't_sales.username', bSearchable: true }
        ]};
    return dataquery.pagedata(tabledefinition,req,res);
});

router.get('/add.html',function(req,res){
    if (!rbaccore.haspermission('market_account_add',req,res)){
        return;
    }
    db.query('select id,city,lng,lat from t_cities where opened = 1',function(err,result){
        if (err){
            console.error('在数据库获取所有开放运营的城市失败',err);
        }
        return res.render('market/account/add',{
            cities:result,
            error:req.query.error
        });
    });
});

router.post('/add.html',function(req,res){
    if (!rbaccore.haspermission('market_account_add',req,res)){
        return;
    }
    var username = req.body.username;
    if (!username){
        return res.render('market/account/add',{
            error:'无效的用户名'
        });
    }
    var showname = req.body.showname;
    if (!showname){
        return res.render('market/account/add',{
            error:'无效的姓名'
        });
    }
    var password = req.body.password;
    if (!password){
        return res.render('market/account/add',{
            error:'无效的登录密码'
        });
    }
    var mobile = req.body.mobile;
    if (!mobile){
        return res.render('market/account/add',{
            error:'无效的手机号码'
        });
    }
    var cityid = req.body.cityid;
    if (!cityid){
        return res.render('market/account/add',{
            error:'无效的营销城市'
        });
    }
    var zones = req.body.zones;
    if (!zones){
        return res.render('market/account/add',{
            error:'无效的营销区域'
        });
    }
    return db.query('select username from t_staffs where username = ?',[username],function(err,result){
        if (err){
            console.error('在数据库查询用户名是否重复错误',err);
            return res.render('market/account/add',{
                error:'新增营销专员失败'
            });
        }
        if (result.length > 0){
            return res.render('market/account/add',{
                error:'已经存在的用户名'
            });
        }
        return db.getConnection(function(err,connection){
            if (err){
                console.error('在数据库连接池获取连接失败',err);
                return res.render('market/account/add',{
                    error:'新增营销专员失败'
                });
            }
            return connection.beginTransaction(function(err){
                if (err){
                    console.error('数据库开始执行事务失败',err);
                    connection.release();
                    return res.render('market/account/add',{
                        error:'新增营销专员失败'
                    });
                }
                return async.series([
                    function(insert_staff){
                        connection.query('insert into t_staffs (username,showname,password,mobile,remark,updatetime) values (?,?,?,?,?,now())',[username,showname,encodeutil.md5(password),mobile,'营销专员'],function(err){
                            insert_staff(err);
                        });
                    },
                    function(insert_roles){
                        connection.query('insert into t_staffs_role (username,rolename) values (?,?)',[username,'营销专员'],function(err){
                            insert_roles(err);
                        });
                    },
                    function(insert_sales){
                        connection.query('insert into t_sales (username,cityid,updatetime) values (?,?,now())',[username,cityid],function(err){
                            insert_sales(err);
                        });
                    },
                    function(insert_zones){
                        var zonearray = zones.split(',');
                        async.forEach(zonearray,function(item,callback){
                            connection.query('insert into t_sales_zone (username,zoneid,updatetime) values (?,?,now())',[username,item],function(err){
                                callback(err);
                            });
                        },function(err){
                            insert_zones(err);
                        });
                    }
                ],function(err){
                    if (err) {
                        console.error('在数据库插入新的营销人员时出错回滚',err);
                        return connection.rollback(function(err){
                            if (err){
                                console.error('数据库出错回滚错误',err);
                            }
                            connection.release();
                            return res.render('market/account/add',{
                                error:'新增营销专员失败'
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
                                return res.render('market/account/add',{
                                    error:'新增营销专员失败'
                                });
                            });
                        }
                        connection.release();
                        return res.redirect('/market/account/?info=新增营销专员' + showname + '成功');
                    });
                });
            });
        });
    });
});

router.get('/edit.html',function(req,res){
    if (!rbaccore.haspermission('market_account_edit',req,res)){
        return;
    }
    var username = req.query.username;
    if (!username){
        return res.redirect('/market/account/?error=无法编辑营销专员');
    }
    return async.parallel({
        staff:function(callback){
            db.query('select * from t_staffs where username = ?',[username],function(err,result){
                if (err){
                    return callback(err);
                }
                if (result.length == 0){
                    return callback('无法找到用户');
                }
                return callback(null,result[0]);
            });
        },
        cities:function(callback){
            db.query('select id,city,lng,lat from t_cities where opened = 1',function(err,result){
                callback(err,result);
            });
        },
        sales:function(callback){
            db.query('select * from t_sales where username = ?',[username],function(err,result){
                if (err){
                    return callback(err);
                }
                if (result.length == 0){
                    return callback('无效的营销专员');
                }
                return callback(null,result[0]);
            });
        },
        zones:function(callback){
            db.query('select zoneid from t_sales_zone where username = ?',[username],function(err,result){
                if (err){
                    return callback(err);
                }
                var array = [];
                for (var i = 0; i < result.length;i++){
                    array.push(result[i].zoneid);
                }
                return callback(null,array.join(','));
            });
        }
    },function(err,results){
        if (err){
            console.error('在数据库查找营销专员失败',err);
            return res.redirect('/market/account/?error=无法编辑营销专员' + username);
        }
        return res.render('market/account/edit',{
            staff:results.staff,
            sales:results.sales,
            cities:results.cities,
            zones:results.zones,
            error:req.query.error
        });
    });
});

router.post('/edit.html',function(req,res){
    if (!rbaccore.haspermission('market_account_edit',req,res)){
        return;
    }
    var username = req.body.username;
    if (!username){
        return res.redirect('/market/account/?error=无法编辑人员');
    }
    var showname = req.body.showname;
    if (!showname){
        return res.redirect('/market/account/edit.html?username=' + username + '&error=姓名不能为空');
    }
    var password = req.body.password;
    if (!password){
        return res.redirect('/market/account/edit.html?username=' + username + '&error=登录密码不能为空');
    }
    var mobile = req.body.mobile;
    if (!mobile){
        return res.redirect('/market/account/edit.html?username=' + username + '&error=手机号码不能为空');
    }
    var cityid = req.body.cityid;
    if (!cityid){
        return res.redirect('/market/account/edit.html?username=' + username + '&error=请选择营销城市');
    }
    var zones = req.body.zones;
    if (!zones){
        return res.redirect('/market/account/edit.html?username=' + username + '&error=请选择营销区域');
    }
    return db.query('select * from t_staffs where username = ?',[username],function(err,result){
        if (err){
            console.error('在数据库中查询营销人员失败',err);
            return res.redirect('/market/account/edit.html?username=' + username + '&error=编辑营销专员失败');
        }
        if (result.length == 0){
            return res.redirect('/market/account/edit.html?username=' + username + '&error=编辑营销专员失败');
        }
        return db.getConnection(function(err,connection){
            if (err){
                console.error('在数据库连接池获取连接失败',err);
                return res.redirect('/market/account/edit.html?username=' + username + '&error=编辑营销专员失败');
            }
            return connection.beginTransaction(function(err){
                if (err){
                    console.error('数据库开始执行事务失败',err);
                    connection.release();
                    return res.redirect('/market/account/edit.html?username=' + username + '&error=编辑营销专员失败');
                }
                return async.series([
                    function(update_staff){
                        if (password == 'changeme'){
                            connection.query('update t_staffs set showname = ?,mobile = ?,remark = ?,updatetime = now() where username = ?',[showname,mobile,'营销专员',username],function(err){
                                update_staff(err);
                            });
                        } else {
                            connection.query('update t_staffs set password = ?,showname = ?,mobile = ?,remark = ?,updatetime = now() where username = ?',[encodeutil.md5(password),showname,mobile,'营销专员',username],function(err){
                                update_staff(err);
                            });
                        }
                    },
                    function(delete_oldrole){
                        connection.query('delete from t_staffs_role where username = ?',[username],function(err){
                            delete_oldrole(err);
                        })
                    },
                    function(insert_roles){
                        connection.query('insert into t_staffs_role (username,rolename) values (?,?)',[username,'营销专员'],function(err){
                            insert_roles(err);
                        });
                    },
                    function(update_sales){
                        connection.query('update t_sales set cityid = ?,updatetime = now() where username = ?',[cityid,username],function(err){
                            update_sales(err);
                        });
                    },
                    function(delete_zones){
                        connection.query('delete from t_sales_zone where username = ?',[username],function(err){
                            delete_zones(err);
                        })
                    },
                    function(insert_zones){
                        var zonearray = zones.split(',');
                        async.forEach(zonearray,function(item,callback){
                            connection.query('insert into t_sales_zone (username,zoneid,updatetime) values (?,?,now())',[username,item],function(err){
                                callback(err);
                            });
                        },function(err){
                            insert_zones(err);
                        });
                    }
                ],function(err){
                    if (err) {
                        console.error('在数据库编辑营销专员时出错回滚',err);
                        return connection.rollback(function(err){
                            if (err){
                                console.error('数据库出错回滚错误',err);
                            }
                            connection.release();
                            return res.redirect('/market/account/edit.html?username=' + username + '&error=编辑营销专员失败');
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
                                return res.redirect('/market/account/edit.html?username=' + username + '&error=编辑营销专员失败');
                            });
                        }
                        connection.release();
                        return res.redirect('/market/account/?info=编辑营销专员' + username + '成功');
                    });
                });
            });
        });
    });
});

router.get('/del.html',function(req,res){
    if (!rbaccore.haspermission('market_account_del',req,res)){
        return;
    }
    var username = req.query.username;
    if (!username){
        return res.redirect('/market/account/?error=无法删除营销专员');
    }
    return db.getConnection(function(err,connection){
        if (err){
            console.error('在数据库连接池获取连接失败',err);
            return res.redirect('/market/account/?error=删除营销专员失败');
        }
        return connection.beginTransaction(function(err){
            if (err){
                console.error('数据库开始执行事务失败',err);
                connection.release();
                return res.redirect('/market/account/?error=删除营销专员失败');
            }
            return async.series([
                function(delete_staff){
                    connection.query('delete from t_staffs where username = ?',[username],function(err){
                        delete_staff(err);
                    });
                },
                function(delete_staffrole){
                    connection.query('delete from t_staffs_role where username = ?',[username],function(err){
                        delete_staffrole(err);
                    });
                },
                function(delete_sales){
                    connection.query('delete from t_sales where username = ?',[username],function(err){
                        delete_sales(err);
                    });
                },
                function(delete_zones){
                    connection.query('delete from t_sales_zone where username = ?',[username],function(err){
                        delete_zones(err);
                    });
                }
            ],function(err){
                if (err) {
                    console.error('在数据库删除营销专员时出错回滚',err);
                    return connection.rollback(function(err){
                        if (err){
                            console.error('数据库出错回滚错误',err);
                        }
                        connection.release();
                        return res.redirect('/market/account/?error=删除营销专员失败');
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
                            return res.redirect('/market/account/?error=删除营销专员失败');
                        });
                    }
                    connection.release();
                    return res.redirect('/market/account/?info=删除营销专员' + username + '成功');
                });
            });
        });
    });
});

router.get('/query.html',function(req,res){
    var q = req.query.q;
    if (!q){
        return res.json([]);
    }
    return db.query('select t_sales.username id,CONCAT(showname,\'(\',IFNULL(mobile,\'未设置电话\'),\')\') text from t_sales left join t_staffs on t_sales.username = t_staffs.username where t_sales.username like \'' + q + '%\' or showname like \'' + q + '%\' limit 30',function(err,result){
        if (err){
            console.error('在数据库中模糊查询人员错误',err);
            return res.json([]);
        }
        return res.json(result);
    });
});

router.get('/select.html',function(req,res){
    var q = req.query.q;
    if (!q){
        return res.json();
    }
    return db.query('select t_sales.username id,CONCAT(showname,\'(\',IFNULL(mobile,\'未设置电话\'),\')\') text from t_sales left join t_staffs on t_sales.username = t_staffs.username where t_sales.username = ?',[q],function(err,result){
        if (err){
            console.error('在数据库中查询人员错误',err);
            return res.json();
        }
        if (result.length == 0){
            return res.json();
        }
        return res.json(result[0]);
    });
});

module.exports = router;