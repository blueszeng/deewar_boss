/**
 * Created by jimmychou on 15/6/25.
 */
var express = require('express');
var db = require('../../services/db');
var async = require('async');
var dataquery = require('../../services/web/dataquery');
var rbaccore = require('../../services/rbac/core');
var encodeutil = require('../../utils/encode');
var cloopenapi = require('../../services/cloopen/api');
var router = express.Router();

router.get('/',function(req,res){
    if (!rbaccore.haspermission('custom_account',req,res)){
        return;
    }
    return res.render('custom/account/index',{
        info:req.query.info,
        error:req.query.error
    });
});

router.post('/list.html',function(req,res){
    if (!rbaccore.haspermission('custom_account',req,res)){
        return;
    }
    var tabledefinition = {
        sSelectSql:'t_customs.agentid agentid,t_customs.username username,t_staffs.showname showname,t_staffs.mobile mobile,t_customs.accountsid accountsid,t_customs.voipaccount voipaccount,t_customs.updatetime updatetime',
        sFromSql:'t_customs left join t_staffs on t_customs.username = t_staffs.username',
        sCountColumnName:'t_customs.username',
        aoColumnDefs: [
            { mData: 'username', bSearchable: true },
            { mData: 'showname', bSearchable: true },
            { mData: 'mobile', bSearchable: true },
            { mData: 'agentid', bSearchable: false },
            { mData: 'accountsid', bSearchable: true },
            { mData: 'voipaccount', bSearchable: true },
            { mData: 'updatetime', bSearchable: false},
            { mData: null, bSearchable: false},
            { mData: 't_customs.username', bSearchable: true }
        ]};
    return dataquery.pagedata(tabledefinition,req,res);
});

router.get('/add.html',function(req,res){
    if (!rbaccore.haspermission('custom_account_add',req,res)){
        return;
    }
    return res.render('custom/account/add',{
        error:req.query.error
    });
});

router.post('/add.html',function(req,res){
    if (!rbaccore.haspermission('custom_account_add',req,res)){
        return;
    }
    var username = req.body.username;
    if (!username){
        return res.render('custom/account/add',{
            error:'无效的用户名'
        });
    }
    var showname = req.body.showname;
    if (!showname){
        return res.render('custom/account/add',{
            error:'无效的姓名'
        });
    }
    var password = req.body.password;
    if (!password){
        return res.render('custom/account/add',{
            error:'无效的登录密码'
        });
    }
    var mobile = req.body.mobile;
    if (!mobile){
        return res.render('custom/account/add',{
            error:'无效的手机号码'
        });
    }
    var agentid = req.body.agentid;
    if (!agentid){
        return res.render('custom/account/add',{
            error:'无效的座席号'
        });
    }
    return db.query('select username from t_staffs where username = ?',[username],function(err,result){
        if (err){
            console.error('在数据库查询用户名是否重复错误',err);
            return res.render('custom/account/add',{
                error:'新增客服专员失败'
            });
        }
        if (result.length > 0){
            return res.render('custom/account/add',{
                error:'已经存在的用户名'
            });
        }
        return db.query('select username from t_customs where agentid = ?',[agentid],function(err,result){
            if (err){
                console.error('在数据库查询座席号是否重复错误',err);
                return res.render('custom/account/add',{
                    error:'新增客服专员失败'
                });
            }
            if (result.length > 0){
                return res.render('custom/account/add',{
                    error:'已经存在的座席号'
                });
            }
            return db.getConnection(function(err,connection){
                if (err){
                    console.error('在数据库连接池获取连接失败',err);
                    return res.render('custom/account/add',{
                        error:'新增客服专员失败'
                    });
                }
                return connection.beginTransaction(function(err){
                    if (err){
                        console.error('数据库开始执行事务失败',err);
                        connection.release();
                        return res.render('custom/account/add',{
                            error:'新增客服专员失败'
                        });
                    }
                    return async.waterfall([
                        function(create_cloopenaccount){
                            cloopenapi.createaccount(username,function(err,createresult){
                                create_cloopenaccount(err,createresult);
                            });
                        },
                        function(voipinfo,insert_staff){
                            connection.query('insert into t_staffs (username,showname,password,mobile,remark,updatetime) values (?,?,?,?,?,now())',[username,showname,encodeutil.md5(password),mobile,'客服专员'],function(err){
                                insert_staff(err,voipinfo);
                            });
                        },
                        function(voipinfo,insert_roles){
                            connection.query('insert into t_staffs_role (username,rolename) values (?,?)',[username,'客服专员'],function(err){
                                insert_roles(err,voipinfo);
                            });
                        },
                        function(voipinfo,insert_custom){
                            connection.query('insert into t_customs (username,accountsid,accounttoken,voipaccount,voippwd,updatetime,agentid,status) values (?,?,?,?,?,now(),?,0)',[username,voipinfo.subAccountSid,voipinfo.subToken,voipinfo.voipAccount,voipinfo.voipPwd,agentid],function(err){
                                insert_custom(err);
                            });
                        }
                    ],function(err){
                        if (err) {
                            console.error('在数据库插入新的客服专员时出错回滚',err);
                            return connection.rollback(function(err){
                                if (err){
                                    console.error('数据库出错回滚错误',err);
                                }
                                connection.release();
                                return res.render('custom/account/add',{
                                    error:'新增客服专员失败'
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
                                    return res.render('custom/account/add',{
                                        error:'新增客服专员失败'
                                    });
                                });
                            }
                            connection.release();
                            return res.redirect('/custom/account/?info=新增客服专员' + showname + '成功');
                        });
                    });
                });
            });
        });
    });
});

