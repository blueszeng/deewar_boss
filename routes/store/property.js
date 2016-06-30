/**
 * Created by jimmychou on 15/1/8.
 */
var express = require('express');
var db = require('../../services/deerdb');
var dataquery = require('../../services/web/dataquery');
var rbaccore = require('../../services/rbac/core');
var encodeutil = require('../../utils/encode');
var async = require('async');
var router = express.Router();

router.get('/',function(req,res){
    return res.render('store/property/index',{
        info:req.query.info,
        error:req.query.error
    });
});

router.post('/list.html',function(req,res) {
    var tabledefinition = {
        sTableName: 't_property',
        sCountColumnName:'id',
        aoColumnDefs: [
            { mData: 'name', bSearchable: true },
            { mData: 'id', bSearchable: false},
            { mData: null, bSearchable: false}
        ]};
    return dataquery.pagedataDeer(tabledefinition,req,res);
});


router.get('/add.html',function(req,res){
    return res.render('store/property/add',{
        info:req.query.info,
        error:req.query.error
    });
});

router.post('/add.html',function(req,res){
    var name = req.body.name;
    if (!name){
        return res.redirect(`/store/property/add.html?error=${encodeURI('属性名不能为空')}`);
    }
    var sql = `
        insert into t_property(name)
        value(?)
        `
    db.query(sql,[name],function(err,result){
        console.log(err)
        if (err){
            return res.redirect(`/store/property/?error=${encodeURI('无法添加属性')}`);
        }
        return res.redirect(`/store/property/?info=${encodeURI('添加属性成功')}`);
    });
});


router.get('/edit.html',function(req,res) {
  var propertyId = req.query.id;
  if (!propertyId) {
      return res.redirect(`/store/property/edit.html?error=${encodeURI('属性名不能为空')}`);
  }
  var sql = `
      select * from  t_property where id  = ?
      `
  db.query(sql, [propertyId], function(err,result){
      console.log(err)
      if (err){
        return res.redirect(`/store/property/?error=${encodeURI('无法修改属性')}`);
      }
      if (result.length == 0) {
        return res.redirect(`/store/property/?error=${encodeURI('无法修改属性')}`);
      }
      return res.render('store/property/edit',{
          property : result[0],
          info:req.query.info,
          error:req.query.error
      });
  });
});

router.post('/edit.html',function(req,res) {
  var name = req.body.name;
  if (!name){
      return res.redirect(`/store/property/edit.html?error=${encodeURI('属性名不能为空')}`);
  }
  var propertyId = req.body.propertyId;
  if (!propertyId) {
     return res.redirect(`/store/property/edit.html?error=${encodeURI('ID不能为空')}`);
  }
  var sql = `
      update t_property set name = ? where id = ?
      `
  db.query(sql, [name, propertyId], function(err,result) {
      console.log(err)
      if (err){
        return res.redirect(`/store/property/?error=${encodeURI('无法修改属性')}`);
      }
      return res.redirect(`/store/property/?info=${encodeURI('修改属性成功')}`);
  });
});

router.get('/del.html',function(req,res) {
  var name = req.query.name;
  var propertyId = req.query.propertyId;
  if (!propertyId) {
      return res.redirect(`/store/property/?error=${encodeURI('ID不能为空')}`);
  }
  var sql = `
      delete from  t_property where id = ?
      `
  db.query(sql, [propertyId], function(err,result) {
      console.log(err)
      if (err){
        return res.redirect(`/store/property/?error=${encodeURI('无法删除属性')}`);
      }
      return res.redirect(`/store/property/?info=${encodeURI('删除属性成功')}`);
  });
});



module.exports = router;
