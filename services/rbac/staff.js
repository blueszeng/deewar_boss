/**
 * Created by jimmychou on 15/1/8.
 */
var db = require('../db');
var permission = require('./permission');

var filterpermission = function(parent,permissions,permits){
    var result = [];
    for (var i = 0;i < permissions.length;i++){
        var node = permissions[i];
        var name;
        if (parent == ''){
            name = node.name;
        } else {
            name = parent + '_' + node.name;
        }
        if (permits.indexOf(name) > -1){
            if (node.childs && node.childs.length > 0){
                if (node.icon){
                    result.push({
                        name:node.name,
                        text:node.text,
                        icon:node.icon,
                        childs:filterpermission(name,node.childs,permits)
                    });
                } else {
                    result.push({
                        name:node.name,
                        text:node.text,
                        childs:filterpermission(name,node.childs,permits)
                    });
                }
            } else {
                if (node.icon){
                    result.push({
                        name:node.name,
                        text:node.text,
                        icon:node.icon
                    });
                } else {
                    result.push({
                        name:node.name,
                        text:node.text
                    });
                }
            }
        }
    }
    return result;
};

exports.getpermissions = function(username,req,callback){
    return db.query('select DISTINCT permissionname from t_staffs_role right join t_roles_permission on t_staffs_role.rolename = t_roles_permission.rolename where username = ?',[username],function(err,result){
        if (err){
            console.error('在数据库中获取用户所有权限错误',err);
            return callback([]);
        }
        if (result.length == 0){
            return callback([]);
        }
        var permits = [];
        for (var i = 0;i < result.length;i++){
            permits.push(result[i].permissionname);
        }
        req.session.permits = permits;
        callback(filterpermission('',permission.list(),permits));
    });
};