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
    return res.render('store/productUnit/index',{
        info:req.query.info,
        error:req.query.error
    });
});

router.post('/list.html',function(req,res) {

  var msFromSql = `t_product join t_product_unit
    on t_product.id = t_product_unit.productId WHERE 1=1`

  // if(req.body['MysSearch_0']) {
  //   msFromSql += ` AND t_category.name = '${req.body['MysSearch_0']}' `
  // }

  var tabledefinition = {
      sTableName: 't_product_unit',
      sCountColumnName:'id',
      sSelectSql: `t_product_unit.id, t_product.name, t_product_unit.stock`,
      sFromSql: msFromSql,
      aoColumnDefs: [
            { mData: 'name', bSearchable: false },
            { mData: 'stock', bSearchable: false },
            { mData: 'id', bSearchable: false},
            { mData: null, bSearchable: false}
        ]};
    return dataquery.pagedataDeer(tabledefinition,req,res);
});


router.get('/add.html',function(req,res){
  return async.parallel({
      product: function(callback){
          var sql = `
          select name, id from t_product
          `
          db.query(sql,function(err,result){
              if (err){
                  return callback(err);
              }
              if (result.length == 0){
                  return callback('无法找商品')
              }
              console.log(result[0])
              var productName = {};
              productName.id = []
              productName.name = []
              for (var i = 0; i < result.length; i++) {
                    productName.name.push(result[i].name);
                    productName.id.push(result[i].id)
              }
              var product = {name: productName.name, id: productName.id}
              return callback(null, product);
          });
      },
      property: function(callback){
          db.query('select name, id from t_property', function(err,result){
              if (err) {
                  return callback(err);
              }
              var propertyName = {};
              propertyName.id = []
              propertyName.name = []
              for (var i = 0;i < result.length;i++) {
                    propertyName.name.push(result[i].name);
                    propertyName.id.push(result[i].id)
              }
              var property = {name: propertyName.name, id: propertyName.id}
              callback(null, property);
          });
      }
  },function(err,results){
      if (err){
          console.error('在数据库查找失败',err);
          return res.redirect(`/store/productUnit/?error=${encodeURI('无法添加商品单元')}`);
      }
      console.log(results)
      return res.render('store/productUnit/add',{
          product:results.product,
          property:results.property,
          error:req.query.error
      });
  });
});

router.get('/edit.html',function(req,res) {
  var productUnitId = req.query.id;
  if (!productUnitId) {
      return res.redirect(`/store/productUnit/edit.html?error=${encodeURI('商品单元ID不能为空')}`);
  }
  var sql = `
      select id, stock from t_product_unit
      where id = ?
      `
  db.query(sql, [productUnitId], function(err,result){
      console.log(err)
      if (err){
        return res.redirect(`/store/productUnit/?error=${encodeURI('无法修改商品单元')}`);
      }
      if (result.length == 0) {
        return res.redirect(`/store/productUnit/?error=${encodeURI('无法修改商品单元')}`);
      }
      return res.render('store/productUnit/edit',{
          productUnit : result[0],
          info:req.query.info,
          error:req.query.error
      });
  });
});

router.post('/edit.html',function(req,res) {
  var stock = req.body.stock;
  console.log(req.body)
  if (!stock){
      return res.redirect(`/store/productUnit/edit.html?error=${encodeURI('商品单元值不能为空')}`);
  }
  var productUnitId = req.body.productUnitId;
  if (!productUnitId) {
     return res.redirect(`/store/productUnit/edit.html?error=${encodeURI('ID不能为空')}`);
  }
  var sql = `
       update t_product_unit set stock = ? where id =?
      `
  db.query(sql, [stock, productUnitId], function(err,result) {
      console.log(err)
      if (err){
        return res.redirect(`/store/productUnit/?error=${encodeURI('无法修改商品单元')}`);
      }
      return res.redirect(`/store/productUnit/?info=${encodeURI('修改商品单元成功')}`);
  });
});

router.get('/del.html',function(req,res) {
  var name = req.query.name;
  var productUnitId = req.query.productUnitId;
  if (!productUnitId) {
      return res.redirect(`/store/productUnit/?error=${encodeURI('ID不能为空')}`);
  }
  return async.waterfall([
      function(callback) {
          var sql = `
           delete from t_product_unit_property where productUnitId = ?
          `
          db.query(sql, [productUnitId], function(err,result){
              if (err) {
                  return callback(err);
              }
              callback(null, result);
          });
      },
     function(result, callback) {
         var sql = `
          delete from t_product_unit where id = ?
         `
          db.query(sql, [productUnitId], function(err,tresult){
              if (err) {
                  return callback(err);
              }
              callback(null, tresult);
          });
      }
  ],function(err,results) {
      if (err){
          console.error('删除商品单元失败',err);
            return res.redirect(`/store/productUnit/?error=${encodeURI('无法删除商品单元')}`);
      }
     return res.redirect(`/store/productUnit/?info=${encodeURI('删除商品单元成功')}`);
  });
});


router.get('/propertyValue',function(req,res){
      var sql = `
      select id, value from t_property_value where propertyId =  ?
      `
      console.log(req.query)
      return db.query(sql, [req.query.id],function(err,result){
          if (err){
              console.error('在数据库中查询商品单元出错',err);
              return res.json({});
          }
          if (result.length == 0){
              return res.json({});
          }
          console.log(result[0])
          var propertyValueName = {};
          propertyValueName.id = []
          propertyValueName.name = []
          for (var i = 0;i < result.length;i++) {
                propertyValueName.name.push(result[i].value);
                propertyValueName.id.push(result[i].id)
          }
          var propertyValue = {name: propertyValueName.name, id: propertyValueName.id}
          console.log(propertyValue)
          return res.json({
                      propertyValue: propertyValue
                    });
      });
});

router.post('/add',function(req,res){
      var productData = JSON.parse(req.body.data)
      console.log('test', productData)
      if (!(productData.productId && productData.propertyId && productData.propertyValueId)) {
        return res.json({status: 0, message: '参数不能为空'});
      }

      return async.waterfall([
          function(callback) {
              var sql = `
               insert into t_product_unit(productId, stock)
               values(?,?)
              `
              db.query(sql, [productData.productId, productData.stock], function(err,result){
                  if (err) {
                      return callback(err);
                  }
                  console.log(result)
                  callback(null, result);
              });
          },
         function(result, callback) {
             var sql = `
              insert into t_product_unit_property(productUnitId, propertyId, propertyValueId)
              values(?,?,?)
             `
              db.query(sql, [result.insertId, productData.propertyId, productData.propertyValueId], function(err,tresult){
                  if (err) {
                      return callback(err);
                  }
                  callback(null, result);
              });
          }
      ],function(err,results) {
          if (err){
              console.error('添加商品单元失败',err);
              return res.json({status: 0, message: '添加失败'});
          }
         return res.json({status: 1});
      });

  });







module.exports = router;
