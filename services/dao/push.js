/**
 * Created by jimmychou on 15/1/22.
 */

var db = require('../db');
var push = require('../push/message');
var async = require('async');
var uuid = require('node-uuid');

var pushclient = new push({
    APP_SECRET:'0QiHR29M1FwdRPjYwOeYPA==',
    PACKAGE_NAME:'com.junewinds.xxb.pda'
});

var sendto = function(usernames,title,message,callback){
    var personarray = usernames.split(',');
    var wherearray = [];
    for (var i = 0;i < personarray.length;i++){
        wherearray.push('username = \'' + personarray[i] + '\'');
    }
    var wheresql;
    if (wherearray.length == 1){
        wheresql = wherearray[0];
    } else {
        wheresql = wherearray.join(' OR ');
    }
    db.query('select pushid from t_staffs_token where ' + wheresql,function(err,result){
        if (err){
            return callback('无效的消息接收对象');
        }
        if (result.length == 0){
            return callback('没有有效的接收者');
        }
        async.forEachLimit(result,2,function(item,callback){
            if (item.pushid == null){
                console.error('人员没有推送信息');
                return callback(null);
            }
            pushclient.send_to_reg_id(item.pushid,{
                title:title,
                desc:message
            },{
                notify_type:1,
                pass_through:0,
                notify_id:new Date().getTime(),
                sound_url:'android.resource://com.junewinds.xxb.pda/raw/push'
            },callback);
        },function(err){
            if (err){
                console.error('发送小米推送错误',err);
                callback('发送小米推送错误');
                console.error('',err);
            } else {
                callback(null);
            }
        });
    });
};

var broadcast = function(title,message,callback){
    pushclient.send_to_all({
        title:title,
        desc:message
    },{
        notify_type:1,
        pass_through:0,
        notify_id:new Date().getTime(),
        sound_url:'android.resource://com.junewinds.xxb.pda/raw/push'
    },callback);
};

exports.broadcast = broadcast;
exports.sendto = sendto;