//                  _
//  _ __   ___  ___| |_ ___
// | '_ \ / _ \/ __| __/ __|
// | |_) | (_) \__ \ |_\__ \
// | .__/ \___/|___/\__|___/
// |_|
//

const mongoose = require('mongoose');
const debug = require('debug')('app:controller:posts');

const Post = require('../models/post');
const Comment = require('../models/comment');

const EARTH_RADIUS = 3959.0; // miles
const METERS_PER_MILE = 1609.34;

/////////////////////
//  Middleware
/////////////////////

function checkPostID(req, res, next) {
    const postID = req.params.postID;
    if (!mongoose.Types.ObjectId.isValid(postID)) {
        return res.status(400).json({
            error: {
                code: 400,
                message: 'Invalid postID'
            }
        });
    }
    // postID is valid so continue:
    next();
}

/////////////////////
//	Post API
/////////////////////

/** CREATE **/

/**
* @description Create a new post
*/
function createPost(req, res) {
    const user = req.user;
    const content = req.body.content;
    const latitude = req.body.latitude || req.body.lat;
    const longitude = req.body.longitude || req.body.long;

    debug(`User ${user._id} creating post at ${latitude}, ${longitude}`);

    const post = new Post({
        user: user._id,
        content: content,
        latitude: latitude,
        longitude: longitude
    });

    post.save()
      .then(function(post) {
          res.status(201).json(post);
      })
      .catch(function(err) {
          res.status(400).json({
              error: {
                  code: err.code || 400,
                  message: err.message
              }
          });
      });
}

/** READ **/

/**
* @description Finds a post by post ID
*/
function findPost(req, res) {
    const postID = req.params.postID;

    // find the post by id:
    Post.findById(postID)
      .exec()
      .then(function(post) {
          if (post) {
              res.json(post);
          } else {
              // no post found, throw error to be caught below:
              const err = new Error('Invalid post id');
              err.safeMessage = 'That post doesn\'t exist';
              err.code = 400;
              throw err;
          }
      })
      .catch(function(err) {
          console.error(err);
          res.status(400).json({
              error: {
                  code: err.code || 400,
                  message: err.safeMessage || 'Error when looking for post'
              }
          });
      });
}

/** DELETE **/

/**
* @description Marks a post as deleted (soft delete)
*/
function destroyPost(req, res) {
    const thisUser = req.user._id;
    const postID = req.params.postID;

    debug(`user ${thisUser} deleting post ${postID}`);

    Post.findOneAndUpdate(postID)
      .where('user', thisUser)
      .set({ is_deleted: true })
      .exec()
      .then((post) => {
        if (post) { // could be null nothing found (user is wrong, etc)
          res.json({ success: true });
        } else { // post may not belong to thisUser, funny business here...
          debug(`User ${thisUser} might not own post ${postID}`);
          res.status(401).json({
              error: {
                  code: 401,
                  message: 'Something fishy is going on.'
              }
          });
        }
      })
      .catch(function(err){
          console.error(err);
          res.status(500).json({
              error: {
                  code: err.code || 500,
                  message: 'Couldn\'t delete the post'
              }
          });
      });
}

/** SEARCH **/

/**
* @description Searches for local posts by lat/long
*/
function postsByLocation(req, res) {
    const user = req.user;
    const lat = req.query.latitude || req.query.lat;
    const long = req.query.longitude || req.query.long;
    const radiusMiles = parseFloat(req.query.within) || 5.0;

    queryPostsAtLocation(user, lat, long, radiusMiles)
    .then(function(posts) {
        res.json({
            posts: posts
        });
    })
    .catch(function(err) {
        console.log(err);
        res.status(500).json({
            error: {
                code: error.code || 500,
                message: error.message
            }
        });
    });
}

/**
* @description Utility for querying posts and autoexpanding radius !
*/
function queryPostsAtLocation(user, lat, long, radiusMiles) {
    var radiusRadians = radiusMiles / EARTH_RADIUS;
    // use x/y coordinates for Mongo;
    var xyCoordinate = [long, lat];
    // construct a geoJSON point:
    var point = {
        type: 'Point',
        center: xyCoordinate,
        maxDistance: radiusRadians,
        spherical: true
    };

    debug(`${user._id} Looking for posts ${radiusMiles} miles and ${radiusRadians} radians from ${xyCoordinate}`);

    // look for public posts w/in X miles, not deleted, by most recent:
    var queryPromise = Post.find()
      .ne('is_deleted', true)
      .near('point', point)
      .sort('-createdAt')
      .limit(200)
      .exec()
      .then(function(posts) {
          debug(`${posts.length} posts found.`);
          return posts;
      });

      return queryPromise;
}

/////////////////////
//	Exports
/////////////////////

module.exports.checkPostID = checkPostID;
module.exports.createPost = createPost;
module.exports.findPost = findPost;
module.exports.destroyPost = destroyPost;
module.exports.postsByLocation = postsByLocation;
