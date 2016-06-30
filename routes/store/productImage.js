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
    return res.render('store/productImage/index',{
        info:req.query.info,
        error:req.query.error
    });
});

router.post('/list.html',function(req,res) {

  var msFromSql = `t_product join t_product_image
    on t_product.id = t_product_image.productId WHERE 1=1`

  // if(req.body['MysSearch_0']) {
  //   msFromSql += ` AND t_category.name = '${req.body['MysSearch_0']}' `
  // }
  // if(req.body['MysSearch_1']) {
  //   msFromSql += ` AND t_host_team.name = '${req.body['MysSearch_1']}' `
  // }
  // if(req.body['MysSearch_2']) {
  //   msFromSql += ` AND t_guest_team.name = '${req.body['MysSearch_2']}' `
  // }
  // if(req.body['MysSearch_3']) {
  //   msFromSql += ` AND t_game.matchDayId = '${req.body['MysSearch_3']}' `
  // }
  var tabledefinition = {
      sTableName: 't_product_image',
      sCountColumnName:'id',
      sSelectSql: `t_product_image.id, t_product.name, t_product_image.imageUrl`,
      sFromSql: msFromSql,
      aoColumnDefs: [
            { mData: 'name', bSearchable: true },
            { mData: 'imageUrl', bSearchable: true },
            { mData: 'id', bSearchable: false},
            { mData: null, bSearchable: false}
        ]};
    return dataquery.pagedataDeer(tabledefinition,req,res);
});


router.get('/add.html',function(req,res){
  var sql = ` select t_product.id, t_product.name
  from  t_product
  `
  db.query(sql, function(err,result){
      if (err) {
        return res.redirect(`/store/productImage/?error=${encodeURI('添加失败')}`);
      }
      var productName = {};
      productName.id = []
      productName.name = []
      for (var i = 0;i < result.length;i++){
            productName.name.push(result[i].name);
            productName.id.push(result[i].id)
      }
      var product = {name: productName.name, id: productName.id}
      return res.render('store/productImage/add',{
          info:req.query.info,
          error:req.query.error,
          productImage: product
      });
  });

});

router.post('/add',function(req,res){
      var productData = JSON.parse(req.body.data)
      console.log(productData)
      if (!productData.productId) {
        return res.json({status: 0, message: '属性名不能为空'});
      }
      var sql = `insert into t_product_image(productId, imageUrl)
      value(?,?)
      `
      db.query(sql,[productData.productId, productData.imageUrl],function(err) {
          if (err)
          {
            console.log(err)
            return res.json({status: 0, message: '添加失败'});
          }
        return res.json({status: 1});
     });
});

router.get('/edit.html',function(req,res) {
  var productId = req.query.id;
  if (!productId) {
      return res.redirect(`/store/productImage/edit.html?error=${encodeURI('属性ID不能为空')}`);
  }

  var sql = `
  select  t_product_image.id as productImageId, t_product.name, t_product_image.imageUrl
  from  t_product  join t_product_image
  on t_product.id = t_product_image.productId
  where t_product_image.id = ?
  `
  db.query(sql, [productId], function(err, result) {
      if (err) {
        return res.redirect(`/store/productImage/?error=${encodeURI('修改失败')}`);
      }
      console.log('aaa-->',productId, result )
      return res.render('store/productImage/edit',{
          info:req.query.info,
          error:req.query.error,
          productImage: result[0]
      });
  });

});

router.post('/edit.html',function(req,res) {
  var imageUrl = req.body.imageUrl;
  var productImageId = req.body.productImageId

  if (!imageUrl) {
     return res.redirect(`/store/productImage/edit.html?error=${encodeURI('商品图片不能为空')}`);
  }
  var sql = `
      update t_product_image set imageUrl = ? where id = ?
      `
  db.query(sql, [imageUrl, productImageId], function(err,result) {
      console.log(err)
      if (err){
        return res.redirect(`/store/productImage/?error=${encodeURI('无法修改属性')}`);
      }
      return res.redirect(`/store/productImage/?info=${encodeURI('修改属性成功')}`);
  });
});

router.get('/del.html',function(req,res) {
  var name = req.query.name;
  var productImageId = req.query.productImageId;
  if (!productImageId) {
      return res.redirect(`/store/productImage/?error=${encodeURI('ID不能为空')}`);
  }
  var sql = `
      delete from  t_product_image where id = ?
      `
  db.query(sql, [productImageId], function(err,result) {
      console.log(err)
      if (err){
        return res.redirect(`/store/productImage/?error=${encodeURI('无法删除属性')}`);
      }
      return res.redirect(`/store/productImage/?info=${encodeURI('删除属性成功')}`);
  });
});

module.exports = router;
