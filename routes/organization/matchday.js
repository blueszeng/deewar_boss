/**
 * Created by jimmychou on 15/1/8.
 */
var express = require('express')
var db = require('../../services/deerdb')
var async = require('async')
var dataquery = require('../../services/web/dataquery')
var rbaccore = require('../../services/rbac/core')
var encodeutil = require('../../utils/encode')
var moment = require('moment')
var router = express.Router();

router.get('/',function(req,res){
    if (!rbaccore.haspermission('organization_matchday',req,res)){
        return;
    }
    return res.render('organization/matchday/index',{
        info:req.query.info,
        error:req.query.error
    });
});

router.post('/list.html',function(req,res){
    if (!rbaccore.haspermission('organization_matchday',req,res)){
        return;
    }

    var msFromSql = `t_match_day join t_category on t_match_day.categoryId = t_category.id WHERE 1=1`

    if(req.body['MysSearch_0']) {
      msFromSql += ` AND t_category.name = '${req.body['MysSearch_0']}' `
    }
    if(req.body['MysSearch_1']) {
      msFromSql += ` AND startTime = '${req.body['MysSearch_1']}' `
    }
    if(req.body['MysSearch_2']) {
      msFromSql += ` AND betEndTime = '${req.body['MysSearch_2']}' `
    }
    var tabledefinition = {
        sTableName: 't_match_day',
        sCountColumnName:'id',
        sSelectSql: "t_match_day.id, t_category.name as categoryName, t_match_day.startTime, t_match_day.betEndTime",
        sFromSql: msFromSql,
        aoColumnDefs: [
            { mData: 'categoryName', bSearchable: true },
            { mData: 'startTime', bSearchable: true },
            { mData: 'betEndTime', bSearchable: true },
            { mData: 'id', bSearchable: true },
            { mData: null, bSearchable: true}
        ]};
        const ret = dataquery.pagedataDeer(tabledefinition,req,res);
        return res
});

router.get('/add.html',function(req,res){
    if (!rbaccore.haspermission('organization_matchday_add',req,res)){
        return;
    }
    db.query('select name from t_category where sportId = ?', [1], function(err,result){
        if (err) {
          console.error('在数据库中查比赛失败',err);
          return res.redirect(`/organization/matchday/add.html?error=${encodeURI('添加比赛失败')}`);
        }
        var categoryName = [];
        categoryName.push('')
        for (var i = 0;i < result.length;i++) {
            categoryName.push(result[i].name);
        }
        return res.render('organization/matchday/add',{
          category: {name: categoryName}
        })
    });
});

router.post('/add.html',function(req,res){
    if (!rbaccore.haspermission('organization_matchday_add',req,res)){
        return;
    }
    var categoryName = req.body.categoryId;
    if (!categoryName)　{　
        return res.redirect(`/organization/matchday/edit.html?error=${encodeURI('赛事不能为空')}`);
    }

    var startTime = req.body.startTime;
    if (!startTime)　{　
        return res.redirect(`/organization/matchday/edit.html?error=${encodeURI('启动时间不能为空')}`);
    }

    var betEndTime = req.body.betEndTime;
    if (!betEndTime)　{　
        return res.redirect(`/organization/matchday/edit.html?error=${encodeURI('启动时间不能为空')}`);
    }

    return db.query('select id from t_category where sportId = ? and name = ?', [1, categoryName], function(err,result){
        if (err) {
          console.error('在数据库中添加比赛失败',err);
          return res.redirect(`/organization/matchday/edit.html?error=${encodeURI('编辑比赛失败')}`);
        }
       db.query('insert into  t_match_day(categoryId, startTime, betEndTime ) value(?, ?, ?)', [result[0].id ,req.body.startTime, req.body.betEndTime],function(err){
          if (err){
              console.error('在数据库中添加比赛失败',err);
              return res.redirect(`/organization/matchday/edit.html?error=${encodeURI('编辑比赛失败')}`);
          }
          return res.redirect(`/organization/matchday/?info=${encodeURI('添加比赛成功')}`);
      });
  });
});

