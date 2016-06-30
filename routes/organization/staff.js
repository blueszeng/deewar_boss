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
    if (!rbaccore.haspermission('organization_staff',req,res)){
        return;
    }
    return res.render('organization/staff/index',{
        info:req.query.info,
        error:req.query.error
    });
});

router.post('/list.html',function(req,res){
    if (!rbaccore.haspermission('organization_staff',req,res)){
        return;
    }
    var tabledefinition = {
        sTableName: 't_staffs',
        sCountColumnName:'username',
        aoColumnDefs: [
            { mData: 'username', bSearchable: true },
            { mData: 'showname', bSearchable: true },
            { mData: 'mobile', bSearchable: true },
            { mData: 'email', bSearchable: true },
            { mData: 'remark', bSearchable: false },
            { mData: 'updatetime', bSearchable: false},
            { mData: null, bSearchable: false}
        ]};
    return dataquery.pagedata(tabledefinition,req,res);
});

router.get('/add.html',function(req,res){
    if (!rbaccore.haspermission('organization_staff_add',req,res)){
        return;
    }
    db.query('select name from t_roles',function(err,result){
        if (err){
            console.error('在数据库中获取所有的角色失败',err);
            return res.redirect('/organization/staff/?error=无法新增人员');
        }
        var array = [];
        for (var i = 0; i < result.length;i++){
            array.push(result[i].name);
        }
        return res.render('organization/staff/add',{
            rolenames:array.join(',')
        });
    });
});

router.post('/add.html',function(req,res){
    if (!rbaccore.haspermission('organization_staff_add',req,res)){
        return;
    }
    var username = req.body.username;
    if (!username){
        return res.render('organization/staff/add',{
            error:'无效的用户名'
        });
    }
    var showname = req.body.showname;
    if (!username){
        return res.render('organization/staff/add',{
            error:'无效的姓名'
        });
    }
    var password = req.body.password;
    if (!password){
        return res.render('organization/staff/add',{
            error:'无效的登录密码'
        });
    }
    return db.query('select username from t_staffs where username = ?',[username],function(err,result){
        if (err){
            console.error('在数据库查询用户名是否重复错误',err);
            return res.render('organization/staff/add',{
                error:'新增人员失败'
            });
        }
        if (result.length > 0){
            return res.render('organization/staff/add',{
                error:'已经存在的用户名'
            });
        }
        var remark = req.body.remark;
        var mobile = req.body.mobile;
        var email = req.body.email;
        var rolenames = req.body.rolenames;
        return db.getConnection(function(err,connection){
            if (err){
                console.error('在数据库连接池获取连接失败',err);
                return res.render('organization/staff/add',{
                    error:'新增人员失败'
                });
            }
            return connection.beginTransaction(function(err){
                if (err){
                    console.error('数据库开始执行事务失败',err);
                    connection.release();
                    return res.render('organization/staff/add',{
                        error:'新增人员失败'
                    });
                }
                return async.series([
                    function(insert_staff){
                        connection.query('insert into t_staffs (username,showname,password,mobile,email,remark,updatetime) values (?,?,?,?,?,?,now())',[username,showname,encodeutil.md5(password),mobile,email,remark],function(err){
                            insert_staff(err);
                        });
                    },
                    function(insert_roles){
                        if (rolenames && rolenames.length > 0){
                            var rolenamearray = rolenames.split(',');
                            async.forEach(rolenamearray,function(item,callback){
                                connection.query('insert into t_staffs_role (username,rolename) values (?,?)',[username,item],function(err){
                                    callback(err);
                                });
                            },function(err){
                                insert_roles(err);
                            });
                        } else {
                            insert_roles(null);
                        }
                    }
                ],function(err){
                    if (err) {
                        console.error('在数据库插入新的人员时出错回滚',err);
                        return connection.rollback(function(err){
                            if (err){
                                console.error('数据库出错回滚错误',err);
                            }
                            connection.release();
                            return res.render('organization/staff/add',{
                                error:'新增人员失败'
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
                                return res.render('organization/staff/add',{
                                    error:'新增人员失败'
                                });
                            });
                        }
                        connection.release();
                        return res.redirect('/organization/staff/?info=新增人员' + showname + '成功');
                    });
                });
            });
        });
    });
});

router.get('/edit.html',function(req,res){
  // return res.redirect('/organization/player');
    if (!rbaccore.haspermission('organization_staff_edit',req,res)){
        return;
    }
    var username = req.query.username;
    if (!username){
        return res.redirect('/organization/staff/?error=无法编辑人员');
    }
    if (username == 'admin'){
        return res.redirect('/organization/staff/?error=不能编辑系统管理员');
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
        staffrole:function(callback){
            db.query('select rolename from t_staffs_role where username = ?',[username],function(err,result){
                if (err){
                    return callback(err);
                }
                var roles = [];
                for (var i = 0;i < result.length;i++){
                    roles.push(result[i].rolename);
                }
                callback(null,roles.join(','));
            });
        },
        allrole:function(callback){
            db.query('select name from t_roles',function(err,result){
                if (err){
                    return callback(err);
                }
                var roles = [];
                for (var i = 0;i < result.length;i++){
                    roles.push(result[i].name);
                }
                callback(null,roles.join(','));
            });
        }
    },function(err,results){
        if (err){
            console.error('在数据库查找人员失败',err);
            return res.redirect('/organization/staff/?error=无法编辑人员' + username);
        }
        return res.render('organization/staff/edit',{
            staff:results.staff,
            staffroles:results.staffrole,
            roles:results.allrole,
            error:req.query.error
        });
    });
});

