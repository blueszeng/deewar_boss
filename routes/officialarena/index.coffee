express = require('express')
router = express.Router()
arenaRoute = require('./arena')
router.use '/arena', arenaRoute
module.exports = router
