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
    if (!rbaccore.haspermission('organization_game',req,res)){
        return;
    }
    return res.render('organization/game/index',{
        info:req.query.info,
        error:req.query.error
    });
});

router.post('/list.html',function(req,res){
    if (!rbaccore.haspermission('organization_game',req,res)){
        return;
    }
    var msFromSql = `t_game join t_category join t_team as t_host_team join t_team as t_guest_team join t_match_day
ON t_game.categoryId = t_category.id AND t_game.hostTeamId = t_host_team.id and  t_game.guestTeamId = t_guest_team.id
AND t_game.matchDayId = t_match_day.id WHERE 1=1`

    if(req.body['MysSearch_0']) {
      msFromSql += ` AND t_category.name = '${req.body['MysSearch_0']}' `
    }
    if(req.body['MysSearch_1']) {
      msFromSql += ` AND t_host_team.name = '${req.body['MysSearch_1']}' `
    }
    if(req.body['MysSearch_2']) {
      msFromSql += ` AND t_guest_team.name = '${req.body['MysSearch_2']}' `
    }
    if(req.body['MysSearch_3']) {
      msFromSql += ` AND t_game.matchDayId = '${req.body['MysSearch_3']}' `
    }
    var tabledefinition = {
        sTableName: 't_match_day',
        sCountColumnName:'id',
        sSelectSql: `t_game.id, t_category.name as categroy, t_host_team.name as hostTeam, t_guest_team.name as guestTeam, t_match_day.startTime as matchDay, t_game.name
              , t_game.startTime, t_game.ext`,
        sFromSql: msFromSql,
        aoColumnDefs: [
            { mData: 'categroy', bSearchable: true },
            { mData: 'hostTeam', bSearchable: true },
            { mData: 'guestTeam', bSearchable: true },
            { mData: 'matchDay', bSearchable: true },
            { mData: 'name', bSearchable: true },
            { mData: 'startTime', bSearchable: true },
            { mData: 'ext', bSearchable: true },
            { mData: 'id', bSearchable: true },
            { mData: null, bSearchable: true}
        ]};

        const ret = dataquery.pagedataDeer(tabledefinition,req,res);
        return res
});

router.get('/add.html',function(req,res){
    if (!rbaccore.haspermission('organization_game_add',req,res)){
        return;
    }
    return async.waterfall([
        function(callback){
            db.query('select name from t_category where sportId = ?', [1], function(err,cresult){
                if (err) {
                    return callback(err);
                }
                var categoryName = [];
                categoryName.push('')
                for (var i = 0;i < cresult.length;i++){
                    categoryName.push(cresult[i].name);
                }
                var result = {}
                result['category'] = {name: categoryName}
                callback(null, result);
            });
        },
       function(result, callback){
            db.query('select name from t_team', function(err,tresult){
                if (err) {
                    return callback(err);
                }
                var teamName = [];
                teamName.push('')
                for (var i = 0;i < tresult.length;i++){
                    teamName.push(tresult[i].name);
                }
                result['team'] = {name: teamName}
                callback(null, result);
            });
        },
        function(result, callback){
            db.query('select startTime from t_match_day where startTime > now()', function(err,mresult){
                if (err) {
                    return callback(err);
                }
                var matchdayName = [];
                matchdayName.push('')
                for (var i = 0;i < mresult.length;i++) {
                    matchdayName.push(moment(mresult[i].startTime).format('YYYY-MM-DD'));

                }
                result['matchday'] = {name: matchdayName}
                callback(null, result);
            });
        }
    ],function(err,results){
        if (err){
            console.error('在数据库查找游戏失败',err);
            return res.redirect(`/organization/game/?error=${encodeURI('无法增加游戏')}`);
        }
        return res.render('organization/game/add',{
            category:results.category,
            team: results.team,
            matchday: results.matchday,
            error:req.query.error
        });
    });

});