router.post('/edit.html',function(req,res){
    if (!rbaccore.haspermission('organization_staff_edit',req,res)){
        return;
    }
    var username = req.body.username;
    if (!username){
        return res.redirect('/organization/staff/?error=无法编辑人员');
    }
    var showname = req.body.showname;
    if (!showname){
        return res.redirect('/organization/staff/edit.html?username=' + username + '&error=姓名不能为空');
    }
    var password = req.body.password;
    if (!password){
        return res.redirect('/organization/staff/edit.html?username=' + username + '&error=登录密码不能为空');
    }
    return db.query('select * from t_staffs where username = ?',[username],function(err,result){
        if (err){
            console.error('在数据库中查询人员失败',err);
            return res.redirect('/organization/staff/edit.html?username=' + username + '&error=编辑人员失败');
        }
        if (result.length == 0){
            return res.redirect('/organization/staff/edit.html?username=' + username + '&error=编辑人员失败');
        }
        return db.getConnection(function(err,connection){
            if (err){
                console.error('在数据库连接池获取连接失败',err);
                return res.redirect('/organization/staff/edit.html?username=' + username + '&error=编辑人员失败');
            }
            return connection.beginTransaction(function(err){
                if (err){
                    console.error('数据库开始执行事务失败',err);
                    connection.release();
                    return res.redirect('/organization/staff/edit.html?username=' + username + '&error=编辑人员失败');
                }
                return async.series([
                    function(update_staff){
                        if (password == 'changeme'){
                            connection.query('update t_staffs set showname = ?,mobile = ?,email = ?,remark = ?,updatetime = now() where username = ?',[showname,req.body.mobile,req.body.email,req.body.remark,username],function(err){
                                update_staff(err);
                            });
                        } else {
                            connection.query('update t_staffs set password = ?,showname = ?,mobile = ?,email = ?,remark = ?,updatetime = now() where username = ?',[encodeutil.md5(password),showname,req.body.mobile,req.body.email,req.body.remark,username],function(err){
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
                        var rolenames = req.body.rolenames;
                        if (rolenames && rolenames.length > 0){
                            var rolenamearray = rolenames.split(',');
                            async.forEach(rolenamearray,function(item,callback){
                                connection.query('insert into t_staffs_role (username,rolename) values (?,?)',[username,item],function(err){
                                    callback(err);
                                });
                            },function(err){
                                insert_roles(err);
                            });
                        } else {
                            insert_roles(null);
                        }
                    }
                ],function(err){
                    if (err) {
                        console.error('在数据库编辑人员时出错回滚',err);
                        return connection.rollback(function(err){
                            if (err){
                                console.error('数据库出错回滚错误',err);
                            }
                            connection.release();
                            return res.redirect('/organization/staff/edit.html?username=' + username + '&error=编辑人员失败');
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
                                return res.redirect('/organization/staff/edit.html?username=' + username + '&error=编辑人员失败');
                            });
                        }
                        connection.release();
                        return res.redirect('/organization/staff/?info=编辑人员' + username + '成功');
                    });
                });
            });
        });
    });
});

router.get('/del.html',function(req,res){
    if (!rbaccore.haspermission('organization_staff_del',req,res)){
        return;
    }
    var username = req.query.username;
    if (!username){
        return res.redirect('/organization/staff/?error=无法删除人员');
    }
    if (username == 'admin'){
        return res.redirect('/organization/staff/?error=无法删除系统管理员');
    }
    return db.getConnection(function(err,connection){
        if (err){
            console.error('在数据库连接池获取连接失败',err);
            return res.redirect('/organization/staff/?error=删除人员失败');
        }
        return connection.beginTransaction(function(err){
            if (err){
                console.error('数据库开始执行事务失败',err);
                connection.release();
                return res.redirect('/organization/staff/?error=删除人员失败');
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
                }
            ],function(err){
                if (err) {
                    console.error('在数据库删除人员时出错回滚',err);
                    return connection.rollback(function(err){
                        if (err){
                            console.error('数据库出错回滚错误',err);
                        }
                        connection.release();
                        return res.redirect('/organization/staff/?error=删除人员失败');
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
                            return res.redirect('/organization/staff/?error=删除人员失败');
                        });
                    }
                    connection.release();
                    return res.redirect('/organization/staff/?info=删除人员' + username + '成功');
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
    return db.query('select username id,CONCAT(showname,\'(\',IFNULL(mobile,\'未设置电话\'),\')\') text from t_staffs where username like \'' + q + '%\' or showname like \'' + q + '%\' limit 30',function(err,result){
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
    return db.query('select username id,CONCAT(showname,\'(\',IFNULL(mobile,\'未设置电话\'),\')\') text from t_staffs where username = ?',[q],function(err,result){
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

router.get('/selectmulti.html',function(req,res){
    var q = req.query.q;
    if (!q){
        return res.json([]);
    }
    var usernames = q.split(',');
    var array = [];
    for (var i = 0;i < usernames.length;i++){
        array.push('username = \'' + usernames[i] + '\'');
    }
    var where;
    if (array.length == 1){
        where = array[0];
    } else {
        where = array.join(' OR ');
    }
    return db.query('select username id,CONCAT(showname,\'(\',IFNULL(mobile,\'未设置电话\'),\')\') text from t_staffs where ' + where,function(err,result){
        if (err){
            console.error('在数据库中查询人员错误',err);
            return res.json([]);
        }
        return res.json(result);
    });
});

module.exports = router;
