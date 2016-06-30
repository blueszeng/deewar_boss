var express = require('express');
var path = require('path');
var url = require('url');
var os = require('os');
var fs = require('fs');
var moment = require('moment');
var db = require('../../services/db');
var async = require('async');
var dataquery = require('../../services/web/dataquery');
var rbaccore = require('../../services/rbac/core');
var storage = require('../../services/storage');
var fsutils = require('../../utils/fs');
var Busboy = require('busboy');
var router = express.Router();

router.get('/',function(req,res){
    if (!rbaccore.haspermission('website_market',req,res)){
        return;
    }
    return res.render('website/market/index',{
        info:req.query.info,
        error:req.query.error
    });
});

router.post('/list.html',function(req,res){
    if (!rbaccore.haspermission('website_market',req,res)){
        return;
    }
    var tabledefinition = {
        sTableName: 't_markets',
        sCountColumnName:'id',
        aoColumnDefs: [
            { mData: 'id', bSearchable: true },
            { mData: 'title', bSearchable: true },
            { mData: 'startdate', bSearchable: true },
            { mData: 'updatetime', bSearchable: false },
            { mData: 'hits', bSearchable: false },
            { mData: null, bSearchable: false},
            { mData: 'enddate', bSearchable: true }
        ]};
    return dataquery.pagedata(tabledefinition,req,res);
});

router.get('/add.html',function(req,res){
    if (!rbaccore.haspermission('website_market_add',req,res)){
        return;
    }
    return res.render('website/market/add');
});

router.post('/add.html',function(req,res){
    if (!rbaccore.haspermission('website_market_add',req,res)){
        return;
    }
    //开始获取上传
    var busboy = new Busboy({
        headers: req.headers,
        limits:{
            fileSize: 2048000,
            fieldSize: 2048000
        }
    });

    var callback = function(err,result){
        if (err){
            return res.render('website/market/add',{
                error:err
            });
        }
        var title = req.body.title;
        if (!title){
            return res.render('website/market/add',{
                error:'无效的活动标题'
            });
        }
        var content = req.body.content;
        if (!content){
            return res.render('website/market/add',{
                error:'无效的活动内容'
            });
        }
        var startdate = req.body.startdate;
        if (!startdate){
            return res.render('website/market/add',{
                error:'无效的开始日期'
            });
        }
        var enddate = req.body.enddate;
        if (!enddate){
            return res.render('website/market/add',{
                error:'无效的结束日期'
            });
        }
        var sd = moment(startdate,'YYYY年MM月DD日');
        if (sd.isValid() == false){
            return res.render('website/market/add',{
                error:'无效的开始日期格式'
            });
        }
        var ed = moment(enddate,'YYYY年MM月DD日');
        if (ed.isValid() == false){
            return res.render('website/market/add',{
                error:'无效的结束日期格式'
            });
        }
        if (ed.isBefore(sd)){
            return res.render('website/market/add',{
                error:'结束日期不能早于开始日期'
            });
        }
        db.query('insert into t_markets (title,content,startdate,enddate,banner,updatetime,hits) values (?,?,?,?,?,now(),0)',[title,content,sd.toDate(),ed.toDate(),result],function(err){
            if (err){
                console.error('在数据库添加优惠活动错误',err);
                return res.render('website/market/add',{
                    error:'新增活动失败'
                });
            }
            return res.redirect('/website/market/?info=新增优惠活动成功');
        });
    };

    busboy.on('field',function(fieldname, val){
        if (req.body.hasOwnProperty(fieldname)) {
            if (Array.isArray(req.body[fieldname])) {
                req.body[fieldname].push(val);
            } else {
                req.body[fieldname] = [req.body[fieldname], val];
            }
        } else {
            req.body[fieldname] = val;
        }
    });
    busboy.on('file', function(fieldname, file, filename) {
        var realName = fsutils.getfilename(path.extname(filename));
        var saveTo = path.join(os.tmpDir(), realName);
        file.pipe(fs.createWriteStream(saveTo));
        file.on('end', function() {
            var id = setTimeout(function() {
                callback('上传超时');
            }, 300000);
            storage.uploadwebsite(saveTo,realName,function(err,result){
                clearTimeout(id);
                if (err){
                    callback('上传失败');
                } else {
                    callback(null,result);
                }
            });
        });
    });
    busboy.on('filesLimit',function(){
        return res.render('website/market/add',{
            error:'横幅文件太大'
        });
    });
    busboy.on('fieldsLimit',function(){
        return res.render('website/market/add',{
            error:'横幅文件太大'
        });
    });
    req.pipe(busboy);
});


