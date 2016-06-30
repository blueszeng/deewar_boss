var express = require('express');
var path = require('path');
var xmlreader = require('xmlreader');
var db = require('../db');
var router = express.Router();

var voiprouter = require('./voip');
router.use('/voip',voiprouter);

var res_none = path.join(__dirname, '../../other/cloopen', 'none.xml');

router.post('/startservice',function(req,res){
    res.set('Content-Type', 'text/xml');

    var callid = req.query.callid;
    var fromphone = req.query.from;
    var tophone = req.query.to;
    var direction = req.query.direction;

    if (!callid || !direction || direction != 0){
        return res.sendFile(res_none);
    }
    var hours = new Date().getHours();
    if (hours >= 10 && hours < 21){
        db.query('insert into t_calls (callid,fromphone,tophone,iswork,fromtime) values (?,?,?,1,now())',[callid,fromphone,tophone],function(err){
            if (err){
                console.error('在数据库写入电话呼叫记录失败',err);
            }
        });
        return res.send('<?xml version="1.0" encoding="UTF-8" ?>' +
            '<Response>' +
                '<Get action="work" numdigits="1" timeout="1">' +
                    '<Play>welcome.wav</Play>' +
                '</Get>' +
                '<Redirect>work</Redirect>' +
            '</Response>');
    } else {
        db.query('insert into t_calls (callid,fromphone,tophone,iswork,fromtime) values (?,?,?,0,now())',[callid,fromphone,tophone],function(err){
            if (err){
                console.error('在数据库写入电话呼叫记录失败',err);
            }
        });
        return res.send('<?xml version="1.0" encoding="UTF-8" ?>' +
            '<Response>' +
                '<Get action="nowork" numdigits="1" timeout="1">' +
                    '<Play>welcome.wav</Play>' +
                '</Get>' +
                '<Redirect>nowork</Redirect>' +
            '</Response>');
    }
});

router.post('/stopservice',function(req,res){
    res.set('Content-Type', 'text/xml');

    var callid = req.query.callid;
    if (!callid){
        return res.sendFile(res_none);
    }
    var duration = req.query.callduration;
    if (!duration){
        duration = 0;
    }
    var recordid = req.query.recordid;
    var recordurl = req.query.recordurl;
    var errorcode = req.query.errorcode;
    db.query('update t_calls set endtime = now(),duration = ?,recordid = ?,recordurl = ?, errorcode = ? where callid = ?',[duration,recordid,recordurl,errorcode,callid],function(err){
        if (err){
            console.error('在数据库更新电话结束时失败',err);
        }
    });
    return res.sendFile(res_none);
});

router.post('/work',function(req,res){
    res.set('Content-Type', 'text/xml');
    var callid = req.query.callid;
    if (!callid){
        return res.sendFile(res_none);
    }
    return res.send('<?xml version="1.0" encoding="UTF-8" ?>' +
        '<Response>' +
            '<EnterCCS queuetype="1" queuetimes="5" timeout="63" promptvoice="busy.wav" quiturl="workbusyquit" callid="'+callid+'" agenthangupurl="agenthangup" answerprompt="answer.wav" userhangupurl="userhangup">' +
                '<Play>wait.wav</Play>' +
            '</EnterCCS>' +
            '<Redirect>noagent</Redirect>' +
        '</Response>');
});

router.post('/noagent',function(req,res){
    return res.send('<?xml version="1.0" encoding="UTF-8" ?>' +
        '<Response>' +
            '<Get action="workbusyquit" numdigits="1" timeout="10">' +
                '<Play>busy.wav</Play>' +
            '</Get>' +
            '<Play>wait.wav</Play>' +
            '<Redirect>work</Redirect>' +
        '</Response>');
});

router.post('/nowork',function(req,res){
    res.set('Content-Type', 'text/xml');
    var callid = req.query.callid;
    if (!callid){
        return res.sendFile(res_none);
    }
    return res.send('<?xml version="1.0" encoding="UTF-8" ?>' +
        '<Response>' +
            '<Record action="nowork/recordover" maxlength="180">' +
                '<Play>nowork.wav</Play>' +
            '</Record>' +
        '</Response>');
});

router.post('/agenthangup',function(req,res){
    res.set('Content-Type', 'text/xml');
    var callid = req.query.callid;
    if (!callid){
        return res.sendFile(res_none);
    }
    db.query('update t_calls set agenthanguptime = now() where callid = ?',[callid],function(err){
        if (err){
            console.error('在数据库更新电话坐席挂机时失败',err);
        }
    });
    return res.sendFile(res_none);
});

router.post('/userhangup',function(req,res){
    res.set('Content-Type', 'text/xml');
    var callid = req.query.callid;
    if (!callid){
        return res.sendFile(res_none);
    }
    db.query('update t_calls set userhanguptime = now() where callid = ?',[callid],function(err){
        if (err){
            console.error('在数据库更新电话用户挂机时失败',err);
        }
    });
    return res.sendFile(res_none);
});

router.post('/workbusyquit',function(req,res){
    res.set('Content-Type', 'text/xml');
    var callid = req.query.callid;
    if (!callid){
        return res.sendFile(res_none);
    }
    return res.send('<?xml version="1.0" encoding="UTF-8" ?>' +
        '<Response>' +
            '<Record action="workbusyquit/recordover" maxlength="180" />' +
        '</Response>');
});