router.get('/edit.html',function(req,res){
    if (!rbaccore.haspermission('custom_account_edit',req,res)){
        return;
    }
    var username = req.query.username;
    if (!username){
        return res.redirect('/custom/account/?error=无法编辑客服专员');
    }
    db.query('select * from t_customs left join t_staffs on t_customs.username = t_staffs.username where t_customs.username = ?',[username],function(err,result){
        if (err){
            console.error('在数据库查找客服专员失败',err);
            return res.redirect('/custom/account/?error=无法编辑客服专员' + username);
        }
        if (result.length == 0){
            return res.redirect('/custom/account/?error=无法编辑客服专员' + username);
        }
        return res.render('custom/account/edit',{
            custom:result[0],
            error:req.query.error
        });
    });
});

router.post('/edit.html',function(req,res){
    if (!rbaccore.haspermission('custom_account_edit',req,res)){
        return;
    }
    var username = req.body.username;
    if (!username){
        return res.redirect('/custom/account/?error=无法编辑人员');
    }
    var showname = req.body.showname;
    if (!showname){
        return res.redirect('/custom/account/edit.html?username=' + username + '&error=姓名不能为空');
    }
    var password = req.body.password;
    if (!password){
        return res.redirect('/custom/account/edit.html?username=' + username + '&error=登录密码不能为空');
    }
    var mobile = req.body.mobile;
    if (!mobile){
        return res.redirect('/custom/account/edit.html?username=' + username + '&error=手机号码不能为空');
    }
    var agentid = req.body.agentid;
    if (!agentid){
        return res.redirect('/custom/account/edit.html?username=' + username + '&error=座席号不能为空');
    }
    return db.query('select username from t_customs where agentid = ? and username != ?',[agentid,username],function(err,result){
        if (err){
            console.error('在数据库查询座席号是否重复错误',err);
            return res.redirect('/custom/account/edit.html?username=' + username + '&error=系统异常');
        }
        if (result.length > 0){
            return res.redirect('/custom/account/edit.html?username=' + username + '&error=该座席号已存在');
        }
        return db.getConnection(function(err,connection) {
            if (err) {
                console.error('在数据库连接池获取连接失败', err);
                return res.redirect('/custom/account/edit.html?username=' + username + '&error=编辑客服专员失败');
            }
            return connection.beginTransaction(function(err){
                if (err){
                    console.error('数据库开始执行事务失败',err);
                    connection.release();
                    return res.redirect('/custom/account/edit.html?username=' + username + '&error=编辑客服专员失败');
                }
                return async.series([
                    function(update_staff){
                        if (password == 'changeme'){
                            connection.query('update t_staffs set showname = ?,mobile = ?,remark = ?,updatetime = now() where username = ?',[showname,mobile,'客服专员',username],function(err){
                                update_staff(err);
                            });
                        } else {
                            connection.query('update t_staffs set password = ?,showname = ?,mobile = ?,remark = ?,updatetime = now() where username = ?',[encodeutil.md5(password),showname,mobile,'客服专员',username],function(err){
                                update_staff(err);
                            });
                        }
                    },
                    function(update_custom){
                        connection.query('update t_customs set agentid = ? where username = ?',[agentid,username],function(err){
                            update_custom(err);
                        });
                    }
                ],function(err){
                    if (err) {
                        console.error('在数据库编辑客服专员时出错回滚',err);
                        return connection.rollback(function(err){
                            if (err){
                                console.error('数据库出错回滚错误',err);
                            }
                            connection.release();
                            return res.redirect('/custom/account/edit.html?username=' + username + '&error=编辑客服专员失败');
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
                                return res.redirect('/custom/account/edit.html?username=' + username + '&error=编辑客服专员失败');
                            });
                        }
                        connection.release();
                        return res.redirect('/custom/account/?info=编辑客服专员' + username + '成功');
                    });
                });
            });
        });
    });
});

