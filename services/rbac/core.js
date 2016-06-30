/**
 * Created by jimmychou on 15/1/7.
 */
var permission = require('./permission');

var db = require('../db');
var encodeutil = require('../../utils/encode');
var async = require('async');

var initpermission = function(parentname,permissions){
    if (permissions && permissions.length > 0){
        for (var i = 0;i < permissions.length;i++){
            var permit = permissions[i];
            var name;
            if (parentname == ''){
                name = permit.name;
            } else {
                name = parentname + '_' + permit.name;
            }
            db.query('insert into t_roles_permission (rolename,permissionname) values (?,?)',['系统管理',name],function(err){
                if (err){
                    console.error('向数据库初始化插入系统管理权限错误',err);
                }
            });
            if (permit.childs && permit.childs.length > 0){
                initpermission(name,permit.childs);
            }
        }
    }
};
var init = function(){
    var permissions = permission.list();
    return db.query('delete from t_roles_permission where rolename = ?',['系统管理'],function(err){
        if (err){
            return console.error('删除系统管理所有权限失败');
        }
        initpermission('',permissions);
        return db.getConnection(function(err,connection){
            if (err){
                console.error('在数据库连接池获取连接失败',err);
                return;
            }
            return connection.beginTransaction(function(err){
                if (err){
                    connection.release();
                    console.error('数据库开始执行事务失败',err);
                    return;
                }
                return async.series([
                    function(delete_role){
                        connection.query('delete from t_roles where name = ?',['系统管理'],function(err){
                            delete_role(err);
                        });
                    },
                    function(insert_role){
                        connection.query('insert into t_roles (name,remark,updatetime) values (?,?,now())',['系统管理','系统管理'],function(err){
                            insert_role(err);
                        });
                    },
                    function(delete_staff_role){
                        connection.query('delete from t_staffs_role where username = ?',['admin'],function(err){
                            delete_staff_role(err);
                        })
                    },
                    function(delete_staff){
                        connection.query('delete from t_staffs where username = ?',['admin'],function(err){
                            delete_staff(err);
                        })
                    },
                    function(insert_staff_role){
                        connection.query('insert into t_staffs_role (username,rolename) values (?,?)',['admin','系统管理'],function(err){
                            insert_staff_role(err);
                        });
                    },
                    function(insert_staff){
                        connection.query('insert into t_staffs (username,showname,password,email,remark,updatetime) values (?,?,?,?,?,now())',['admin','系统管理员',encodeutil.md5('123456'),'postmaster@junewinds.com','系统管理员'],function(err){
                            insert_staff(err);
                        })
                    }
                ],function(err){
                    if (err) {
                        console.error('在数据库执行事务出错回滚',err);
                        return connection.rollback(function(err){
                            if (err){
                                console.error('数据库出错回滚错误',err);
                            }
                            connection.release();
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
                            });
                        } else {
                            connection.release();
                            console.log('权限系统初始化成功');
                        }
                    });
                });
            });
        });
    });
};


var haspermission = function(permission,req,res){
    var permits = req.session.permits;
    var exits = false;
    if (typeof permission == 'object' && permission.constructor == Array){
        for (var i = 0;i < permission.length;i++){
            if (permits.indexOf(permission[i]) > -1){
                exits = true;
                break;
            }
        }
    } else if (typeof permission == 'string'){
        if (permits.indexOf(permission) > -1){
            exits = true;
        }
    }
    if (exits === true){
        return true;
    } else {
        res.render('error',{
            title:'禁止访问',
            message:'对不起，您没有操作该功能的权限'
        });
        return false;
    }
};


var  haspermissionjson = function(permission,req,res){
    var permits = req.session.permits;
    var exits = false;
    if (typeof permission == 'object' && permission.constructor == Array){
        for (var i = 0;i < permission.length;i++){
            if (permits.indexOf(permission[i]) > -1){
                exits = true;
                break;
            }
        }
    } else if (typeof permission == 'string'){
        if (permits.indexOf(permission) > -1){
            exits = true;
        }
    }
    if (exits === true){
        return true;
    } else {
        res.json({success:false,message:'对不起，您没有操作该功能的权限'});
        return false;
    }
};
module.exports.init = init;
module.exports.haspermission = haspermission;
module.exports.haspermissionjson = haspermissionjson;
