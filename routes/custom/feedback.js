var express = require('express');
var db = require('../../services/db');
var async = require('async');
var dataquery = require('../../services/web/dataquery');
var rbaccore = require('../../services/rbac/core');
var router = express.Router();

router.get('/',function(req,res){
    if (!rbaccore.haspermission('custom_feedback',req,res)){
        return;
    }
    return res.render('custom/feedback/index',{
        info:req.query.info,
        error:req.query.error
    });
});

router.post('/list.html',function(req,res){
    if (!rbaccore.haspermission('custom_feedback',req,res)){
        return;
    }
    var tabledefinition = {
        sTableName: 't_feedbacks',
        sCountColumnName:'id',
        aoColumnDefs: [
            { mData: null, bSearchable: false},
            { mData: 'id', bSearchable: true },
            { mData: 'createtime', bSearchable: false },
            { mData: 'contact', bSearchable: false },
            { mData: 'mobile', bSearchable: false },
            { mData: 'feedback', bSearchable: false },
            { mData: 'dealed', bSearchable: true},
            { mData: null, bSearchable: false},
            { mData: 'dealtime', bSearchable: false},
            { mData: 'dealresult', bSearchable: false},
            { mData: 'dealstaff', bSearchable: false}
        ]};
    return dataquery.pagedata(tabledefinition,req,res);
});

router.get('/deal.html',function(req,res){
    if (!rbaccore.haspermission('custom_feedback_deal',req,res)){
        return;
    }
    var id = req.query.id;
    if (!id){
        return res.redirect('/custom/feedback/?error=无效的反馈信息');
    }
    db.query('select * from t_feedbacks where id = ?',[id],function(err,result){
        if (err){
            console.error('在数据库中查询用户反馈异常',err);
            return res.redirect('/custom/feedback/?error=无效的反馈信息');
        }
        if (result.length == 0){
            return res.redirect('/custom/feedback/?error=无效的反馈信息');
        }
        return res.render('custom/feedback/deal',{
            feedback:result[0]
        });
    });
});

router.post('/deal.html',function(req,res){
    if (!rbaccore.haspermission('custom_feedback_deal',req,res)){
        return;
    }
    var staff = req.session.staff;
    var id = req.body.id;
    if (!id){
        return res.redirect('/custom/feedback/?error=无效的反馈信息');
    }
    var dealresult = req.body.dealresult;
    if (!dealresult){
        return res.redirect('/custom/feedback/?error=无效的处理意见');
    }
    db.query('update t_feedbacks set dealed = 1,dealtime = now(),dealresult = ?,dealstaff = ? where id = ?',[dealresult,staff.username,id],function(err){
        if (err){
            console.error('在数据库更新用户反馈意见处理结果异常',err);
            return res.redirect('/custom/feedback/?error=系统异常');
        }
        return res.redirect('/custom/feedback/?info=用户反馈处理结果保存成功');
    });
});


module.exports = router;