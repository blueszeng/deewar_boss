/**
 * Created by jimmychou on 15/1/14.
 */
var express = require('express');
var db = require('../../services/db');
var async = require('async');
var uuid = require('node-uuid');
var router = express.Router();

router.post('/login.json',function(req,res){
    var username = req.body.username;
    if (!username){
        return res.json({success:false,message:'无效的用户名'});
    }
    var password = req.body.password;
    if (!password){
        return res.json({success:false,message:'无效的登录密码'});
    }
    var pushid = req.body.pushid;
    async.parallel({
        staff:function(callback){
            db.query('select showname,password,mobile from t_staffs where username = ?',[username],function(err,result){
                callback(err,result);
            });
        },
        roles:function(callback){
            db.query('select rolename from t_staffs_role where username = ?',[username],function(err,result){
                callback(err,result);
            });
        }
    },function(err,result){
        if (err){
            console.error('在数据库查询人员错误',err);
            return res.json({success:false,message:'系统异常，请重试'});
        }
        var staffresult = result.staff;
        if (staffresult.length == 0){
            return res.json({success:false,message:'不存在的用户或错误的密码'});
        }
        var staff = staffresult[0];
        if (staff.password != password){
            return res.json({success:false,message:'不存在的用户或错误的密码'});
        }
        var roles = [];
        for (var i = 0;i < result.roles.length;i++){
            roles.push(result.roles[i].rolename);
        }
        var token = uuid.v1();
        if (!pushid){
            return db.query('insert into t_staffs_token (username,token,updatetime) VALUES (?,?,now()) on duplicate key update token = ?,updatetime = now()',[username,token,token],function(err){
                if (err){
                    console.error('在数据库写入TOKEN表错误',err);
                    return res.json({success:false,message:'系统异常，请重试'});
                }
                return res.json({success:true,data:{
                    username:username,
                    showname:staff.showname,
                    mobile:staff.mobile,
                    token:token,
                    roles:roles
                }});
            });
        } else {
            return db.query('insert into t_staffs_token (username,token,pushid,updatetime) VALUES (?,?,?,now()) on duplicate key update token = ?,pushid=?,updatetime = now()',[username,token,pushid,token,pushid],function(err){
                if (err){
                    console.error('在数据库写入TOKEN表错误',err);
                    return res.json({success:false,message:'系统异常，请重试'});
                }
                return res.json({success:true,data:{
                    username:username,
                    showname:staff.showname,
                    mobile:staff.mobile,
                    token:token,
                    roles:roles
                }});
            });
        }
    });
});

module.exports = router;