deerDb = require ('../../stores/deerdb')
async = require('async')
module.exports.searchcirculatesSum = (cb) ->
  async.parallel([
      (callback) ->
         sql = "
           SELECT
           SUM(deerCoins) AS sumDeerCoins,
           SUM(deerPoints) AS sumDeerPoints, SUM(commission) AS sumCommission
           FROM
           t_circulates_statistics
         "
         deerDb.query sql, (err, ret) ->
           if err
             return callback(err)
           else if ret.length > 0
             return callback(null, ret[0])
           else
             return callback(null, [])

      (callback) ->
         sql = "
           SELECT
             SUM(ABS(deerCoins)) as sumRechargeCoins
           FROM
             t_deercoins_transactions
           WHERE
             tradeType = 0
         "
         deerDb.query sql, (err, ret) ->
           if err
             return callback(err)
           else if ret.length > 0
             return callback(null, ret[0])
           else
             return callback(null, [])
  ], (err, ret) ->
    if err
      return cb(err)
    if ret.length <=0
      return cb(null, {})
    sumObj = {}
    sumObj.sumDeerCoins = ret[0].sumDeerCoins
    sumObj.sumDeerPoints = ret[0].sumDeerPoints
    sumObj.sumCommission = ret[0].sumCommission
    sumObj.sumRechargeCoins = ret[1].sumRechargeCoins
    cb(null, sumObj)
  )
