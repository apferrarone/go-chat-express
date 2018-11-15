//                  _
//  _ __ ___  _   _| |_ ___  ___
// | '__/ _ \| | | | __/ _ \/ __|
// | | | (_) | |_| | ||  __/\__ \
// |_|  \___/ \__,_|\__\___||___/
//

const express = require('express');
const UsersController = require('./controllers/users_controller');
const PostsController = require('./controllers/posts_controller');
const CommentsController = require('./controllers/comments_controller');
const router = express.Router();
const defaultRouter = express.Router();
const apiRouter = express.Router();

// / just returns plain message:
defaultRouter.get('/', function (req, res) {
  res.send('Let\'s do this');
});

// heartbeat:
defaultRouter.get('/heartbeat', function (req, res) {
  res.send('OK'); // send defaults to 200
});

/////////////////////
//	Users
/////////////////////

apiRouter.get('/users/:id', UsersController.checkUser, UsersController.findUser);
apiRouter.post('/signup', UsersController.createUser);
apiRouter.post('/login', UsersController.login);

/////////////////////
//  Posts
/////////////////////

apiRouter.get('/posts_by_location', UsersController.checkUser, PostsController.postsByLocation);
apiRouter.post('/posts', UsersController.checkUser, PostsController.createPost);
apiRouter.route('/post/:postID')
  .get(UsersController.checkUser, PostsController.checkPostID, PostsController.findPost)
  .delete(UsersController.checkUser, PostsController.checkPostID, PostsController.destroyPost);

/////////////////////
//	Comments
/////////////////////

apiRouter.route('/posts/:postID/comments')
  .get(UsersController.checkUser, PostsController.checkPostID, CommentsController.commentsForPost)
  .post(UsersController.checkUser, PostsController.checkPostID, CommentsController.createComment);
apiRouter.delete('/posts/:postID/comments/:commentID', UsersController.checkUser, PostsController.checkPostID, CommentsController.destroyComment);

/////////////////////
//	Exports
/////////////////////

/* Route consolidation */
router.use(defaultRouter);
router.use('/api/v1', apiRouter);

module.exports = router;
