/**
 * Created by jimmychou on 15/1/16.
 */
var express = require('express');
var db = require('../../services/db');
var async = require('async');
var rbaccore = require('../../services/rbac/core');
var pushdao = require('../../services/dao/push');
var uuid = require('node-uuid');
var router = express.Router();

router.get('/',function(req,res){
    if (!rbaccore.haspermission('operation_notify',req,res)){
        return;
    }
    return res.render('operation/notify/index',{
        tab:'broadcast'
    });
});

router.post('/broadcast.html',function(req,res){
    if (!rbaccore.haspermission('operation_notify_broadcast',req,res)){
        return;
    }
    var title = req.body.title;
    var content = req.body.content;
    if (!content){
        return res.render('operation/notify/index',{
            error:'无效的消息内容',
            tab:'broadcast'
        });
    }
    pushdao.broadcast(title,content,function(err){
        if (err){
            console.error('百度推送失败：',err);
            return res.render('operation/notify/index',{
                error:'消息广播发送失败',
                tab:'broadcast'
            });
        }
        return res.render('operation/notify/index',{
            info:'消息广播发送成功',
            tab:'broadcast'
        });
    });
});

router.post('/send.html',function(req,res){
    if (!rbaccore.haspermission('operation_notify_send',req,res)){
        return;
    }
    var title = req.body.title;
    var content = req.body.content;
    if (!content){
        return res.render('operation/notify/index',{
            error:'无效的消息内容',
            tab:'send'
        });
    }
    var persons = req.body.persons;
    if (!persons){
        return res.render('operation/notify/index',{
            error:'无效的消息接收对象',
            tab:'send'
        });
    }
    pushdao.sendto(persons,title,content,function(err){
        if (err){
            return res.render('operation/notify/index',{
                error:err,
                tab:'send'
            });
        } else {
            return res.render('operation/notify/index',{
                info:'消息已成功发送',
                tab:'send'
            });
        }
    });
});

module.exports = router;
