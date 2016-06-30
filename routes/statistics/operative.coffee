
express = require('express')
moment = require('moment')
async = require('async')
router = express.Router()
operative  = require('../../model/statistics/operative')

router.get '/', (req, res) ->
  res.render 'statistics/operative/index',
    info: req.query.info
    error: req.query.error

router.get '/oneWeekUserStatistics', (req, res) ->
  async.waterfall([
     (cb) ->
        query = req.query
        beginDate = endDate = null
        if query.beginDate and query.endDate
          beginDate = query.beginDate
          endDate = query.endDate
        else
          beginDate = moment().subtract(6, 'days').format("YYYY-MM-DD")
          endDate = moment().format("YYYY-MM-DD")
        operative.searchDateTimeSlotUsersCount(beginDate, endDate, cb)
     ], (err, ret) ->
       if err
         return res.json(status: false, message: err)
       usersCount = []
       matchDates = []
       converObjRet = {}
       for matchDateObj in ret
         coverTimer = moment(matchDateObj.createdTime).format("YYYY-MM-DD")
         converObjRet[coverTimer] = matchDateObj.count
       for i in [6..0]
         matchDates.push ((endDate, i) ->

           generateTime = moment()
           generateTime = moment(endDate) if endDate
           generateTime.subtract(i, 'days').format("YYYY-MM-DD")
           )(req.query.endDate, i)
       for matchDate in matchDates
         if converObjRet[matchDate]
           usersCount.push converObjRet[matchDate]
         else
           usersCount.push 0
       return res.json(status: true, data: usersCount)
    )

router.get '/UserNumberStatistics', (req, res) ->
  async.waterfall([
     (cb) ->
       operative.searchUserNumber(cb)
     ], (err, ret) ->
       if err
         return res.json(status: false, message: err)
       return res.json(status: true, data: ret )
    )

module.exports = router
