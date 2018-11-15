//                                           _
//   ___ ___  _ __ ___  _ __ ___   ___ _ __ | |_ ___
//  / __/ _ \| '_ ` _ \| '_ ` _ \ / _ \ '_ \| __/ __|
// | (_| (_) | | | | | | | | | | |  __/ | | | |_\__ \
//  \___\___/|_| |_| |_|_| |_| |_|\___|_| |_|\__|___/
//

const mongoose = require('mongoose');
const Post = require('../models/post');
const Comment = require('../models/comment');
const debug = require('debug')('app:controller:posts');

/////////////////////
//	Comment API
/////////////////////

/** LIST **/

/**
* @description Fetches comments for a particular post,
* Should come after a checkPostID middleware call
*/
function commentsForPost(req, res) {
  const postID = req.params.postID;

  // get all comments where parent_post is postID, not deleted:
  Comment.fromPostID(postID)
    .exec()
    .then((comments) => {
      if (comments) {
        res.json({
          comments: comments
        });
      } else {
        // no comments found, throw error to be caught below:
        const err = new Error('Invalid postID');
        err.message = 'That post doesn\'t exist';
        err.code = 400;
        throw err;
      }
    })
    .catch((err) => {
      debug(`Error fetching comments: ${err}`);
      const status = err.code || 500;
      res.status(status).json({
        error: {
          code: status,
          message: err.messagee || 'Can\'t find the comments'
        }
      });
    });
}

/** CREATE **/

/**
* @description Whips up a new comment,
* should come after a checkPostID middleware call
*/
function createComment(req, res) {
  const currentUser = req.user;
  const currentUserID = currentUser._id;
  const postID = req.params.postID;
  var content = req.body.content;

  // sanitize content, validation / param errors handled below
  content = content.trim();
  debug(`${currentUser} commenting on post ${postID}`);
  // to save it, first fetch the post, save the comment to that.
  // order of ops matters for data integrity,
  // Fetch the parent post first!!
  Post.findById(postID)
    .ne('is_deleted', true)
    .exec()
    .then((post) => {
      if (post) {
        // now create the comment:
        const comment = new Comment({
          user: currentUserID,
          parent_post: post._id,
          content: content
        });
        // save the comment, return the promise chain:
        return comment.save().then((comment) => {
          // increment the comment count for post:
          post.comment_count += 1;
          // save the post, passing along promise resolved to result:
          return post.save().then(() => {
            // we are done so return comment:
            return comment;
          });
        });

      } else {
        // no post found, throw error to be caught below:
        const err = new Error('Invalid parent post');
        err.safeMessage = 'The parent post doesn\'t exist';
        err.code = 400;
        debug(`Couldn't find parent post for comment creation: ${err}`);
        throw err;
      }
    })
    .then((comment) => {
      // success, respond w/ the comment:
      res.status(201).json(comment);
    })
    .catch((err) => {
      debug(`Something went wrong during comment creation: ${err}`);
      if (err.name === 'ValidationError') {
        res.status(400).json({
          error: {
            code: 400,
            message: 'Bad params - request did not pass validation'
          }
        });
      } else {
        const code = err.code || 500;
        res.status(code).json({
          error: {
            code: code,
            message: err.safeMessage || 'Could not save the comment'
          }
        });
      }
    });
}

/** DELETE **/

/**
* @description Trashes a comment,
* Should come after checkPostID middleware call
*/
function destroyComment(req, res) {
  const thisUser = req.user._id;
  const postID = req.params.postID;
  const commentID = req.params.commentID;

  // should have already checked postID, now check commentID:
  if (!mongoose.Types.ObjectId.isValid(commentID)) {
    return res.status(400).json({
      error: {
        code: 400,
        message: 'Invalid commentID'
      }
    });
  }

  // mark the comment as deleted and update it:
  Comment.updateOne()
    .where('_id', commentID)
    .where('user', thisUser)
    .set({ is_deleted: true })
    .exec()
    .then((commentWriteOp) => {
      // if the comment was successfully updated (to soft-delete)
      if (commentWriteOp.nModified > 0) {
        // decrement the parent post comment_count, return promise chain:
        return Post.findById(postID)
          .updateOne({ $inc: { comment_count: -1 } })
          .exec();
      } else { // something funny is going on...
        // this probably isn't their post:
        const err = new Error('Comment delete went off the rails after fetch');
        err.code = 401;
        throw err;
      }
    })
    .then(() => { // success
      res.json({
        success: true
      });
    })
    .catch((err) => {
      console.error(err);
      res.status(err.code || 500).json({
        error: {
          code: err.code || 500,
          message: 'couldn\'t delete the comment'
        }
      });
    });
}

/////////////////////
//	Exports
/////////////////////

module.exports.commentsForPost = commentsForPost;
module.exports.createComment = createComment;
module.exports.destroyComment = destroyComment;