router.post('/add.html',function(req,res){
    if (!rbaccore.haspermission('organization_game_add',req,res)){
        return;
    }
      console.log( req.body)
    var categoryName = req.body.categoryId;
    if (!categoryName)　{　
        return res.redirect(`/organization/game/add.html?gameId=' + req.body.gameId　+ '&error=${encodeURI('赛事不能为空')}`);
    }

    var hostTeam = req.body.hostTeamId;
    if (!hostTeam)　{　
        return res.redirect(`/organization/game/add.html?gameId=' + req.body.gameId　+ '&error=${encodeURI('主场不能为空')}`);
    }

    var guestTeam = req.body.guestTeamId;
    if (!guestTeam)　{　
        return res.redirect(`/organization/game/add.html?gameId=' + req.body.gameId　+ '&error=${encodeURI('客场不能为空')}`);
    }

    var matchDayId = req.body.matchDayId;
    if (!matchDayId)　{　
        return res.redirect(`/organization/game/add.html?gameId=' + req.body.gameId　+ '&error=${encodeURI('比赛场次不能为空')}`);
    }

    var name = req.body.name;
    if (!name)　{　
        return res.redirect(`/organization/game/add.html?gameId=' + req.body.gameId　+ '&error=${encodeURI('游戏名不能为空')}`);
    }

    var startTime = req.body.startTime;
    if (!startTime)　{　
        return res.redirect(`/organization/game/add.html?gameId=' + req.body.gameId　+ '&error=${encodeURI('游戏启动时间不能为空')}`);
    }

    return async.waterfall([
        function(callback){
            var sql = `
            select id from t_category where sportId = ? and name = ?
            `
            db.query(sql,[1, categoryName],function(err,cresult){
                if (err){
                    return callback(err);
                }
                if (cresult.length == 0){
                    return callback('无法找到赛事')
                }
                var result = []
                result['category'] = {id : cresult[0].id }
                return callback(null,result)
              });
        },
        function(result, callback){
            db.query('select id from t_team where name = ?', [hostTeam], function(err,tresult){
                if (err) {
                    return callback(err);
                }
                console.log("aaaaa", hostTeam)
                result['hostTeam'] = {id: tresult[0].id}
                callback(null, result);
            });
        },
       function(result, callback){
            db.query('select id from t_team where name = ?',[guestTeam],  function(err,tresult){
                if (err) {
                    return callback(err);
                }
                result['guestTeam'] = {id: tresult[0].id}
                callback(null, result);
            });
        },
      function(result, callback){
           db.query(`select id from t_match_day where startTime like '${matchDayId}%'`,  function(err,mresult){
               if (err) {
                   return callback(err);
               }
               result['matchDay'] = {id: mresult[0].id}
               callback(null, result);
           });
       }
    ],function(err,results){
        if (err){
            console.error('在数据库查找游戏失败',err);
            return res.redirect(`/organization/game/?error=${encodeURI('无法新增游戏')}`);
        }
        else {
          var sql = `
            insert into
            t_game(categoryId, hostTeamId, guestTeamId, matchDayId, name, startTime, ext, updatedTime, stadium)
            value(?,?,?,?,?,?,?,now(),?)
          `
          var stadiumList = ['上海市体育馆', '北京中心体育馆', '辽宁省体育馆']
          var index = Math.floor(Math.random()*3)
          db.query(sql, [results['category'].id,results['hostTeam'].id,
            results['guestTeam'].id, results['matchDay'].id, name, startTime, req.body.ext, stadiumList[index]],  function(err,tresult){
              if (err) {
                console.log(err)
                return res.redirect(`/organization/game/?error=${encodeURI('无法新增游戏')}`);
              }
              return res.redirect(`/organization/game/?info=${encodeURI('新增游戏' + '成功')}`);
          });
        }

    });
});

router.get('/edit.html',function(req,res){
    if (!rbaccore.haspermission('organization_game_edit',req,res)){
        return;
    }
    var gameId = req.query.id;
    console.log(req.query)
    if (!gameId){
        return res.redirect(`/organization/game/?error=${encodeURI('无法编辑游戏')}`);
    }
    return async.waterfall([
        function(callback){
            var sql = `
            select * from t_game where id = ?
            `
            db.query(sql,[gameId],function(err,gresult){
                if (err){
                    return callback(err);
                }
                if (gresult.length == 0){
                    return callback('无法找到游戏')
                }
                return callback(null,{
                  game: {
                  id: gresult[0].id,
                  categoryId: gresult[0].categoryId,
                  hostTeamId:  gresult[0].hostTeamId,
                  guestTeamId:  gresult[0].guestTeamId,
                  matchDayId:  gresult[0].matchDayId,
                  name:  gresult[0].name,
                  startTime: moment(gresult[0].startTime).format('YYYY-MM-DD HH:mm:ss'),
                  ext:  gresult[0].ext
                }
              });
            });
        },
        function(result, callback){
            db.query('select name from t_category where sportId = ?', [1], function(err,cresult){
                if (err) {
                    return callback(err);
                }
                var categoryName = [];
                categoryName.push('')
                for (var i = 0;i < cresult.length;i++){
                    categoryName.push(cresult[i].name);
                }
                result['category'] = {name: categoryName}
                callback(null, result);
            });
        },
       function(result, callback){
            db.query('select name from t_team', function(err,tresult){
                if (err) {
                    return callback(err);
                }
                var teamName = [];
                teamName.push('')
                for (var i = 0;i < tresult.length;i++){
                    teamName.push(tresult[i].name);
                }
                result['team'] = {name: teamName}
                callback(null, result);
            });
        },
        function(result, callback){
            db.query('select id,startTime from t_match_day', function(err,mresult){
                if (err) {
                    return callback(err);
                }
                var matchdayName = {};
                matchdayName.id = {}
                matchdayName.name = []
                for (var i = 0;i < mresult.length;i++){
                      matchdayName.name.push(moment(mresult[i].startTime).format('YYYY-MM-DD'))
                      matchdayName.id[mresult[i].id] = i
                }
                result['matchday'] = {name: matchdayName.name, id: matchdayName.id}
                callback(null, result);
            });
        }
    ],function(err,results){
        if (err){
            console.error('在数据库查找游戏失败',err);
            return res.redirect(`/organization/game/?error=${encodeURI('无法编辑游戏')}`)
        }
        return res.render('organization/game/edit',{
            game:results.game,
            category:results.category,
            team: results.team,
            matchday: results.matchday,
            error:req.query.error
        });
    });
});

