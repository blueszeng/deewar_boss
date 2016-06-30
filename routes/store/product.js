/**
 * Created by jimmychou on 15/1/8.
 */
var express = require('express')
var db = require('../../services/deerdb')
var dataquery = require('../../services/web/dataquery')
var rbaccore = require('../../services/rbac/core')
var encodeutil = require('../../utils/encode')
var async = require('async')
var router = express.Router();

router.get('/',function(req,res){
    return res.render('store/product/index',{
        info:req.query.info,
        error:req.query.error
    });
});

router.post('/list.html',function(req,res) {
    var tabledefinition = {
        sTableName: 't_product',
        sCountColumnName:'id',
        aoColumnDefs: [
            { mData: 'name', bSearchable: true },
            { mData: 'description', bSearchable: false},
            { mData: 'unitDeerPointPrice', bSearchable: false},
            { mData: 'unitCashPrice', bSearchable: false},
            { mData: 'discount', bSearchable: false},
            { mData: 'imageUrl', bSearchable: false},
            { mData: 'id', bSearchable: false},
            { mData: null, bSearchable: false}
        ]};
    return dataquery.pagedataDeer(tabledefinition,req,res);
});


router.get('/add.html',function(req,res){
    return res.render('store/product/add',{
        info:req.query.info,
        error:req.query.error
    });
});

router.post('/add.html',function(req,res) {
    var name = req.body.name;
    var description = req.body.description;
    var unitDeerPointPrice = req.body.unitDeerPointPrice;
    var unitCashPrice = req.body.unitCashPrice;
    var discount = req.body.discount;
    var imageUrl = req.body.imageUrl;
    var nullParaList = [name, unitDeerPointPrice, unitCashPrice, discount, imageUrl]
    console.log(req.body)
    for (var i =0; i < nullParaList.length; i ++) {
      if (!nullParaList[i]) {
        return res.redirect(`/store/product/add.html?error=${encodeURI('有不合法的空参数')}`);
      }
    }
    var sql = `
        insert into t_product(name, description, unitDeerPointPrice, unitCashPrice, discount, imageUrl)
        value(?,?,?,?,?,?)
        `
    db.query(sql,[name, description, unitDeerPointPrice, unitCashPrice, discount, imageUrl],function(err,result) {
        console.log(err)
        if (err){
            return res.redirect(`/store/product/?error=${encodeURI('无法添加商品')}`);
        }
        return res.redirect(`/store/product/?info=${encodeURI('添加商品成功')}`);
    });
});


router.get('/edit.html',function(req,res) {
  var productId = req.query.id;
  if (!productId) {
      return res.redirect(`/store/product/edit.html?error=${encodeURI('编辑商品传入ID不能为空')}`);
  }
  var sql = `
      select * from  t_product where id  = ?
      `
  db.query(sql, [productId], function(err,result){
      console.log(err)
      if (err){
        return res.redirect(`/store/product/?error=${encodeURI('无法修改商品')}`);
      }
      if (result.length == 0) {
        return res.redirect(`/store/product/?error=${encodeURI('无法修改商品')}`);
      }
      return res.render('store/product/edit',{
          product : result[0],
          info:req.query.info,
          error:req.query.error
      });
  });
});

router.post('/edit.html',function(req,res) {
  var productId = req.body.productId;
  var name = req.body.name;
  var description = req.body.description;
  var unitDeerPointPrice = req.body.unitDeerPointPrice;
  var unitCashPrice = req.body.unitCashPrice;
  var discount = req.body.discount;
  var imageUrl = req.body.imageUrl;
  var nullParaList = [productId, name, unitDeerPointPrice, unitCashPrice, discount, imageUrl]
  console.log(req.body)
  for (var i =0; i < nullParaList.length; i ++) {
    if (!nullParaList[i]) {
      return res.redirect(`/store/product/add.html?error=${encodeURI('有不合法的空参数')}`);
    }
  }
  var sql = `
      update t_product set name = ?, description = ?,
       unitDeerPointPrice = ?, unitCashPrice = ?, discount = ?, imageUrl = ? where id = ?
      `
  db.query(sql, [name, description, unitDeerPointPrice, unitCashPrice, discount, imageUrl, productId], function(err,result) {
      console.log(err)
      if (err){
        return res.redirect(`/store/product/?error=${encodeURI('无法修改商品')}`);
      }
      return res.redirect(`/store/product/?info=${encodeURI('修改商品成功')}`);
  });
});

router.get('/del.html',function(req,res) {
  var name = req.query.name;
  var productId = req.query.productId;
  if (!productId) {
      return res.redirect(`/store/product/?error=${encodeURI('删除传入的ID为空')}`);
  }
  var sql = `
      delete from  t_product where id = ?
      `
  db.query(sql, [productId], function(err,result) {
      console.log(err)
      if (err){
        return res.redirect(`/store/product/?error=${encodeURI('无法删除商品')}`);
      }
      return res.redirect(`/store/product/?info=${encodeURI('删除商品成功')}`);
  });
});



module.exports = router;
