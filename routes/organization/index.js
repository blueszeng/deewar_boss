/**
 * Created by jimmychou on 15/1/8.
 */
var express = require('express');
var router = express.Router();

var logrouter = require('./log');
var rolerouter = require('./role');
var staffrouter = require('./staff');
var boardrouter = require('./board');
var cloopenrouter = require('./cloopen');
var taobaokeyrouter = require('./taobaokey');
var staffrouter = require('./staff');
var playerrouter = require('./player');
var teamrouter = require('./team');
var matchdayrouter = require('./matchday');
var categoryrouter = require('./category');
var gameroute =  require('./game');
var dppgroute =  require('./dppg');

// router.use('/log',logrouter);
// router.use('/role',rolerouter);
// router.use('/staff',staffrouter);
router.use('/player',playerrouter);
router.use('/team',teamrouter);
router.use('/matchday',matchdayrouter);
router.use('/category',categoryrouter);
router.use('/game',gameroute);
router.use('/dppg',dppgroute);
// router.use('/board',boardrouter);
// router.use('/cloopen',cloopenrouter);
// router.use('/taobaokey',taobaokeyrouter);


module.exports = router;
