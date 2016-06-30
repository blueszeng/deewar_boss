/**
 * Created by jimmychou on 15/1/8.
 */
var express = require('express');
var db = require('../../services/db');
var async = require('async');
var permissionrbac = require('../../services/rbac/permission');
var rbaccore = require('../../services/rbac/core');
var dataquery = require('../../services/web/dataquery');
var router = express.Router();

router.get('/',function(req,res){
    if (!rbaccore.haspermission('organization_role',req,res)){
        return;
    }
    return res.render('organization/role/index',{
        info:req.query.info,
        error:req.query.error
    });
});

router.post('/list.html',function(req,res){
    if (!rbaccore.haspermission('organization_role',req,res)){
        return;
    }
    var tabledefinition = {
        sTableName: 't_roles',
        sCountColumnName:'name',
        aoColumnDefs: [
            { mData: 'name', bSearchable: true },
            { mData: 'remark', bSearchable: true },
            { mData: 'updatetime', bSearchable: false},
            { mData: null, bSearchable: false}
        ]};
    return dataquery.pagedata(tabledefinition,req,res);
});

router.get('/add.html',function(req,res){
    if (!rbaccore.haspermission('organization_role_add',req,res)){
        return;
    }
    return res.render('organization/role/add');
});

router.post('/add.html',function(req,res){
    if (!rbaccore.haspermission('organization_role_add',req,res)){
        return;
    }
    var rolename = req.body.rolename;
    if (!rolename){
        return res.render('organization/role/add',{
            error:'无效的角色名称'
        });
    }
    return db.query('select name from t_roles where name = ?',[rolename],function(err,result){
        if (err){
            console.error('在数据库查询角色名称是否重复错误',err);
            return res.render('organization/role/add',{
                error:'新增角色失败'
            });
        }
        if (result.length > 0){
            return res.render('organization/role/add',{
                error:'已经存在的角色名称'
            });
        }
        var remark = req.body.remark;
        var permissions = req.body.permissions;
        return db.getConnection(function(err,connection){
            if (err){
                console.error('在数据库连接池获取连接失败',err);
                return res.render('organization/role/add',{
                    error:'新增角色失败'
                });
            }
            return connection.beginTransaction(function(err){
                if (err){
                    console.error('数据库开始执行事务失败',err);
                    connection.release();
                    return res.render('organization/role/add',{
                        error:'新增角色失败'
                    });
                }
                return async.series([
                    function(insert_role){
                        connection.query('insert into t_roles (name,remark,updatetime) values (?,?,now())',[rolename,remark],function(err){
                            insert_role(err);
                        });
                    },
                    function(insert_permission){
                        var permitarray = permissions.split(',');
                        async.forEach(permitarray,function(item,callback){
                            connection.query('insert into t_roles_permission (rolename,permissionname) values (?,?)',[rolename,item],function(err){
                                callback(err);
                            });
                        },function(err){
                            insert_permission(err);
                        });
                    }
                ],function(err){
                    if (err) {
                        console.error('在数据库插入新的角色时出错回滚',err);
                        return connection.rollback(function(err){
                            if (err){
                                console.error('数据库出错回滚错误',err);
                            }
                            connection.release();
                            return res.render('organization/role/add',{
                                error:'新增角色失败'
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
                                return res.render('organization/role/add',{
                                    error:'新增角色失败'
                                });
                            });
                        }
                        connection.release();
                        return res.redirect('/organization/role/?info=新增角色' + rolename + '成功');
                    });
                });
            });
        });
    });
});

router.get('/edit.html',function(req,res){
    if (!rbaccore.haspermission('organization_role_edit',req,res)){
        return;
    }
    var rolename = req.query.rolename;
    if (!rolename){
        return res.redirect('/organization/role/?error=无法编辑角色');
    }
    if (rolename == '系统管理'){
        return res.redirect('/organization/role/?error=不能编辑系统管理角色');
    }
    return db.query('select * from t_roles where name = ?',[rolename],function(err,result){
        if (err){
            console.error('在数据库查找角色失败',err);
            return res.redirect('/organization/role/?error=无法编辑角色' + rolename);
        }
        if (result.length == 0){
            return res.redirect('/organization/role/?error=无法编辑角色' + rolename);
        }
        return res.render('organization/role/edit',{
            role:result[0],
            error:req.query.error
        });
    });
});

var editrole = function(oldrolename,rolename,remark,permissions,res){
    return db.getConnection(function(err,connection){
        if (err){
            console.error('在数据库连接池获取连接失败',err);
            return res.redirect('/organization/role/edit.html?rolename=' + oldrolename + '&error=编辑角色失败');
        }
        return connection.beginTransaction(function(err){
            if (err){
                console.error('数据库开始执行事务失败',err);
                connection.release();
                return res.redirect('/organization/role/edit.html?rolename=' + oldrolename + '&error=编辑角色失败');
            }
            return async.series([
                function(delete_oldrole){
                    connection.query('delete from t_roles where name = ?',[oldrolename],function(err){
                        delete_oldrole(err);
                    });
                },
                function(delete_oldrolepermission){
                    connection.query('delete from t_roles_permission where rolename = ?',[oldrolename],function(err){
                        delete_oldrolepermission(err);
                    })
                },
                function(insert_role){
                    connection.query('insert into t_roles (name,remark,updatetime) values (?,?,now())',[rolename,remark],function(err){
                        insert_role(err);
                    });
                },
                function(insert_permission){
                    var permitarray = permissions.split(',');
                    async.forEach(permitarray,function(item,callback){
                        connection.query('insert into t_roles_permission (rolename,permissionname) values (?,?)',[rolename,item],function(err){
                            callback(err);
                        });
                    },function(err){
                        insert_permission(err);
                    });
                },
                function(update_staffrole){
                    if (oldrolename == rolename){
                        update_staffrole(null);
                    } else {
                        connection.query('update t_staffs_role set rolename = ? where rolename = ?',[rolename,oldrolename],function(err){
                            update_staffrole(err);
                        });
                    }
                }
            ],function(err){
                if (err) {
                    console.error('在数据库编辑角色时出错回滚',err);
                    return connection.rollback(function(err){
                        if (err){
                            console.error('数据库出错回滚错误',err);
                        }
                        connection.release();
                        return res.redirect('/organization/role/edit.html?rolename=' + oldrolename + '&error=编辑角色失败');
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
                            return res.redirect('/organization/role/edit.html?rolename=' + oldrolename + '&error=编辑角色失败');
                        });
                    }
                    connection.release();
                    return res.redirect('/organization/role/?info=编辑角色' + rolename + '成功');
                });
            });
        });
    });
};