router.get('/edit.html',function(req,res){
    if (!rbaccore.haspermission('organization_matchday_edit',req,res)){
        return;
    }
    var matchdayId = req.query.id;
    console.log(req.query)
    if (!matchdayId){
        return res.redirect(`/organization/matchday/?error=${encodeURI('无法编辑比赛')}`);
    }
    return async.parallel({
        matchday:function(callback){
            var sql = `
            select * from t_match_day where id = ?
            `
            db.query(sql,[matchdayId],function(err,result){
                if (err){
                    return callback(err);
                }
                if (result.length == 0){
                    return callback('无法找到赛事')
                }
                console.log(result[0])
                return callback(null,{
                  id: result[0].id,
                  categoryId: result[0].categoryId,
                  startTime: moment(result[0].startTime).format('YYYY-MM-DD HH:mm:ss'),
                  betEndTime: moment(result[0].betEndTime).format('YYYY-MM-DD HH:mm:ss')
                });
            });
        },
        category:function(callback){
            db.query('select name from t_category where sportId = ?', [1], function(err,result){
                if (err) {
                    return callback(err);
                }
                var categoryName = [];
                categoryName.push('')
                for (var i = 0;i < result.length;i++){
                    categoryName.push(result[i].name);
                }
                callback(null, {name: categoryName});
            });
        }
    },function(err,results){
        if (err){
            console.error('在数据库查找比赛失败',err);
            return res.redirect(`/organization/matchday/?error=${encodeURI('无法编辑比赛')}`);
        }
        return res.render('organization/matchday/edit',{
            matchday:results.matchday,
            category:results.category,
            error:req.query.error
        });
    });
});

router.post('/edit.html',function(req,res){
    if (!rbaccore.haspermission('organization_matchday_edit',req, res)){
        return;
    }
    console.log('aaa--->', req.body)
    var matchdayId = req.body.matchdayId;
    if (!matchdayId){
        return res.redirect(`/organization/matchday/?error=${encodeURI('无法编辑比赛')}`);
    }
    var categoryName = req.body.categoryId;
    if (!categoryName)　{　
        return res.redirect(`/organization/matchday/edit.html?error=${encodeURI('赛事不能为空')}`);
    }

    var startTime = req.body.startTime;
    if (!startTime)　{　
        return res.redirect(`/organization/matchday/edit.html?error=${encodeURI('启动时间不能为空')}`);
    }

    var betEndTime = req.body.betEndTime;
    if (!betEndTime)　{　
        return res.redirect(`/organization/matchday/edit.html?error=${encodeURI('启动时间不能为空')}`);
    }


    return db.query('select id from t_category where sportId = ? and name = ?', [1, categoryName], function(err,result){
        if (err) {
          console.error('在数据库中修改比赛失败',err);
          return res.redirect(`/organization/matchday/edit.html?error=${encodeURI('编辑比赛失败')}`);
        }
       db.query('update t_match_day set categoryId = ?, startTime = ?, betEndTime = ? where id = ?',
        [result[0].id ,req.body.startTime, req.body.betEndTime, matchdayId],function(err){
          if (err){
              console.error('在数据库中修改比赛失败',err);
              return res.redirect(`/organization/matchday/edit.html?error=${encodeURI('编辑比赛失败')}`);
          }
          return res.redirect(`/organization/matchday/?info=${encodeURI('编辑比赛成功')}`);
      });
  });
});


router.get('/del.html',function(req,res){
    if (!rbaccore.haspermission('organization_matchday_del',req,res)){
        return;
    }
    var matchdayId = req.query.matchdayId;
    if (!matchdayId){
        return res.redirect(`/organization/matchday/?error=${encodeURI('无法删除比赛')}`);
    }

    var sql = `
      delete from t_game where matchdayId = ?
    `
    db.query(sql,[matchdayId],function(err) {
        if (err) {
            return res.redirect(`/organization/matchday/?info=${encodeURI('删除比赛失败')}`);
        }
        var sql = `delete  from t_match_day  where id = ?`
        db.query(sql, [matchdayId], function(err) {
            return res.redirect(`/organization/matchday/?info=${encodeURI('删除比赛成功')}`);
        });

    });


  });


module.exports = router;
