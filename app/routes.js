//                  _
//  _ __ ___  _   _| |_ ___  ___
// | '__/ _ \| | | | __/ _ \/ __|
// | | | (_) | |_| | ||  __/\__ \
// |_|  \___/ \__,_|\__\___||___/
//

const express = require('express');
const debug = require('debug')('app:routing');

const router = express.Router();
const defaultRouter = express.Router();

// / just returns plain message:
defaultRouter.get('/', function(req, res) {
    res.send('Let\'s do this');
});

// heartbeat:
defaultRouter.get('/heartbeat', function(req, res) {
    res.send('OK'); // send defaults to 200
});

/////////////////////
//	Exports
/////////////////////

/* Route consolidation */
router.use(defaultRouter);

module.exports = router;
