var encodeutil = require('../../utils/encode');
var moment = require('moment');
var request = require('request');
var xmlreader = require('xmlreader');
var db = require('../db');
var accountid = 'aaf98f894e0afaf7014e1ed5254908cc';
var accounttoken = 'ee717261d86c4123be3f63f1cf947e61';
var appid = 'aaf98f894e0afaf7014e1ed9850708d5';

var dopost = function(modulename,actionname,params,callback,xml){
    var host = 'app.cloopen.com';
    var port = '8883';
    var version = '2013-12-26';
    var timestamp = moment().format('YYYYMMDDHHmmss');
    var sig = encodeutil.md5(accountid + accounttoken + timestamp).toUpperCase();
    var url;
    if (actionname.indexOf('?') > -1){
        url = 'https://' + host + ':' + port + '/' + version + '/' + modulename + '/' + accountid + '/' + actionname + '&sig=' + sig;
    } else {
        url = 'https://' + host + ':' + port + '/' + version + '/' + modulename + '/' + accountid + '/' + actionname + '?sig=' + sig;
    }
    var auth = new Buffer(accountid + ':' + timestamp).toString('base64');
    var options;
    if (xml){
        options = {
            headers: {
                "Authorization": auth,
                "Content-Type": "application/xml;charset=utf-8;"
            },
            url: url,
            method: 'POST',
            body: params
        };
    } else {
        options = {
            headers: {
                "Authorization": auth,
                "Content-Type":"application/json;charset=utf-8;",
                "Accept":"application/json;"
            },
            url: url,
            method: 'POST',
            json:true,
            body: params
        };
    }
    request(options,function(err,response,data){
        if (err){
            console.error('请求云通讯失败',err,sig);
            return callback('请求错误');
        }
        if (response.statusCode != 200){
            console.error('请求云通讯返回错误',response,sig);
            return callback('返回错误');
        }
        if (xml){
            xmlreader.read(data,function(err,result){
                if (err){
                    console.error('云通讯返回XML无法解析',data,sig);
                    return callback('返回错误');
                }
                var errorcode;
                var errorobject = result.Response.statusCode;
                if (errorobject){
                    errorcode = errorobject.text();
                } else {
                    errorobject = result.Response.statuscode;
                    if (errorobject){
                        errorcode = errorobject.text();
                    } else {
                        errorcode = '未知错误代码';
                    }
                }
                if (errorcode == '000000'){
                    return callback(null,data);
                }
                return callback('错误：' + errorcode);
            });
        } else {
            if (data.statusCode == '000000' || data.statuscode == '000000'){
                return callback(null,data);
            } else {
                var errcode = data.statusCode;
                if (!errcode){
                    errcode = data.statuscode;
                }
                return callback('错误：' + errcode);
            }
        }
    });
};


var createaccount = function(username,callback){
    var body = {
        appId:appid,
        friendlyName:username
    };
    dopost('Accounts','SubAccounts',body,function(err,data){
        if (err){
            return callback(err);
        }
        return callback(null,data.SubAccount);
    });
};

var deleteaccount = function(subaccount,callback){
    var body = {
        subAccountSid:subaccount
    };
    dopost('Accounts','CloseSubAccount',body,function(err){
        if (err){
            return callback(err);
        }
        return callback(null);
    });
};

var dodebug =function(xml,modulename,actionname,params,callback){
    var object = null;
    if (!xml){
        if (params){
            try{
                object = JSON.parse(params);
            }catch(er){
                return callback('请求参数解析错误');
            }
        }
    } else {
        if (params){
            object = params;
        }
    }
    dopost(modulename,actionname,object,function(err,data){
        callback(err,data);
    },xml);
};

var agentwork = function(voipaccount,agentid,callback){
    var body = '<?xml version=\'1.0\' encoding=\'utf-8\' ?><Request><Appid>'+appid+'</Appid><AgentOnWork agentstate="0" number="'+voipaccount+'" agentid="'+agentid+'" agenttype="1" /></Request>';
    dopost('Accounts','ivr/agentonwork',body,function(err){
        if (err){
            console.error('切换到工作状态错误',err);
            return callback(err);
        }
        return callback(null);
    },true);
};

var agentrest = function(voipaccount,agentid,callback){
    var body = '<?xml version=\'1.0\' encoding=\'utf-8\' ?><Request><Appid>'+appid+'</Appid><AgentOffWork number="'+voipaccount+'" agentid="'+agentid+'" /></Request>';
    dopost('Accounts','ivr/agentoffwork',body,function(err){
        if (err){
            console.error('切换到休息状态错误',err);
            return callback(err);
        }
        return callback(null);
    },true);
};

var agentready = function(agentid,state,callback){
    var body = '<?xml version=\'1.0\' encoding=\'utf-8\' ?><Request><Appid>'+appid+'</Appid><AgentReady force="true" state="'+state+'" agentid="'+agentid+'" /></Request>';
    dopost('Accounts','ivr/agentready',body,function(err){
        if (err){
            console.error('切换座席状态错误',err);
            return callback(err);
        }
        return callback(null);
    },true);
};

var transferto = function(callid,number,callback){
    var body = '<?xml version=\'1.0\' encoding=\'utf-8\'?><Request><Appid>'+appid+'</Appid><NoAnswerTransfer callid ="'+ callid +'" number="' + number + '"/></Request>';
    dopost('Accounts','ivr/call?callid=' + callid,body,function(err){
        if (err){
            console.error('呼叫转移错误',err);
            return callback(err);
        }
        return callback(null);
    },true);
};

var sendsms = function(to,templateid,vararray,userid,count){
    if (!userid){
        userid = 0;
    }
    if (count && count > 3){
        db.query('insert into t_messages_sms (mobile,content,template,sendtime,success,retry,message,userid) values (?,?,?,now(),0,?,?,?)',[to,JSON.stringify(vararray),templateid,count,'达到重试次数上限',userid]);
        return;
    }
    if (!to || !templateid){
        return;
    }
    var body = {
        to:to,
        appId:appid,
        templateId:templateid,
        datas:vararray
    };
    dopost('Accounts','SMS/TemplateSMS',body,function(err,data){
        if (err){
            if (err == '请求错误' || err == '返回错误'){
                setTimeout(function(){
                    sendsms(to,templateid,vararray,userid,count+1);
                },3000);
            } else {
                db.query('insert into t_messages_sms (mobile,content,template,sendtime,success,retry,message,userid) values (?,?,?,now(),0,?,?,?)',[to,JSON.stringify(vararray),templateid,count,err,userid]);
            }
        } else {
            db.query('insert into t_messages_sms (mobile,content,template,sendtime,success,retry,vendorid,userid) values (?,?,?,now(),1,?,?,?)',[to,JSON.stringify(vararray),templateid,count,data.templateSMS.smsMessageSid,userid]);
        }
    });
};

exports.sendsms = sendsms;
exports.createaccount = createaccount;
exports.deleteaccount = deleteaccount;
exports.dodebug = dodebug;
exports.agentwork = agentwork;
exports.agentrest = agentrest;
exports.agentready = agentready;
exports.transferto = transferto;