router.post('/workbusyquit/recordover',function(req,res){
    res.set('Content-Type', 'text/xml');
    var callid = req.query.callid;
    if (!callid){
        return res.sendFile(res_none);
    }
    var recordurl = req.query.recordurl;
    var duration = req.query.recordduration;
    if (!duration){
        duration = 0;
    }
    db.query('insert into t_calls_record (callid,duration,recordurl,recordtype,updatetime) values (?,?,?,0,now())',[callid,duration,recordurl],function(err){
        if (err){
            console.error('在数据库写入电话录音记录失败',err);
        }
    });
    return res.send('<?xml version="1.0" encoding="UTF-8" ?>' +
        '<Response>' +
            '<Play>bye.wav</Play>' +
        '</Response>');
});

router.post('/nowork/recordover',function(req,res){
    res.set('Content-Type', 'text/xml');
    var callid = req.query.callid;
    if (!callid){
        return res.sendFile(res_none);
    }
    var recordurl = req.query.recordurl;
    var duration = req.query.recordduration;
    if (!duration){
        duration = 0;
    }
    db.query('insert into t_calls_record (callid,duration,recordurl,recordtype,updatetime) values (?,?,?,1,now())',[callid,duration,recordurl],function(err){
        if (err){
            console.error('在数据库写入电话录音记录失败',err);
        }
    });
    return res.send('<?xml version="1.0" encoding="UTF-8" ?>' +
        '<Response>' +
            '<Play>bye.wav</Play>' +
        '</Response>');
});

router.post('/agentstate',function(req,res){
    res.set('Content-Type', 'text/xml');
    var agentstate = req.query.agentstate;
    var callid = req.query.callid;
    var agentid = req.query.agentid;
    var appid = req.query.appid;
    var queuetype = req.query.queuetype;
    var number = req.query.number;
    if (appid && callid && agentstate && agentid && agentstate == 0){
        return res.send('<?xml version="1.0" encoding="UTF-8" ?>' +
            '<Response>' +
                '<Appid>' + appid + '</Appid>' +
                '<AgentReady agentid="' + agentid + '" state="true" />' +
            '</Response>');
    } else if (appid && callid && agentstate && agentid && agentstate == 3){
        db.query('update t_calls set agentid = ?,agentstarttime = now() where callid = ?',[agentid,callid],function(err){
            if (err){
                console.error('座席接听时更新状态错误',err);
            }
            return res.sendFile(res_none);
        });
    } else if (appid && callid && agentstate && agentid && agentstate == 2 && queuetype && queuetype == 1 && number){
        db.query('update t_customs set lastcallid = ?,lastnumber = ? where agentid = ?',[callid,number,agentid],function(err){
            if (err){
                console.error('座席接听时更新状态错误',err);
            }
            return res.sendFile(res_none);
        });
    } else  {
        return res.sendFile(res_none);
    }
});

router.post('/callback',function(req,res){
    res.set('Content-Type', 'text/xml');
    var body = req.rawBody;
    if (!body){
        console.error('没有鉴权接口提交的数据');
        return res.send('<?xml version="1.0" encoding="UTF-8"?>' +
            '<Response>' +
                '<statuscode>0000</statuscode>' +
            '</Response>');
    }
    xmlreader.read(body,function(err,result){
        if (err){
            console.error('获取云通讯平台POST XML数据解析失败',err);
            return res.send('<?xml version="1.0" encoding="UTF-8"?>' +
                '<Response>' +
                    '<statuscode>0000</statuscode>' +
                '</Response>');
        }
        var action = result.request.action.text();
        if (action == 'CallAuth'){
            return res.send('<?xml version="1.0" encoding="UTF-8"?>' +
                '<Response>' +
                    '<statuscode>0000</statuscode>' +
                '</Response>');
        } else if (action == 'CallEstablish'){
            var callid = result.request.orderid.text();
            var calltype = result.request.type.text();
            var subaccountsid = null;
            var caller = result.request.caller.text();
            var called = result.request.called.text();
            var callsid = result.request.callSid.text();
            db.query('insert into t_calls_ob (callid,calltype,subaccountsid,caller,called,callsid,calltime) values (?,?,?,?,?,?,now())',[callid,calltype,subaccountsid,caller,called,callsid],function(err,dbresult){
                if (err){
                    console.error('插入外呼计费数据错误',err);
                    return res.send('<?xml version="1.0" encoding="UTF-8"?>' +
                        '<Response>' +
                        '<statuscode>0000</statuscode>' +
                        '<billdata>-1</billdata>' +
                        '<sessiontime>-1</sessiontime>' +
                        '</Response>');
                }
                var billdata = dbresult.insertId;
                return res.send('<?xml version="1.0" encoding="UTF-8"?>' +
                    '<Response>' +
                    '<statuscode>0000</statuscode>' +
                    '<billdata>'+billdata+'</billdata>' +
                    '<sessiontime>-1</sessiontime>' +
                    '</Response>');
            });
        } else if (action == 'Hangup'){
            var billdata = -1;
            if (result.request.billdata.text){
                billdata = Number(result.request.billdata.text());
            }
            if (billdata == -1){
                return res.send('<?xml version="1.0" encoding="UTF-8"?>' +
                    '<Response>' +
                    '<statuscode>0000</statuscode>' +
                    '</Response>');
            }
            var recordurl = null;
            db.query('update t_calls_ob set endtime = now(),recordurl = ? where id = ?',[recordurl,billdata],function(err){
                if (err){
                    console.error('更新外呼数据库计费结束错误',err);
                }
                return res.send('<?xml version="1.0" encoding="UTF-8"?>' +
                    '<Response>' +
                    '<statuscode>0000</statuscode>' +
                    '</Response>');
            });
        } else {
            return res.send('<?xml version="1.0" encoding="UTF-8"?>' +
                '<Response>' +
                    '<statuscode>0000</statuscode>' +
                '</Response>');
        }
    });
});

module.exports = router;