//                  _
//  _ __ ___  _   _| |_ ___  ___
// | '__/ _ \| | | | __/ _ \/ __|
// | | | (_) | |_| | ||  __/\__ \
// |_|  \___/ \__,_|\__\___||___/
//

const express = require('express');
const debug = require('debug')('app:routing');

const UsersController = require('./controllers/users_controller');

const router = express.Router();
const defaultRouter = express.Router();
const apiRouter = express.Router();

// / just returns plain message:
defaultRouter.get('/', function(req, res) {
    res.send('Let\'s do this');
});

// heartbeat:
defaultRouter.get('/heartbeat', function(req, res) {
    res.send('OK'); // send defaults to 200
});

/////////////////////
//	Users
/////////////////////

apiRouter.get('/users/:id', UsersController.checkUser, UsersController.findUser);
apiRouter.post('/signup', UsersController.createUser);
apiRouter.post('/login', UsersController.login);

/////////////////////
//	Exports
/////////////////////

/* Route consolidation */
router.use(defaultRouter);

module.exports = router;
