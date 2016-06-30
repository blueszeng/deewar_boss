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

router.get('/',function(req,res){
    if (!rbaccore.haspermission('organization_player',req,res)){
        return;
    }
    return res.render('organization/player/index',{
        info:req.query.info,
        error:req.query.error
    });
});

router.post('/list.html',function(req,res){

    if (!rbaccore.haspermission('organization_player',req,res)){
        return;
    }


    var name = req.body.name
    if(name) {
      req.body['t_position_type.name'] = name
      delete req.body.name
    }

    var msFromSql = `(t_player join t_position_type) left join (t_team_player join t_team)
      ON (t_player.id = t_team_player.playerId AND t_team_player.teamId =t_team.id)
      WHERE   t_player.positionTypeId = t_position_type.id
    `
    if(req.body['MysSearch_0']) {
      msFromSql += ` AND t_player.name = '${req.body['MysSearch_0']}' `
    }
    if(req.body['MysSearch_1']) {
      msFromSql += `  AND t_position_type.name = '${req.body['MysSearch_1']}' `
    }
    if(req.body['MysSearch_2']) {
      msFromSql += `  AND t_team.name = '${req.body['MysSearch_2']}' `
    }
    var tabledefinition = {
        sTableName: 't_player',
        sCountColumnName:'id',
        sSelectSql: "t_player.id, t_player.name, t_position_type.name as positionTypeId, t_team.name as team, avatar, t_player.ext, salary, avgDppg",
        sFromSql: msFromSql,
        aoColumnDefs: [
            { mData: 'name', bSearchable: true },
            { mData: 'positionTypeId', bSearchable: true },
            { mData: 'team', bSearchable: true },
            { mData: 'avatar', bSearchable: true },
            { mData: 'ext', bSearchable: true },
            { mData: 'salary', bSearchable: true },
            { mData: 'avgDppg', bSearchable: true },
            { mData: 'id', bSearchable: true },
            { mData: null, bSearchable: true}
        ]};
        const ret = dataquery.pagedataDeer(tabledefinition,req,res);
        return res
});

router.get('/add.html',function(req,res){
    if (!rbaccore.haspermission('organization_player_add',req,res)){
        return;
    }
    return async.parallel({
      postionName:function(callback){
          db.query('select name from t_position_type where sportId = ?', [1],function(err,result){
              if (err){
                  return callback(err);
              }
              if (result.length == 0){
                  return callback('无法找到位置信息')
              }
              var postionName = [];
              for (var i = 0;i < result.length;i++){
                  postionName.push(result[i].name);
              }
              return callback(null,postionName);
          });
      },
      teamName:function(callback){
          db.query('select name from t_team', function(err,result){
              if (err){
                  return callback(err);
              }
              var teamName = [];
              for (var i = 0;i < result.length;i++){
                  teamName.push(result[i].name);
              }
              callback(null, teamName);
          });
      }
  },function(err,results){
      if (err){
          console.error('在数据库查找球员失败',err);
          return res.redirect(`/organization/player/?error=${encodeURI('无法添加球员')}`);
      }
      return res.render('organization/player/add',{
          postionName:results.postionName,
          teamName:results.teamName,
          error:req.query.error
      });
  });
});

