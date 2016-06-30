var express = require('express');
var db = require('../../services/db');
var async = require('async');
var dataquery = require('../../services/web/dataquery');
var rbaccore = require('../../services/rbac/core');
var router = express.Router();

router.get('/',function(req,res){
    if (!rbaccore.haspermission('custom_voice',req,res)){
        return;
    }
    return res.render('custom/voice/index',{
        info:req.query.info,
        error:req.query.error
    });
});

router.post('/list.html',function(req,res){
    if (!rbaccore.haspermission('custom_voice',req,res)){
        return;
    }
    var tabledefinition = {
        sSelectSql:'t_calls_record.updatetime,t_calls_record.callid,t_calls.fromphone,t_calls.iswork,t_calls.fromtime,t_calls_record.recordurl,t_calls_record.dealdesc,t_calls_record.dealtime,t_calls_record.staffname',
        sFromSql:'t_calls_record left join t_calls on t_calls_record.callid = t_calls.callid',
        sCountColumnName:'t_calls_record.callid',
        aoColumnDefs: [
            { mData: null, bSearchable: false},
            { mData: 'fromphone', bSearchable: true },
            { mData: 'fromtime', bSearchable: false },
            { mData: 'iswork', bSearchable: false },
            { mData: 'recordurl', bSearchable: false },
            { mData: null, bSearchable: false},
            { mData: null, bSearchable: false},
            { mData: 'callid' , bSearchable: false},
            { mData: 'dealtime', bSearchable: false},
            { mData: 'dealdesc', bSearchable: false},
            { mData: 'staffname', bSearchable: false},
            { mData: 'updatetime', bSearchable: false}
        ]};
    return dataquery.pagedata(tabledefinition,req,res);
});

router.get('/deal.html',function(req,res){
    if (!rbaccore.haspermission('custom_voice_deal',req,res)){
        return;
    }
    var callid = req.query.callid;
    if (!callid){
        return res.redirect('/custom/voice/?error=无效的用户留言信息');
    }
    db.query('select * from t_calls_record left join t_calls on t_calls_record.callid = t_calls.callid where t_calls_record.callid = ?',[callid],function(err,result){
        if (err){
            console.error('在数据库中查询用户留言异常',err);
            return res.redirect('/custom/voice/?error=无效的用户留言信息');
        }
        if (result.length == 0){
            return res.redirect('/custom/voice/?error=无效的用户留言信息');
        }
        var voice = result[0];
        if (voice.dealtime){
            return res.redirect('/custom/voice/?error=已处理的用户留言信息');
        } else {
            var dealstaff = voice.staffname;
            var staff = req.session.staff;
            if (dealstaff){
                //已经处理过的
                if (dealstaff == staff.username){
                    return res.render('custom/voice/deal',{
                        voice:result[0]
                    });
                } else {
                    return res.redirect('/custom/voice/?error=' + dealstaff + '正在处理该留言');
                }
            } else {
                db.query('update t_calls_record set staffname = ? where callid = ?',[staff.username,callid],function(err){
                    if (err){
                        console.error('更新用户留言为处理中状态错误',err);
                        return res.redirect('/custom/voice/?error=系统处理异常');
                    }
                    return res.render('custom/voice/deal',{
                        voice:result[0]
                    });
                })
            }
        }

    });
});

router.post('/deal.html',function(req,res){
    if (!rbaccore.haspermission('custom_voice_deal',req,res)){
        return;
    }
    var staff = req.session.staff;
    var callid = req.body.callid;
    if (!callid){
        return res.redirect('/custom/voice/?error=无效的用户留言信息');
    }
    var dealdesc = req.body.dealdesc;
    if (!dealdesc){
        return res.redirect('/custom/voice/?error=无效的处理结果');
    }
    db.query('update t_calls_record set updatetime = now(),dealtime = now(),dealdesc = ?,staffname = ? where callid = ?',[dealdesc,staff.username,callid],function(err){
        if (err){
            console.error('在数据库更新用户留言处理结果异常',err);
            return res.redirect('/custom/voice/?error=系统异常');
        }
        return res.redirect('/custom/voice/?info=用户留言处理结果保存成功');
    });
});


module.exports = router;