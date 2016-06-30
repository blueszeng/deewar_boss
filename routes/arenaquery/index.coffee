express = require('express')
router = express.Router()
arenaconfigRoute = require('./resultquery')
router.use '/resultquery', arenaconfigRoute
module.exports = router
