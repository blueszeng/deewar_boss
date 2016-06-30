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
    if (!rbaccore.haspermission('organization_dppg',req,res)){
        return;
    }
    return res.render('organization/dppg/index',{
        info:req.query.info,
        error:req.query.error
    });
});

router.post('/list.html',function(req,res){
    if (!rbaccore.haspermission('organization_dppg',req,res)){
        return;
    }
    var msFromSql = ` t_player_dppg join t_player join t_game on
     t_player.id = t_player_dppg.playerId and t_player_dppg.gameId = t_game.id where 1 =1`
    if(req.body['MysSearch_0']) {
      msFromSql += ` AND t_player.name = '${req.body['MysSearch_0']}' `
    }
    if(req.body['MysSearch_1']) {
      msFromSql += ` AND t_game.startTime = '${req.body['MysSearch_1']}' `
    }
    var tabledefinition = {
      sTableName: 't_player_dppg',
      sCountColumnName:'id',
      sSelectSql: `t_player.name as player, t_game.startTime as dppgStartTime, t_player_dppg.record, t_player_dppg.playerId, t_player_dppg.gameId`,
      sFromSql: msFromSql,
        aoColumnDefs: [
            { mData: 'player', bSearchable: true },
            { mData: 'dppgStartTime', bSearchable: true },
            { mData: 'record', bSearchable: true },
            { mData: 'playerId', bSearchable: true },
            { mData: 'gameId', bSearchable: true },
            { mData: null, bSearchable: true}
        ]};
        const ret = dataquery.pagedataDeer(tabledefinition,req,res);
        return res
});

router.get('/add.html',function(req,res){
    if (!rbaccore.haspermission('organization_dppg_add',req,res)){
        return;
    }
    return async.waterfall([
        function(callback){
            var sql = `
            select id, t_game.startTime  from t_game
            `
            db.query(sql, function(err,gresult){
                if (err) {
                    return callback(err);
                }
                var gameStartTime = {};
                gameStartTime.name = []
                gameStartTime.id = []
                for (var i = 0;i < gresult.length;i++){
                    var monentTime = moment(gresult[i].startTime).format('YYYY-MM-DD HH:mm:ss')
                    gameStartTime.name.push(monentTime);
                    gameStartTime.id.push(gresult[i].id)

                }
                var result = {}
                console.log(gameStartTime.id)
                result['game'] = {name: gameStartTime.name, id: gameStartTime.id}
                callback(null, result);
            });
        }
    ],function(err,results){
        if (err){
            console.error('在数据库查找游戏失败',err);
            return res.redirect(`/organization/dppg/?error=${encodeURI('无法增加dppg')}`);
        }
        return res.render('organization/dppg/add',{
            game:results.game,
            error:req.query.error
        });
    });

});

router.post('/add.html',function(req,res){
    if (!rbaccore.haspermission('organization_dppg_add',req,res)){
        return;
    }
    var name = req.body.name;
    if (!name){
        return res.redirect(`/organization/dppg/add.html?&error=${encodeURI('球队名不能为空')}`);
    }
    return db.query('insert into t_t_game(name, logoUrl, ext) value(?,?,?)',[name, req.body.logUrl, req.body.ext],function(err,result){
        if (err)　{
            console.error('在数据库中添加球队失败',err);
            return res.redirect(`/organization/dppg/add.html?error=${encodeURI('添加球员dppg失败')}`);
        }
        return res.redirect(`/organization/dppg/?info=${encodeURI('添加球员dppg成功')}`);
    });
});

router.get('/edit.html',function(req,res){
    if (!rbaccore.haspermission('organization_dppg_edit',req,res)){
        return;
    }
    var playerId = req.query.playerId;
    var gameId = req.query.gameId;
    if (!(playerId && gameId)){
        return res.redirect(`/organization/dppg/?error=${encodeURI('无法编辑dppg')}`);
    }
    var sql = `
        select t_player.name, t_player_dppg.record,
        t_player_dppg.playerId, t_player_dppg.gameId from t_player_dppg join t_player
        on t_player_dppg.playerId = t_player.id
        where t_player_dppg.playerId = ?
          and t_player_dppg.gameId = ?
        `
    db.query(sql,[playerId, gameId],function(err,result){
        if (err){
            return res.redirect(`/organization/dppg/?error=${encodeURI('无法编辑dppg')}`);
        }
        if (result.length == 0){
            res.redirect(`/organization/dppg/?error=${encodeURI('无法编辑dppg')}`);
        }

        var dppgData = JSON.parse(result[0].record);
        var dppg = {};
        dppg.name = result[0].name;
        dppg.record = dppgData;
        dppg.playerId = result[0].playerId
        dppg.gameId = result[0].gameId
        console.log(dppg)
        return res.render('organization/dppg/edit',{
            dppg: dppg
        });
    });
});