router.post('/add.html',function(req,res){
    if (!rbaccore.haspermission('organization_player_add',req,res)){
        return;
    }
    var name = req.body.name;
    if (!name){
        return res.redirect(`/organization/player/add.html?error=${encodeURI('姓名不能为空')}`);
    }

    var   positionTypeId  = req.body.positionTypeId;
    if (!positionTypeId){
        return res.redirect(`/organization/player/add.html?error=${encodeURI('球员位置不能为空')}`);
    }

    var   salary  = req.body.salary;
    if (!salary){
        return res.redirect(`/organization/player/add.html?error=${encodeURI('球员位置不能为空')}`);
    }

    var   playerTeam  = req.body.team;
    return db.query('select id from t_position_type where name = ?',[positionTypeId],function(err,result){
        if (err){
            console.error('在数据库中查询球员失败',err);
            return res.redirect(`/organization/player/add.html?error=${encodeURI('添加球员失败')}`);
        }
        if (result.length == 0){
            return res.redirect(`/organization/player/add.html?error=${encodeURI('添加球员失败')}`);
        }

        db.query('select id from t_team where name = ?',[playerTeam ? playerTeam : ''],function(err,teamResult){
            if (err){
                console.error('在数据库中查询球队ID号失败',err);
                return res.redirect(`/organization/player/add.html?error=${encodeURI('添加球员失败')}`);
            }
          return db.getConnection(function(err,connection) {
              if (err){
                  console.error('在数据库连接池获取连接失败',err);
                  return res.render('organization/player/add',{
                      error:'添加球员失败'
                    });
              }
              return connection.beginTransaction(function(err){
                if (err){
                    console.error('数据库开始执行事务失败',err);
                    connection.release();
                    return res.render('organization/player/add',{
                        error:'添加球员失败'
                    });
                }
                return async.waterfall([
                    function(update_player){
                      var sql = `insert into t_player(name, positionTypeId, avatar, ext, salary, avgDppg )
                        values(?,?,?,?,?,?)`
                        connection.query(sql,[req.body.name,result[0].id,req.body.avatar, req.body.ext,req.body.salary,req.body.avgDppg],function(err, data){
                            update_player(err, data);

                        });
                    },
                    function(results, update_player_team){
                        var sql = `insert into t_team_player
                        value(?,?)`
                        if (teamResult.length > 0) {
                          connection.query(sql,[ teamResult[0].id, results.insertId],function(err){
                            update_player_team(err);
                          });
                        } else {
                          update_player_team(null);
                        }

                  }
                ],function(err){
                    if (err) {
                        console.error('在数据库添加新的球员时出错回滚',err);
                        return connection.rollback(function(err){
                            if (err){
                                console.error('数据库出错回滚错误',err);
                            }
                            connection.release();
                            return res.render('organization/player/',{
                                error:'添加球员失败'
                            });
                        });
                    }
                    return connection.commit(function(err){
                        if (err){
                            console.error('数据库提交失败',err);
                            return connection.rollback(function(err){
                                if (err){
                                    console.error('数据库出错回滚错误',err);
                                }
                                connection.release();
                                return res.render('organization/player/edit',{
                                    error:'添加球员失败'
                                });
                            });
                        }
                        connection.release();
                        return res.redirect(`/organization/player/?info=${encodeURI('添加球员成功')}`);
                    });
                });
             });
        });
    });
  });
});

router.get('/edit.html',function(req,res){
    if (!rbaccore.haspermission('organization_player_edit',req,res)){
        return;
    }
    var userId = req.query.id;
    if (!userId){
        return res.redirect(`/organization/player/?error=${encodeURI('无法编辑球员')}`);
    }
    return async.parallel({
        player:function(callback){
            var sql = `
            select t_player.id, t_player.name, t_player.positionTypeId, t_team_player.teamId, avatar, t_player.ext, salary, avgDppg
             from t_player left join  t_team_player
             ON t_player.id = t_team_player.playerId  where id = ?
            `
            db.query(sql,[userId],function(err,result){
                if (err){
                    return callback(err);
                }
                if (result.length == 0){
                    return callback('无法找到用户')
                }
                return callback(null,result[0]);
            });
        },
        playerpostionName:function(callback){
            db.query('select name from t_position_type where sportId = ?', [1], function(err,result){
                if (err){
                    return callback(err);
                }
                var postionName = [];
                postionName.push('')
                for (var i = 0;i < result.length;i++){
                    postionName.push(result[i].name);
                }
                callback(null, {name: postionName});
            });
        },
        playerpostionId:function(callback){
            db.query('select id from t_position_type where sportId = ?', [1],function(err,result){
                if (err){
                    return callback(err);
                }
                var postionId = [];
                for (var i = 0;i < result.length;i++){
                    postionId.push(result[i].id);
                }
                callback(null,postionId.join(','))
            });
        },
        playerTeam:function(callback){
            db.query('select name, id  from t_team',function(err,result){
              if (err){
                  return callback(err);
              }
              var team= {};
              team.teamName = [];
              team.teamId = [];
              team.teamName.push('')
              team.teamId.push('')
              for (var i = 0;i < result.length;i++){
                  team.teamName.push(result[i].name);
              }
              callback(null, team);
            });
        }
    },function(err,results){
        if (err){
            console.error('在数据库查找球员失败',err);
            return res.redirect(`/organization/player/?error=${encodeURI('无法编辑球员')}`)
        }
        return res.render('organization/player/edit',{
            player:results.player,
            playerpostionName:results.playerpostionName,
            playerpostionId:results.playerpostionId,
            playerTeam: results.playerTeam,
            error:req.query.error
        });
    });
});

