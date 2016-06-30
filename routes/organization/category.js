/**
 * Created by jimmychou on 15/1/8.
 */
var express = require('express')
var db = require('../../services/deerdb')
var async = require('async')
var dataquery = require('../../services/web/dataquery')
var rbaccore = require('../../services/rbac/core')
var encodeutil = require('../../utils/encode')
var router = express.Router();

router.get('/', function(req, res) {
    if (!rbaccore.haspermission('organization_category', req, res)) {
        return;
    }
    return res.render('organization/category/index', {
        info: req.query.info,
        error: req.query.error
    });
});

router.post('/list.html', function(req, res) {
    if (!rbaccore.haspermission('organization_category', req, res)) {
        return;
    }
    var msFromSql = `t_category join t_sport on t_category.sportId = t_sport.id  WHERE 1=1`
    if (req.body['MysSearch_0']) {
        msFromSql += ` AND t_sport.name = '${req.body['MysSearch_0']}' `
    }
    console.log(req.body['MysSearch_0'], req.body['MysSearch_1'])
    if (req.body['MysSearch_1']) {
        msFromSql += ` AND t_category.name = '${req.body['MysSearch_1']}' `
    }
    var tabledefinition = {
        sTableName: 't_category',
        sCountColumnName: 'id',
        sSelectSql: "t_category.id, t_sport.name as sport, t_category.name, t_category.durationTime, t_category.logoUrl",
        sFromSql: msFromSql,
        aoColumnDefs: [{
            mData: 'sport',
            bSearchable: true
        }, {
            mData: 'name',
            bSearchable: true
        }, {
            mData: 'durationTime',
            bSearchable: true
        }, {
            mData: 'logoUrl',
            bSearchable: true
        }, {
            mData: 'id',
            bSearchable: true
        }, {
            mData: null,
            bSearchable: true
        }]
    };

    const ret = dataquery.pagedataDeer(tabledefinition, req, res);
    return res
});

router.get('/add.html', function(req, res) {
    if (!rbaccore.haspermission('organization_category_add', req, res)) {
        return;
    }
    db.query('select name from t_sport', function(err, result) {
        if (err) {
          console.error('在数据库中查找赛事失败',err);
          return res.redirect(`/organization/category/add.html?error=${encodeURI('添加赛事失败')}`);
        }
        var sportName = [];
        sportName.push('')
        for (var i = 0; i < result.length; i++) {
            sportName.push(result[i].name);
        }
        return res.render('organization/category/add',{
          sport: {name: sportName}
        });
    });

});

router.post('/add.html', function(req, res) {
    if (!rbaccore.haspermission('organization_category_add', req, res)) {
        return;
    }
    var sport = req.body.sportId;
    if (!sport) {
        return res.redirect(`/organization/category/?error=${encodeURI('无法添加赛事')}`);
    }
    var name = req.body.name;
    if (!name) {
        return res.redirect(`/organization/category/add.html?error=${encodeURI('赛事不能为空')}`);
    }
//    console.log(name.body)
    return db.query('select id from t_sport where name = ?', [sport], function(err,result){
        if (err) {
          console.error('在数据库中添加赛事失败',err);
          return res.redirect(`/organization/category/add.html?error=${encodeURI('添加赛事失败')}`);
        }
       db.query('insert into t_category(sportId, name, durationTime, logoUrl) value(?,?,?,?)',
        [result[0].id, req.body.name, req.body.durationTime, req.body.logoUrl],function(err, data){
          if (err){
              console.error('在数据库中添加赛事失败',err);
              return res.redirect(`/organization/category/add.html?error=${encodeURI('添加赛事失败')}`);
          }
          var sql = `insert into t_category_position_type
          value(?,1),(?,2),(?,3) `
          db.query(sql,[data.insertId, data.insertId, data.insertId],function(err){
             if (err){
                 console.error('在数据库中添加赛事失败',err);
                 return res.redirect(`/organization/category/add.html?error=${encodeURI('添加赛事失败')}`);
          }
          return res.redirect(`/organization/category/?info=${encodeURI('添加赛事成功')}`);
        });
      });
  });
});