router.get('/edit.html',function(req,res){
    if (!rbaccore.haspermission('website_market_edit',req,res)){
        return;
    }
    var id = req.query.id;
    if (!id){
        return res.redirect('/website/market/?error=无法编辑优惠活动');
    }
    db.query('select * from t_markets where id = ?',[id],function(err,result){
        if (err){
            console.error('在数据库读取优惠活动错误',err);
            return res.redirect('/website/market/?error=无法编辑优惠活动');
        }
        if (result.length == 0){
            return res.redirect('/website/market/?error=无法编辑优惠活动');
        }
        var article = result[0];
        return res.render('website/market/edit',{
            article:article,
            startdate:moment(article.startdate).format('YYYY年MM月DD日'),
            enddate:moment(article.enddate).format('YYYY年MM月DD日')
        });
    });
});

router.post('/edit.html',function(req,res){
    if (!rbaccore.haspermission('website_market_edit',req,res)){
        return;
    }
    var id = req.body.id;
    if (!id){
        return res.redirect('/website/market/?error=无法编辑优惠活动');
    }
    var title = req.body.title;
    if (!title){
        return res.redirect('/website/market/edit.html?id=' + id + '&error=活动标题不能为空');
    }
    var content = req.body.content;
    if (!content){
        return res.redirect('/website/market/edit.html?id=' + id + '&error=活动内容不能为空');
    }
    var startdate = req.body.startdate;
    if (!startdate){
        return res.redirect('/website/market/edit.html?id=' + id + '&error=无效的开始日期');
    }
    var enddate = req.body.enddate;
    if (!enddate){
        return res.redirect('/website/market/edit.html?id=' + id + '&error=无效的结束日期');
    }
    var sd = moment(startdate,'YYYY年MM月DD日');
    if (sd.isValid() == false){
        return res.redirect('/website/market/edit.html?id=' + id + '&error=无效的开始日期格式');
    }
    var ed = moment(enddate,'YYYY年MM月DD日');
    if (ed.isValid() == false){
        return res.redirect('/website/market/edit.html?id=' + id + '&error=无效的结束日期格式');
    }
    if (ed.isBefore(sd)){
        return res.redirect('/website/market/edit.html?id=' + id + '&error=结束日期不能早于开始日期');
    }
    db.query('update t_markets set title=?,content=?,startdate=?,enddate=?,updatetime=now() where id=?',[title,content,sd.toDate(),ed.toDate(),id],function(err){
        if (err){
            console.error('在数据库中编辑优惠活动失败',err);
            return res.redirect('/website/market/edit.html?id=' + id + '&error=编辑优惠活动失败');
        }
        return res.redirect('/website/market/?info=编辑优惠活动成功');
    });
});

router.get('/del.html',function(req,res){
    if (!rbaccore.haspermission('website_market_del',req,res)){
        return;
    }
    var id = req.query.id;
    if (!id){
        return res.redirect('/website/market/?error=无法删除优惠活动');
    }
    db.query('delete from t_markets where id = ?',[id],function(err){
        if (err){
            console.error('在数据库删除优惠活动失败',err);
            return res.redirect('/website/market/?error=删除优惠活动失败');
        }
        return res.redirect('/website/market/?info=删除优惠活动成功');
    });
});

router.get('/view.html',function(req,res){
    if (!rbaccore.haspermission('website_market_view',req,res)){
        return;
    }
    var id = req.query.id;
    if (!id){
        return res.redirect('/website/market/?error=无法查看优惠活动');
    }
    db.query('select * from t_markets where id = ?',[id],function(err,result){
        if (err){
            console.error('在数据库读取优惠活动错误',err);
            return res.redirect('/website/market/?error=无法查看优惠活动');
        }
        if (result.length == 0){
            return res.redirect('/website/market/?error=无法查看优惠活动');
        }
        return res.render('website/market/view',{
            article:result[0]
        });
    });
});

module.exports = router;