
express = require('express')
async = require('async')
router = express.Router()
circulates  = require('../../model/statistics/circulates')
dataquery = require('../../services/web/dataquery')

router.get '/', (req, res) ->
  res.render 'statistics/circulates/index',
    info: req.query.info
    error: req.query.error

 router.post '/list.html', (req, res) ->
   tabledefinition =
     sTableName: 't_circulates_statistics'
     sCountColumnName: 'matchDate'
     aoColumnDefs: [
       {
         mData: 'matchDate'
         bSearchable: true
       }
       {
         mData: 'deerCoins'
         bSearchable: false
       }
       {
         mData: 'deerPoints'
         bSearchable: false
       }
       {
         mData: 'commission'
         bSearchable: false
       }
       {
         mData: null
         bSearchable: false
       }
     ]
   dataquery.pagedataDeer tabledefinition, req, res

 router.get '/getSumDeerData', (req, res) ->
   async.waterfall([
     (cb) ->
       circulates.searchcirculatesSum(cb)
     ], (err, ret) ->
       if err
         return res.json(status: false, message: err)
       return res.json(status: true, data: ret )
    )

module.exports = router
