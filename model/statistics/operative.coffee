deerDb = require ('../../stores/deerdb')
async = require('async')

module.exports.searchDateTimeSlotUsersCount = (beginDate, endDate, cb) ->
  console.log(beginDate, endDate)
  sql = "
    SELECT
       Date(createdTime) as createdTime, count(id) as count
    FROM
       t_users
    WHERE
      DATE(createdTime) >= ? AND DATE(createdTime) <= ?
    GROUP BY
    	  DATE(createdTime)
   "
  deerDb.query sql, [beginDate, endDate], (err, ret) ->
    if err
      return cb(err)
    else if ret.length > 0
      return cb(null, ret)
    else
      return cb(null, [])

module.exports.searchUserNumber = (cb) ->
  sql = "
    SELECT
       count(id) as count
    FROM
       t_users
   "
  deerDb.query sql, (err, ret) ->
    if err
      return cb(err)
    else if ret.length > 0
      return cb(null, ret[0])
    else
      return cb(null, 0)