router.post('/edit.html',function(req,res){
    if (!rbaccore.haspermission('organization_player_edit',req ,res)) {
        return;
    }
    var playerId = req.body.playerId;
    if (!playerId){
        return res.redirect(`/organization/player/?error=${encodeURI('无法编辑球员')}`);
    }
    var name = req.body.name;
    if (!name){
        return res.redirect(`/organization/player/edit.html?error=${encodeURI('姓名不能为空')}`);
    }
    var   positionTypeId  = req.body.positionTypeId;
    if (!positionTypeId){
        return res.redirect(`/organization/player/edit.html?error=${encodeURI('球员位置不能为空')}`);
    }

    var   playerTeam  = req.body.team;
    return db.query('select id from t_position_type where name = ?',[positionTypeId],function(err,posResult){
        if (err){
            console.error('在数据库中查询球员失败',err);
            return res.redirect(`/organization/player/edit.html?error=${encodeURI('编辑球员失败')}`);
        }
        if (posResult.length == 0){
            return res.redirect(`/organization/player/edit.html?error=${encodeURI('编辑球员失败')}`);
        }

        db.query('select id from t_team where name = ?',[playerTeam ? playerTeam: ''],function(err,result){
            if (err){
                console.error('在数据库中查询球队ID号失败',err);
                return res.redirect(`/organization/player/edit.html?error=${encodeURI('编辑球员失败')}`);
            }
            if (playerTeam && result.length == 0){
                return res.redirect(`/organization/player/edit.html?error=${encodeURI('编辑球员失败')}`);
      　    }

          return db.getConnection(function(err,connection) {
              if (err){
                  console.error('在数据库连接池获取连接失败',err);
                  return res.render('organization/player/add',{
                      error:'编辑球员失败'
                    });
              }
              return connection.beginTransaction(function(err){
                if (err){
                    console.error('数据库开始执行事务失败',err);
                    connection.release();
                    return res.render('organization/player/edit',{
                        error:'编辑球员失败'
                    });
                }
                return async.series([
                    function(update_player){
                        var sql ='update  t_player set name = ?, salary = ?, positionTypeId = ?, avatar = ?, ext = ?, avgDppg = ? where id = ?'
                        connection.query(sql,[req.body.name, req.body.salary, posResult[0].id, req.body.avatar, req.body.ext, req.body.avgDppg, playerId],function(err){
                            update_player(err);
                        });
                    },
                    function(update_player_team){
                       connection.query('select playerId from t_team_player where playerId = ?',[playerId], function(err,tResult){
                       var sql = 'update t_team_player set teamId = ? where  playerId = ?'
                       if(tResult.length <= 0 && result.length > 0) {
                         sql = `insert into t_team_player
                             value(?,?)`
                       }
                       console.log(sql, result.length > 0 ? result[0].id : 0, playerId)
                        connection.query(sql, [result.length > 0 ? result[0].id : 0, playerId],function(err){
                          update_player_team(err);
                       });
                     });
                  }
                ],function(err){
                    if (err) {
                        console.error('在数据库编辑新的球员时出错回滚',err);
                        return connection.rollback(function(err){
                            if (err){
                                console.error('数据库出错回滚错误',err);
                            }
                            connection.release();
                            return res.render('organization/player/',{
                                error:'编辑球员失败'
                            });
                        });
                    }
                    return connection.commit(function(err){
                        if (err){
                            console.error('数据库提交失败',err);
                            return connection.rollback(function(err){
                                if (err){
                                    console.error('数据库出错回滚错误',err);
                                }
                                connection.release();
                                return res.render('organization/player/edit',{
                                    error:'编辑球员失败'
                                });
                            });
                        }
                        connection.release();
                        return res.redirect(`/organization/player/?info=${encodeURI('编辑球员成功')}`);

                    });
                });
             });
        });
    });
  });
});


router.get('/del.html',function(req,res){
    if (!rbaccore.haspermission('organization_player_del',req,res)){
        return;
    }
    var userId = req.query.userId;
    if (!userId){
        return res.redirect(`/organization/player/?error=${encodeURI('无法删除球员')}`);
    }

    return async.waterfall([
        function(lineupPlayer){
          var sql = `delete  from t_lineup where playerId = ?`
            db.query(sql,[userId],function(err){
                lineupPlayer(err);
            });
        },
        function(playerDppg){
            var sql = `delete  from t_player_dppg where playerId = ?`
            db.query(sql,[userId],function(err){
              playerDppg(err);
        });
      },
      function(teamPlayer){
        var sql = `delete  from t_team_player where playerId = ?`
          db.query(sql,[userId],function(err){
              teamPlayer(err);
          });
      },
      function(player){
        var sql = `delete from t_player where id = ?`
          db.query(sql,[userId],function(err){
              player(err);
          });
      }
    ],function(err){
        if (err) {
              return res.render('organization/player/',{
                  error:'删除球员失败'
              });
            }
          return res.redirect(`/organization/player/?info=${encodeURI('删除人员' + req.query.name + '成功')}`);
          }
    );
  });


module.exports = router;
