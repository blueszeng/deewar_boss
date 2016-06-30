deerDb = require ('../../stores/deerdb')
moment = require('moment')
module.exports.getContestInfoByContestId = (contestId) ->
  new Promise (resolve, reject) ->
    sql = "
    SELECT
    	t_contest.competitionId,
        t_contest.matchDate,
        t_contest.isOfficial,
        t_contest.ruleId,
        t_contest.entryPrice,
        t_contest.entriesLimit,
        t_contest.entriesCount,
        bonusCount.bonusNumber,
        t_contest.entriesCount * entryPrice  as ticke,
        bonusCount.disPoints,
        t_contest.entriesCount * entryPrice * 10
          - bonusCount.bonusNumber as commission
    FROM
     t_contest
    JOIN
     (SELECT contestId, count(id) as bonusNumber,sum(t_entry.bonus) as disPoints
     FROM t_entry WHERE t_entry.bonus > 0
     GROUP BY t_entry.contestId) as bonusCount
     ON t_contest.id = bonusCount.contestId
     WHERE t_contest.id = ?"

    deerDb.query sql, [contestId], (err, ret) ->
      if err
        return reject(err)
      else if ret.length <= 0
        return resolve({})
      else
        return resolve(ret[0])
