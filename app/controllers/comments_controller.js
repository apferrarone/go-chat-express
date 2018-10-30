//                                           _
//   ___ ___  _ __ ___  _ __ ___   ___ _ __ | |_ ___
//  / __/ _ \| '_ ` _ \| '_ ` _ \ / _ \ '_ \| __/ __|
// | (_| (_) | | | | | | | | | | |  __/ | | | |_\__ \
//  \___\___/|_| |_| |_|_| |_| |_|\___|_| |_|\__|___/
//

const Post = require('../models/post');
const Comment = require('../models/comment');
const debug = require('debug')('app:controller:posts');

/////////////////////
//	Comment API
/////////////////////

/** LIST **/

/**
* @description Fetches comments for a particular post
*/
function commentsForPost(req, res) {
    const postID = req.params.postID;

    // get all comments where parent_post is postID, not deleted:
    Comment.fromPostID(postID)
      .exec()
      .then(function(comments) {
          res.json({
              comments: comments
          });
      })
      .catch(function(err) {
          console.error(err);
          res.status(400).json({
              error: {
                  code: 400,
                  message: 'Can\'t find the comments'
              }
          });
      });
}

/** CREATE **/

/**
* @description Whips up a new comment
*/
function createComment(req, res) {
    const currentUser = req.user;
    const currentUserID = currentUser._id;
    const postID = req.params.postID;
    const content = req.body.content;

    debug(`${currentUser} commenting on post ${postID}`);
    // to save it, first fetch the post, save the comment to that.
    // order of ops matters for data integrity,
    // Fetch the parent post first!!
    Post.findById(postID)
      .ne('is_deleted', true)
      .exec()
      .then(function(post) {
        console.log("\nIs there a post?", post);
          if (post) {
              // now create the comment:
              const comment = new Comment({
                  user: currentUserID,
                  parent_post: post._id,
                  content: content
              });
              // save the comment, return the promise chain:
              return comment.save().then(function(comment) {
                  // increment the comment count for post:
                  post.comment_count += 1;
                  // save the post, passing along promise resolved to result:
                  return post.save().then(function(post) {
                      // we are done so return comment:
                      return comment;
                  });
              });

          } else {
              console.log(`\n\n\n\n${err}\n\n\n\n`);
              // no post found, throw error to be caught below:
              const err = new Error('Invalid parent post');
              err.safeMessage = 'The parent post doesn\'t exist';
              err.code = 400;
              console.log("\nwe are throwing the error", err);
              throw err;
          }
      })
      .then(function(comment) {
          // success, respond w/ the comment:
          res.status(201).json(comment);
      })
      .catch(function(err) {
        console.log("\n\nHERE\n\n", err);
          console.error(err);
          const code = err.code || 400;
          res.status(400).json({
              error: {
                  code: code,
                  message: err.safeMessage || 'Could not save the comment'
              }
          });
      });
}

/** DELETE **/

/**
* @description Trashes a comment
*/
function destroyComment(req, res) {
    const thisUser = req.user._id;
    const postID = req.params.postID;
    const commentID = req.params.commentID;

    // mark the comment as deleted and update it:
    Comment.findById(commentID)
      .where('user', thisUser)
      .update({ is_deleted: true })
      .exec()
      .then(function(commentWriteOp) {
          // if the comment was successfully updated (to soft-delete)
          if (commentWriteOp.nModified > 0) {
              // decrement the parent post comment_count, return promise chain:
              return Post.findById(postID)
                .update({ $inc: { comment_count: -1} })
                .exec();

          } else { // something funny is going on...
              // this probably isn't their post:
              const err = new Error('Comment delete went off the rails after fetch');
              throw err;
          }

      })
      .then(function(post) {
          // success:
          res.json({
              success: true
          });
      })
      .catch(function(err) {
          console.error(err);
          res.status(400).json({
              error: {
                  code: err.code || 400,
                  message: 'couldn\'t complete comment deletion'
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
