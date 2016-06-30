deerDb = require ('../../stores/deerdb')
moment = require('moment')

module.exports.createOfficialarena = (contest) ->
  new Promise (resolve, reject) ->
    sql = "
     INSERT INTO
       t_contest(creatorId, isOfficial, competitionId, name, betEndTime,
       matchDate, visibleTime, ruleId, extraInfo, maxBonus, entryPrice,
       entriesLimit, priority, isVisible)
     VALUES(0, 1, ?, ?, ?,
      ?,?,?,?,?,?,?,?,?)
    "
    deerDb.query sql, [
      contest.competitionId, contest.name,
      moment(contest.visibleTime).
        subtract(15, 'minutes').format("YYYY-MM-DD HH:mm"),
      contest.matchDate,
      contest.visibleTime, contest.ruleId, contest.extraInfo,
      contest.maxBonus, contest.entryPrice, contest.entriesLimit,
      contest.priority, contest.isVisible
    ], (err, ret) ->
      if err
        return reject(err)
      else
        return resolve(true)


module.exports.updateOfficialarena = (contest) ->
  new Promise (resolve, reject) ->
    sql = "
     UPDATE
      t_contest
     SET
      name = ?, matchDate = ?, visibleTime = ?,
      betEndTime = ?,
      ruleId = ?, extraInfo = ?, maxBonus = ?,  entryPrice =?, entriesLimit = ?,
      priority = ?, isVisible = ?
    WHERE
      t_contest.id = ?
    "
    deerDb.query sql, [
        contest.name,
        contest.matchDate,
        contest.visibleTime,
        moment(contest.visibleTime).
          subtract(15, 'minutes').format("YYYY-MM-DD HH:mm"),
        contest.rule, contest.extraInfo,
        contest.maxBonus, contest.entryPrice, contest.entriesLimit,
        contest.priority, contest.isVisible,
        contest.contestId
      ], (err, ret) ->
        if err
          return reject(err)
        else
          return resolve(true)

module.exports.getOfficialarenaContest = (contestId) ->
  new Promise (resolve, reject) ->
    sql = "
       SELECT
        t_contest.id,
        competitionId, name, matchDate, visibleTime, ruleId,
        extraInfo, maxBonus, entryPrice, entriesLimit, priority, isVisible
       FROM
        t_contest
       WHERE
        id = ?
      "
    deerDb.query sql, [contestId], (err, ret) ->
      if err
        return reject(err)
      else if ret.length > 0
        return resolve(ret[0])
      else
        return resolve([])

module.exports.delOfficialarenaByContestId = (contestId) ->
  new Promise (resolve, reject) ->
    sql = "
       DELETE FROM
        t_contest
       WHERE
        id = ?
      "
    deerDb.query sql, [contestId], (err, ret) ->
      console.log err, ret, contestId
      if err
        return reject(err)
      else
        return resolve(true)