router.post('/edit.html',function(req,res){
    if (!rbaccore.haspermission('organization_role_edit',req,res)){
        return;
    }
    var oldrolename = req.body.oldrolename;
    if (!oldrolename){
        return res.redirect('/organization/role/?error=无法编辑角色');
    }
    var rolename = req.body.rolename;
    if (!rolename){
        return res.redirect('/organization/role/edit.html?rolename=' + oldrolename + '&error=角色名称不能为空');
    }
    if (oldrolename == rolename){
        editrole(oldrolename,rolename,req.body.remark,req.body.permissions,res);
    } else {
        db.query('select * from t_roles where name = ?',[rolename],function(err,result){
            if (err){
                console.error('在数据库中查询角色名称失败',err);
                return res.redirect('/organization/role/edit.html?rolename=' + oldrolename + '&error=编辑角色失败');
            }
            if (result.length > 0){
                return res.redirect('/organization/role/edit.html?rolename=' + oldrolename + '&error=新的角色名称已经存在');
            }
            editrole(oldrolename,rolename,req.body.remark,req.body.permissions,res);
        });
    }
});

router.get('/del.html',function(req,res){
    if (!rbaccore.haspermission('organization_role_del',req,res)){
        return;
    }
    var rolename = req.query.rolename;
    if (!rolename){
        return res.redirect('/organization/role/?error=无法删除角色');
    }
    if (rolename == '系统管理' || rolename == '营销专员'){
        return res.redirect('/organization/role/?error=不能删除系统内置角色');
    }
    return db.getConnection(function(err,connection){
        if (err){
            console.error('在数据库连接池获取连接失败',err);
            return res.redirect('/organization/role/?error=删除角色失败');
        }
        return connection.beginTransaction(function(err){
            if (err){
                console.error('数据库开始执行事务失败',err);
                connection.release();
                return res.redirect('/organization/role/?error=删除角色失败');
            }
            return async.series([
                function(delete_role){
                    connection.query('delete from t_roles where name = ?',[rolename],function(err){
                        delete_role(err);
                    });
                },
                function(delete_rolepermission){
                    connection.query('delete from t_roles_permission where rolename = ?',[rolename],function(err){
                        delete_rolepermission(err);
                    });
                },
                function(delete_staffrole){
                    connection.query('delete from t_staffs_role where rolename = ?',[rolename],function(err){
                        delete_staffrole(err);
                    });
                }
            ],function(err){
                if (err) {
                    console.error('在数据库删除角色时出错回滚',err);
                    return connection.rollback(function(err){
                        if (err){
                            console.error('数据库出错回滚错误',err);
                        }
                        connection.release();
                        return res.redirect('/organization/role/?error=删除角色失败');
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
                            return res.redirect('/organization/role/?error=删除角色失败');
                        });
                    }
                    connection.release();
                    return res.redirect('/organization/role/?info=删除角色' + rolename + '成功');
                });
            });
        });
    });
});


var formattree = function(parent,sourcetree,array){
    var result = [];
    for (var i = 0 ;i < sourcetree.length;i++){
        var node = sourcetree[i];
        var name;
        if (parent == ''){
            name = node.name;
        } else {
            name = parent + '_' + node.name;
        }
        var selected = false;
        if (array.indexOf(name) > -1){
            selected = true;
        }
        var object = {
            id:name,
            text:node.text
        };
        if (node.childs && node.childs.length > 0){
            object.children = formattree(name,node.childs,array);
            object.state = {
                selected:selected,
                opened:true,
                disabled:false
            };
        } else {
            object.children = [];
            object.state = {
                selected:selected,
                opened:false,
                disabled:false
            };
        }
        result.push(object);
    }
    return result;
};

router.get('/permission.html',function(req,res){
    if (!rbaccore.haspermission(['organization_role_add','organization_role_edit'],req,res)){
        return;
    }
    var permissons = permissionrbac.list();
    if (req.query.rolename){
        return db.query('select permissionname from t_roles_permission where rolename = ?',[req.query.rolename],function(err,result){
            if (err || result.length == 0){
                return res.json([]);
            }
            var filters = [];
            for (var i = 0;i < result.length;i++){
                filters.push(result[i].permissionname);
            }
            return res.json(formattree('',permissons,filters));
        });
    } else {
        var result = formattree('',permissons,[]);
        return res.json(result);
    }
});

module.exports = router;