router.post('/edit.html',function(req,res){
    if (!rbaccore.haspermission('organization_dppg_edit',req,res)){
        return;
    }
    var query = req.body
    var playerId = query.playerId;
    var gameId = query.gameId;
    if (!(playerId && gameId)){
        return res.redirect(`/organization/dppg/?error=${encodeURI('无法编辑dppg')}`);
    }
    var record = {
      goals: query.goals, // 进球
      attack: query.attack,// 进攻
      shoot: query.shoot, // 射门
      shotsOnGoal: query.shotsOnGoal, // 射正
      accuratePass: query.accuratePass, // 准确传球
      extraordinary: query.extraordinary, // 过人
      gotFouled: query.gotFouled, // 被犯规
      foul: query.foul, // 犯规
      interception: query.interception,// 拦截
      steals: query.steals, // 抢断
      yellowCard: query.yellowCard, // 黄牌
      redCard: query.redCard, // 红牌
      ownBall: query.ownBall, // 乌龙
      judgment: query.judgment, // 失误
      saves: query.saves, // 扑救
      penaltyStopper: query.penaltyStopper // 扑点球
    };
    var recordKey = Object.keys(record)
      recordKey.forEach(function(key) {
      if (!record[key]) {
        record[key] = 0
      }
    });
    var templateRecord = `{"goals": ${record.goals},"attack": ${record.attack},"shoot": ${record.shoot},"shotsOnGoal": ${record.shotsOnGoal},"accuratePass": ${record.accuratePass},"extraordinary": ${record.extraordinary},"gotFouled": ${record.gotFouled},"foul": ${record.foul},"interception": ${record.interception},"steals": ${record.steals},"yellowCard": ${record.yellowCard},"redCard": ${record.redCard},"ownBall": ${record.ownBall},"judgment": ${record.judgment},"saves": ${record.saves},"penaltyStopper": ${record.penaltyStopper}}`
    var sql = ` update t_player_dppg
    set record = ? where playerId = ? and gameId = ?
    `
    return db.query(sql,
      [templateRecord, playerId, gameId],function(err,result){
        if (err){
            console.error('在数据库中修改dppg失败',err);
            return res.redirect(`/organization/dppg/edit.html?error=${encodeURI('编辑dppg失败')}`);
        }
        return res.redirect(`/organization/dppg/?info=${encodeURI('编辑dppg成功')}`);
    });
});


router.get('/del.html',function(req,res){
    if (!rbaccore.haspermission('organization_dppg_del',req,res)){
        return;
    }
    var dppgId = req.query.dppgId;
    if (!dppgId){
        return res.redirect(`/organization/dppg/?error=${encodeURI('无法删除球队')}`);
    }
    return async.waterfall([
        function(playerdppg){
          var sql = `delete  from t_dppg_player where dppgId = ?`
            db.query(sql,[dppgId],function(err){
                playerdppg(err);
            });
        },
        function(dppgDppg){
            var sql = `delete  from t_dppg where id = ?`
            db.query(sql,[dppgId],function(err){
              dppgDppg(err);
        });
      }
    ],function(err){
        if (err) {
              return res.render('organization/dppg/',{
                  error:'删除球队失败'
              });
            }
          return res.redirect(`/organization/dppg/?info=${encodeURI('删除人员' + req.query.name + '成功')}`);
          }
    );
  });

router.get('/team',function(req,res){
      var sql = `
      select t_game.hostTeamId, t_game.guestTeamId, hostTeam.name as hostTeamName, guestTeam.name as guestTeamName
      from t_game join t_team as hostTeam join t_team as guestTeam
      on t_game.hostTeamId = hostTeam.id and t_game.guestTeamId = guestTeam.id where t_game.id = ?
      `
      return db.query(sql, [req.query.id],function(err,result){
          if (err){
              console.error('在数据库中查询球队错误',err);
              return res.json({});
          }
          if (result.length == 0){
              return res.json({});
          }
          return res.json({
                        hostTeam : { name: result[0].hostTeamName, id: result[0].hostTeamId},
                        guestTeam: { name: result[0].guestTeamName, id: result[0].guestTeamId}
                    });
      });
});


router.get('/player',function(req,res){
      var sql = `
      select t_player.id, t_player.name from  t_player
      join t_team_player on t_player.id = t_team_player.playerId where teamId = ?;
      `
      return db.query(sql, [req.query.id],function(err,result){
          if (err){
              console.error('在数据库中查询球员错误',err);
              return res.json([]);
          }
          if (result.length == 0){
              return res.json([]);
          }
          var ret = []
          for(var i = 0; i < result.length; i++) {
            ret.push({ name: result[i].name, id: result[i].id})
          }
          return res.json(ret)
      });
});

router.post('/addDppg',function(req,res){
      var dppgData = JSON.parse(req.body.data)
      var record = dppgData.record
      return async.waterfall([
          function(playerdppg){
            var sql = `select *  from t_player_dppg where playerId = ? and gameId = ?`
              db.query(sql,[dppgData.playerId, dppgData.gameId],function(err, data){
                  if (data.length > 0)
                  {
                    playerdppg(new Error('插入数据已存在'))
                  } else  {
                    playerdppg(err);
                  }

              });
          },
          function(dppgDppg){

              var recordKey = Object.keys(record)
                recordKey.forEach(function(key) {
                if (!record[key]) {
                  record[key] = 0
                }
              })
              var sql = `insert into t_player_dppg(playerId, gameId, record)
              value(?,?,?)`
              var templateRecord = `{"goals": ${record.goals},"attack": ${record.attack},"shoot": ${record.shoot},"shotsOnGoal": ${record.shotsOnGoal},"accuratePass": ${record.accuratePass},"extraordinary": ${record.extraordinary},"gotFouled": ${record.gotFouled},"foul": ${record.foul},"interception": ${record.interception},"steals": ${record.steals},"yellowCard": ${record.yellowCard},"redCard": ${record.redCard},"ownBall": ${record.ownBall},"judgment": ${record.judgment},"saves": ${record.saves},"penaltyStopper": ${record.penaltyStopper}}`
              console.log(dppgData.playerId, dppgData.gameId, templateRecord)
              db.query(sql,[dppgData.playerId, dppgData.gameId, templateRecord],function(err){
                dppgDppg(err);
          });
        }
      ],function(err){
          if (err) {
              return res.json({status: 0, message: err.toString()});
          }
          return res.json({status: 1});
      });
});

module.exports = router;
