express = require('express')
router = express.Router()
arenaconfigRoute = require('./arenaconfig')
router.use '/arenaconfig', arenaconfigRoute
module.exports = router