router.get('/edit.html', function(req, res) {
    if (!rbaccore.haspermission('organization_category_edit', req, res)) {
        return;
    }
    var categoryId = req.query.id;
    if (!categoryId) {
        return res.redirect(`/organization/category/?error=${encodeURI('无法编辑赛事')}`);
    }
    return async.parallel({
        category: function(callback) {
            var sql = `
              select * from t_category where sportId = ? and id = ?
            `
            db.query(sql, [1, categoryId], function(err, result) {
                if (err) {
                    return callback(err);
                }
                if (result.length == 0) {
                    return callback('无法找到赛事')
                }
                return callback(null, result[0]);
            });
        },
        sport: function(callback) {
            db.query('select name from t_sport', function(err, result) {
                if (err) {
                    return callback(err);
                }
                var sportName = [];
                sportName.push('')
                for (var i = 0; i < result.length; i++) {
                    sportName.push(result[i].name);
                }
                callback(null, {
                    name: sportName
                });
            });
        }
    }, function(err, results) {
        if (err) {
            console.error('在数据库查找赛事失败', err);
            return res.redirect(`/organization/category/?error=${encodeURI('无法编辑赛事')}`);
        }
        return res.render('organization/category/edit', {
            category: results.category,
            sport: results.sport,
            error: req.query.error
        });

    });
});

router.post('/edit.html', function(req, res) {
    if (!rbaccore.haspermission('organization_category_edit', req, res)) {
        return;
    }
    var categoryId = req.body.categoryId;

    if (!categoryId) {
        return res.redirect(`/organization/category/?error=${encodeURI('无法编辑赛事')}`);
    }
    var sport = req.body.sportId;
    if (!sport) {
        return res.redirect(`/organization/category/?error=${encodeURI('无法编辑赛事')}`);
    }
    var name = req.body.name;
    if (!name) {
        return res.redirect(`/organization/category/edit.html?error=${encodeURI('赛事不能为空')}`);
    }
    return db.query('select id from t_sport where name = ?', [sport], function(err,result){
        if (err) {
          console.error('在数据库中修改赛事失败',err);
          return res.redirect(`/organization/category/edit.html?&error=${encodeURI('编辑赛事失败')}`);
        }
       db.query('update t_category set sportId = ?, name = ?, durationTime = ?, logoUrl = ? where id = ?',
        [result[0].id, req.body.name, req.body.durationTime, req.body.logoUrl, categoryId],function(err){
          if (err){
              console.error('在数据库中修改赛事失败',err);
              return res.redirect(`/organization/category/edit.html?&error=${encodeURI('编辑赛事失败')}`);
          }
          return res.redirect(`/organization/category/?info=${encodeURI('编辑赛事成功')}`);
      });
  });
});


router.get('/del.html', function(req, res) {
    if (!rbaccore.haspermission('organization_category_del', req, res)) {
        return;
    }
    var categoryId = req.query.categoryId;
    if (!categoryId) {
        return res.redirect(`/organization/category/?error=${encodeURI('无法删除赛事')}`);
    }

    var sql = `delete from t_category_position_type where categoryId = ? `
    db.query(sql,[categoryId],function(err){
       if (err){
           console.error('在数据库删除赛事失败',err);
           return res.redirect(`/organization/category/?error=${encodeURI('删除赛事失败')}`);
         }
         var sql = `delete  from t_category where id = ?`
         db.query(sql, [categoryId], function(err) {
           if (err) {
               return res.redirect(`/organization/category/?error=${encodeURI('删除赛事失败')}`);
           }
           return res.redirect(`/organization/category/?info=${encodeURI('删除赛事成功')}`);
         });
    });
});


module.exports = router;
