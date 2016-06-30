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
    return res.render('store/propertyValue/index',{
        info:req.query.info,
        error:req.query.error
    });
});

router.post('/list.html',function(req,res) {

  var msFromSql = `t_property join t_property_value
    on t_property.id = t_property_value.propertyId WHERE 1=1`

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
      sTableName: 't_property_value',
      sCountColumnName:'id',
      sSelectSql: `t_property_value.id, t_property.name, t_property_value.value, t_property_value.description`,
      sFromSql: msFromSql,
      aoColumnDefs: [
            { mData: 'name', bSearchable: true },
            { mData: 'value', bSearchable: true },
            { mData: 'description', bSearchable: true },
            { mData: 'id', bSearchable: false},
            { mData: null, bSearchable: false}
        ]};
    return dataquery.pagedataDeer(tabledefinition,req,res);
});


router.get('/add.html',function(req,res){
  db.query('select id, name from t_property', function(err,result){
      if (err) {
          return res.redirect(`/store/propertyValue/?error=${encodeURI('添加失败')}`);
      }
      var propertyName = {};
      propertyName.id = []
      propertyName.name = []
      for (var i = 0;i < result.length;i++){
            propertyName.name.push(result[i].name);
            propertyName.id.push(result[i].id)
      }
      var property = {name: propertyName.name, id: propertyName.id}
      return res.render('store/propertyValue/add',{
          info:req.query.info,
          error:req.query.error,
          property: property
      });
  });

});

router.post('/add',function(req,res){
      var propertyData = JSON.parse(req.body.data)
      console.log(propertyData)
      if (!propertyData.propertyId) {
        return res.json({status: 0, message: '属性名不能为空'});
      }
      var sql = `insert into t_property_value(propertyId, value, description)
      value(?,?,?)
      `
      db.query(sql,[propertyData.propertyId, propertyData.value, propertyData.description],function(err) {
          if (err)
          {
            console.log(err)
            return res.json({status: 0, message: '添加失败'});
          }
        return res.json({status: 1});
     });
});

router.get('/edit.html',function(req,res) {
  var propertyId = req.query.id;
  if (!propertyId) {
      return res.redirect(`/store/propertyValue/edit.html?error=${encodeURI('属性ID不能为空')}`);
  }
  var sql = `
    select t_property.name, t_property_value.id, t_property_value.value,t_property_value.description
     from t_property join t_property_value
     on t_property.id = t_property_value.propertyId  where t_property_value.id  = ?
      `
  db.query(sql, [propertyId], function(err,result){
      console.log(err)
      if (err){
        return res.redirect(`/store/propertyValue/?error=${encodeURI('无法修改属性')}`);
      }
      console.log(result, propertyId)
      if (result.length == 0) {
        return res.redirect(`/store/propertyValue/?error=${encodeURI('无法修改属性')}`);
      }
      return res.render('store/propertyValue/edit',{
          propertyValue : result[0],
          info:req.query.info,
          error:req.query.error
      });
  });
});

router.post('/edit.html',function(req,res) {
  var value = req.body.value;
  if (!value){
      return res.redirect(`/store/propertyValue/edit.html?error=${encodeURI('属性值不能为空')}`);
  }
  var propertyValueId = req.body.propertyValueId;
  if (!propertyValueId) {
     return res.redirect(`/store/propertyValue/edit.html?error=${encodeURI('ID不能为空')}`);
  }
  var sql = `
      update t_property_value set value = ?, description = ? where id = ?
      `
  db.query(sql, [value, req.body.description, propertyValueId], function(err,result) {
      console.log(err)
      if (err){
        return res.redirect(`/store/propertyValue/?error=${encodeURI('无法修改属性')}`);
      }
      return res.redirect(`/store/propertyValue/?info=${encodeURI('修改属性成功')}`);
  });
});

router.get('/del.html',function(req,res) {
  var name = req.query.name;
  var propertyValueId = req.query.propertyValueId;
  if (!propertyValueId) {
      return res.redirect(`/store/property/?error=${encodeURI('ID不能为空')}`);
  }
  var sql = `
      delete from  t_property_value where id = ?
      `
  db.query(sql, [propertyValueId], function(err,result) {
      console.log(err)
      if (err){
        return res.redirect(`/store/property/?error=${encodeURI('无法删除属性')}`);
      }
      return res.redirect(`/store/property/?info=${encodeURI('删除属性成功')}`);
  });
});

module.exports = router;