router.post('/edit.html',function(req,res){
    if (!rbaccore.haspermission('organization_game_edit',req,res)){
        return;
    }
    console.log(req.body)

    var gameId = req.body.gameId;
    if (!gameId){
        return res.redirect(`/organization/game/?error=${encodeURI('无法编辑游戏')}`);
    }
    var categoryName = req.body.categoryId;
    if (!categoryName)　{　
        return res.redirect(`/organization/game/edit.html?gameId=' + req.body.gameId　+ '&error=${encodeURI('赛事不能为空')}`);
    }

    var hostTeam = req.body.hostTeamId;
    if (!hostTeam)　{　
        return res.redirect(`/organization/game/edit.html?gameId=' + req.body.gameId　+ '&error=${encodeURI('主场不能为空')}`);
    }

    var guestTeam = req.body.guestTeamId;
    if (!guestTeam)　{　
        return res.redirect(`/organization/game/edit.html?gameId=' + req.body.gameId　+ '&error=${encodeURI('客场不能为空')}`);
    }

    var matchDayId = req.body.matchDayId;
    if (!matchDayId)　{　
        return res.redirect(`/organization/game/edit.html?gameId=' + req.body.gameId　+ '&error=${encodeURI('比赛场次不能为空')}`);
    }

    var name = req.body.name;
    if (!name)　{　
        return res.redirect(`/organization/game/edit.html?gameId=' + req.body.gameId　+ '&error=${encodeURI('游戏名不能为空')}`);
    }

    var startTime = req.body.startTime;
    if (!startTime)　{　
        return res.redirect(`/organization/game/edit.html?gameId=' + req.body.gameId　+ '&error=${encodeURI('游戏启动时间不能为空')}`);
    }


    return async.waterfall([
        function(callback){
            var sql = `
            select id from t_category where sportId = ? and name = ?
            `
            db.query(sql,[1, categoryName],function(err,cresult){
                if (err){
                    return callback(err);
                }
                if (cresult.length == 0){
                    return callback('无法找到赛事')
                }
                var result = []
                result['category'] = {id : cresult[0].id }
                return callback(null,result)
              });
        },
        function(result, callback){
            db.query('select id from t_team where name = ?', [hostTeam], function(err,tresult){
                if (err) {
                    return callback(err);
                }
                result['hostTeam'] = {id: tresult[0].id}
                callback(null, result);
            });
        },
       function(result, callback){
            db.query('select id from t_team where name = ?',[guestTeam],  function(err,tresult){
                if (err) {
                    return callback(err);
                }
                var teamName = [];
                teamName.push('')
                for (var i = 0;i < tresult.length;i++){
                    teamName.push(tresult[i].name);
                }
                result['guestTeam'] = {id: tresult[0].id}
                callback(null, result);
            });
        },
      function(result, callback){
           db.query(`select id from t_match_day where startTime like '${matchDayId}%'`,  function(err,mresult){
               if (err) {
                   return callback(err);
               }
               result['matchDay'] = {id: mresult[0].id}
               callback(null, result);
           });
       }

    ],function(err,results){
        if (err){
            console.error('在数据库查找游戏失败',err);
            return res.redirect(`/organization/game/?error=${encodeURI('无法编辑游戏')}`)
        }
        else {
          var sql = `
          update t_game set
          categoryId = ?, hostTeamId = ?, guestTeamId = ?, matchDayId = ?, name = ?,
          startTime = ?, ext = ?, updatedTime = now() where id = ?
          `
          db.query(sql, [results['category'].id,results['hostTeam'].id,results['guestTeam'].id, results['matchDay'].id, name, startTime, req.body.ext, gameId],  function(err,tresult){
              if (err) {
                console.log(err)
                return res.redirect(`/organization/game/?error=${encodeURI('无法编辑游戏')}`);
              }
              return res.redirect(`/organization/game/?info=${encodeURI('编辑游戏成功')}`);
          });
        }

    });
});



router.get('/del.html',function(req,res){
    if (!rbaccore.haspermission('organization_game_del',req,res)){
        return;
    }
    var gameId = req.query.gameId;
    if (!gameId){
        return res.redirect(`/organization/game/?error=${encodeURI('无法删除游戏')}`);
    }
    var sql = `delete  from t_game  where id = ?`
    db.query(sql,[gameId],function(err){
        return res.redirect(`/organization/game/?info=${encodeURI('删除游戏成功')}`);
      });
  });


module.exports = router;
