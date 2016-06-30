var express = require('express');
var db = require('../../services/db');
var async = require('async');
var dataquery = require('../../services/web/dataquery');
var rbaccore = require('../../services/rbac/core');
var router = express.Router();

router.get('/',function(req,res){
    if (!rbaccore.haspermission('website_knowledge',req,res)){
        return;
    }
    return res.render('website/knowledge/index',{
        info:req.query.info,
        error:req.query.error
    });
});

router.post('/list.html',function(req,res){
    if (!rbaccore.haspermission('website_knowledge',req,res)){
        return;
    }
    var tabledefinition = {
        sTableName: 't_knowledges',
        sCountColumnName:'id',
        aoColumnDefs: [
            { mData: 'id', bSearchable: true },
            { mData: 'title', bSearchable: true },
            { mData: 'updatetime', bSearchable: false },
            { mData: 'hits', bSearchable: false },
            { mData: null, bSearchable: false}
        ]};
    return dataquery.pagedata(tabledefinition,req,res);
});

router.get('/add.html',function(req,res){
    if (!rbaccore.haspermission('website_knowledge_add',req,res)){
        return;
    }
    return res.render('website/knowledge/add');
});

router.post('/add.html',function(req,res){
    if (!rbaccore.haspermission('website_knowledge_add',req,res)){
        return;
    }
    var title = req.body.title;
    if (!title){
        return res.render('website/knowledge/add',{
            error:'无效的文章标题'
        });
    }
    var content = req.body.content;
    if (!content){
        return res.render('website/knowledge/add',{
            error:'无效的文章内容'
        });
    }
    var summary = req.body.summary;
    db.query('insert into t_knowledges (title,content,summary,updatetime,hits) values (?,?,?,now(),0)',[title,content,summary],function(err){
        if (err){
            console.error('在数据库添加爱鞋讲堂文章错误',err);
            return res.render('website/knowledge/add',{
                error:'新增文章失败'
            });
        }
        return res.redirect('/website/knowledge/?info=新增文章成功');
    });
});

router.get('/edit.html',function(req,res){
    if (!rbaccore.haspermission('website_knowledge_edit',req,res)){
        return;
    }
    var id = req.query.id;
    if (!id){
        return res.redirect('/website/knowledge/?error=无法编辑文章');
    }
    db.query('select * from t_knowledges where id = ?',[id],function(err,result){
        if (err){
            console.error('在数据库读取文章错误',err);
            return res.redirect('/website/knowledge/?error=无法编辑文章');
        }
        if (result.length == 0){
            return res.redirect('/website/knowledge/?error=无法编辑文章');
        }
        return res.render('website/knowledge/edit',{
            article:result[0]
        });
    });
});

router.post('/edit.html',function(req,res){
    if (!rbaccore.haspermission('website_knowledge_edit',req,res)){
        return;
    }
    var id = req.body.id;
    if (!id){
        return res.redirect('/website/knowledge/?error=无法编辑文章');
    }
    var title = req.body.title;
    if (!title){
        return res.redirect('/website/knowledge/edit.html?id=' + id + '&error=文章标题不能为空');
    }
    var content = req.body.content;
    if (!content){
        return res.redirect('/website/knowledge/edit.html?id=' + id + '&error=文章内容不能为空');
    }
    var summary = req.body.summary;
    db.query('update t_knowledges set title=?,content=?,summary=?,updatetime=now() where id=?',[title,content,summary,id],function(err,result){
        if (err){
            console.error('在数据库中编辑爱鞋讲堂文章失败',err);
            return res.redirect('/website/knowledge/edit.html?id=' + id + '&error=编辑文章失败');
        }
        return res.redirect('/website/knowledge/?info=编辑文章成功');
    });
});

router.get('/del.html',function(req,res){
    if (!rbaccore.haspermission('website_knowledge_del',req,res)){
        return;
    }
    var id = req.query.id;
    if (!id){
        return res.redirect('/website/knowledge/?error=无法删除文章');
    }
    db.query('delete from t_knowledges where id = ?',[id],function(err){
        if (err){
            console.error('在数据库删除爱鞋讲堂文章失败',err);
            return res.redirect('/website/knowledge/?error=删除文章失败');
        }
        return res.redirect('/website/knowledge/?info=删除文章成功');
    });
});

router.get('/view.html',function(req,res){
    if (!rbaccore.haspermission('website_knowledge_view',req,res)){
        return;
    }
    var id = req.query.id;
    if (!id){
        return res.redirect('/website/knowledge/?error=无法查看文章');
    }
    db.query('select * from t_knowledges where id = ?',[id],function(err,result){
        if (err){
            console.error('在数据库读取爱鞋讲堂文章错误',err);
            return res.redirect('/website/knowledge/?error=无法查看文章');
        }
        if (result.length == 0){
            return res.redirect('/website/knowledge/?error=无法查看文章');
        }
        return res.render('website/knowledge/view',{
            article:result[0]
        });
    });
});

module.exports = router;