router.get('/restore.html',function(req,res){
    if (!rbaccore.haspermission('custom_account_edit',req,res)){
        return;
    }
    var username = req.query.username;
    if (!username){
        return res.redirect('/custom/account/?error=无法恢复客服专员座席状态');
    }
    db.query('select voipaccount,accountsid,agentid from t_customs where username = ?',[username],function(err,result) {
        if (err) {
            console.error('在数据库查询客服专员数据错误', err);
            return res.redirect('/custom/account/?error=无法恢复客服专员座席状态');
        }
        if (result.length == 0) {
            return res.redirect('/custom/account/?error=无法恢复客服专员座席状态');
        }
        var custom = result[0];
        cloopenapi.agentwork(custom.voipaccount,custom.agentid,function(err){
            if (err){
                return res.redirect('/custom/account/?error=恢复客服专员座席状态失败:' + err);
            }
            return res.redirect('/custom/account/?info=恢复客服专员座席状态成功');
        });
    });
});

router.get('/del.html',function(req,res){
    if (!rbaccore.haspermission('custom_account_del',req,res)){
        return;
    }
    var username = req.query.username;
    if (!username){
        return res.redirect('/custom/account/?error=无法删除客服专员');
    }
    db.query('select accountsid,agentid from t_customs where username = ?',[username],function(err,result){
        if (err){
            console.error('在数据库查询客服专员数据错误',err);
            return res.redirect('/custom/account/?error=删除客服专员失败');
        }
        if (result.length == 0){
            return res.redirect('/custom/account/?error=删除客服专员失败');
        }
        var custom = result[0];
        return db.getConnection(function(err,connection){
            if (err){
                console.error('在数据库连接池获取连接失败',err);
                return res.redirect('/custom/account/?error=删除客服专员失败');
            }
            return connection.beginTransaction(function(err){
                if (err){
                    console.error('数据库开始执行事务失败',err);
                    connection.release();
                    return res.redirect('/custom/account/?error=删除客服专员失败');
                }
                return async.series([
                    function(delete_cloopenaccount){
                        cloopenapi.agentrest(custom.voipaccount,custom.agentid,function(err){
                            if (err){
                                if (err != '错误：108027'){
                                    return delete_cloopenaccount(err);
                                }
                            }
                            return cloopenapi.deleteaccount(custom.accountsid,function(err){
                                delete_cloopenaccount(err);
                            });
                        });
                    },
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
                    function(delete_customs){
                        connection.query('delete from t_customs where username = ?',[username],function(err){
                            delete_customs(err);
                        });
                    }
                ],function(err){
                    if (err) {
                        console.error('在数据库删除客服专员时出错回滚',err);
                        return connection.rollback(function(err){
                            if (err){
                                console.error('数据库出错回滚错误',err);
                            }
                            connection.release();
                            return res.redirect('/custom/account/?error=删除客服专员失败');
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
                                return res.redirect('/custom/account/?error=删除客服专员失败');
                            });
                        }
                        connection.release();
                        return res.redirect('/custom/account/?info=删除客服专员' + username + '成功');
                    });
                });
            });
        });
    });

});


module.exports = router;