express = require('express')
router = express.Router()
dataquery = require('../../services/web/dataquery')

router.get '/', (req, res) ->
  res.render 'configuration/arenaconfig/index',
    info: req.query.info
    error: req.query.error

module.exports = router
