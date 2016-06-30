var express = require('express');
var db = require('../../services/db');
var async = require('async');
var dataquery = require('../../services/web/dataquery');
var rbaccore = require('../../services/rbac/core');
var router = express.Router();

router.get('/',function(req,res){
    if (!rbaccore.haspermission('organization_board',req,res)){
        return;
    }
    return res.render('organization/board/index',{
        info:req.query.info,
        error:req.query.error
    });
});

router.post('/list.html',function(req,res){
    if (!rbaccore.haspermission('organization_board',req,res)){
        return;
    }
    var tabledefinition = {
        sTableName: 't_boards',
        sCountColumnName:'id',
        aoColumnDefs: [
            { mData: 'id', bSearchable: true },
            { mData: 'icon', bSearchable: false },
            { mData: 'title', bSearchable: true },
            { mData: 'updatetime', bSearchable: false },
            { mData: null, bSearchable: false}
        ]};
    return dataquery.pagedata(tabledefinition,req,res);
});

router.get('/add.html',function(req,res){
    if (!rbaccore.haspermission('organization_board_add',req,res)){
        return;
    }
    return res.render('organization/board/add');
});

router.post('/add.html',function(req,res){
    if (!rbaccore.haspermission('organization_board_add',req,res)){
        return;
    }
    var title = req.body.title;
    if (!title){
        return res.render('organization/board/add',{
            error:'无效的公告标题'
        });
    }
    var icon = req.body.icon;
    if (!icon){
        return res.render('organization/board/add',{
            error:'无效的公告类型'
        });
    }
    var content = req.body.content;
    if (!content){
        return res.render('organization/board/add',{
            error:'无效的公告内容'
        });
    }
    db.query('insert into t_boards (title,content,icon,updatetime) values (?,?,?,now())',[title,content,icon],function(err){
        if (err){
            console.error('在数据库添加系统公告错误',err);
            return res.render('organization/board/add',{
                error:'新增公告失败'
            });
        }
        return res.redirect('/organization/board/?info=新增公告成功');
    });
});

router.get('/edit.html',function(req,res){
    if (!rbaccore.haspermission('organization_board_edit',req,res)){
        return;
    }
    var id = req.query.id;
    if (!id){
        return res.redirect('/organization/board/?error=无法编辑公告');
    }
    db.query('select * from t_boards where id = ?',[id],function(err,result){
        if (err){
            console.error('在数据库读取系统公告错误',err);
            return res.redirect('/organization/board/?error=无法编辑公告');
        }
        if (result.length == 0){
            return res.redirect('/organization/board/?error=无法编辑公告');
        }
        return res.render('organization/board/edit',{
            board:result[0]
        });
    });
});

router.post('/edit.html',function(req,res){
    if (!rbaccore.haspermission('organization_board_edit',req,res)){
        return;
    }
    var id = req.body.id;
    if (!id){
        return res.redirect('/organization/board/?error=无法编辑公告');
    }
    var title = req.body.title;
    if (!title){
        return res.redirect('/organization/board/edit.html?id=' + id + '&error=公告标题不能为空');
    }
    var content = req.body.content;
    if (!content){
        return res.redirect('/organization/board/edit.html?id=' + id + '&error=公告内容不能为空');
    }
    var icon = req.body.icon;
    if (!icon){
        return res.redirect('/organization/board/edit.html?id=' + id + '&error=公告类型不能为空');
    }
    db.query('update t_boards set title=?,content=?,icon=?,updatetime=now() where id=?',[title,content,icon,id],function(err){
        if (err){
            console.error('在数据库中编辑爱鞋讲堂文章失败',err);
            return res.redirect('/organization/board/edit.html?id=' + id + '&error=编辑公告失败');
        }
        return res.redirect('/organization/board/?info=编辑公告成功');
    });
});

router.get('/del.html',function(req,res){
    if (!rbaccore.haspermission('organization_board_del',req,res)){
        return;
    }
    var id = req.query.id;
    if (!id){
        return res.redirect('/organization/board/?error=无法删除公告');
    }
    db.query('delete from t_boards where id = ?',[id],function(err){
        if (err){
            console.error('在数据库删除系统公告失败',err);
            return res.redirect('/organization/board/?error=删除公告失败');
        }
        return res.redirect('/organization/board/?info=删除公告成功');
    });
});

module.exports = router;