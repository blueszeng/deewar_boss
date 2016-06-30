express = require('express')
router = express.Router()
arenaconfigRoute = require('./exchangemanage')
router.use '/exchangemanage', arenaconfigRoute
module.exports = router
