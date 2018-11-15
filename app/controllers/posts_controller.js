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

const METERS_PER_MILE = 1609.34; // EARTH_RADIUS = 3959.0
const AUTOEXPAND_MIN_POSTS = 10;
const AUTOEXPAND_INTERVAL_RADIUS = [25, 100];

/////////////////////
//  Middleware
/////////////////////

function checkPostID(req, res, next) {
  const postID = req.params.postID;
  if (!mongoose.Types.ObjectId.isValid(postID)) {
    // could call next w/ an error and catch in app.js...
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
 * Should come after checkPostID in middleware stack
 */
function createPost(req, res) {
  const user = req.user;
  const latitude = req.body.latitude || req.body.lat;
  const longitude = req.body.longitude || req.body.long;
  var content = req.body.content;

  // sanitize content, validation/ param errors handled below
  content = content.trim();
  debug(`User ${user._id} creating post at ${latitude}, ${longitude}`);

  const post = new Post({
    user: user._id,
    content: content,
    latitude: latitude,
    longitude: longitude
  });

  // location field gets added during pre-save hook
  post.save()
    .then((post) => {
      res.status(201).json(post);
    })
    .catch((err) => {
      debug(`Error saving new post: ${err}`);
      if (err.name === 'ValidationError') {
        res.status(400).json({
          error: {
            code: 400,
            message: 'Bad params - request did not pass validation'
          }
        });
      } else { // other error ??
        res.status(500).json({
          error: {
            code: err.code || 500,
            message: err.message || 'Could not save the post'
          }
        });
      }
    });
}

/** READ **/

/**
 * @description Finds a post by post ID
 * Should come after checkPostID in middleware stack
 */
function findPost(req, res) {
  const postID = req.params.postID;

  // find the post by id:
  Post.findById(postID)
    .exec()
    .then((post) => {
      if (post) {
        res.json(post);
      } else {
        // no post found, throw error to be caught below:
        const err = new Error('Invalid postID');
        err.message = 'That post doesn\'t exist';
        err.code = 400;
        throw err;
      }
    })
    .catch((err) => {
      debug(`Error fetching post: ${err}`);
      const status = err.code || 500;
      res.status(status).json({
        error: {
          code: status,
          message: err.message || 'Error when looking for post'
        }
      });
    });
}

/** DELETE **/

/**
 * @description Marks a post as deleted (soft delete),
 * Should come after checkPostID in middleware stack
 */
function destroyPost(req, res) {
  const thisUser = req.user._id;
  const postID = req.params.postID;

  debug(`user ${thisUser} deleting post ${postID}`);

  Post.updateOne()
    .where('_id', postID)
    .where('user', thisUser)
    .set({ is_deleted: true }) // a mongoose update turns into $set anyways
    .exec()
    .then((rawResult) => {
      // for query.prototype.update, rawResult is writeOpResult
      if (rawResult.nModified > 0) {
        res.json({ success: true });
      } else {
        // post may not belong to thisUser, funny business here...
        debug(`User ${thisUser} might not own post ${postID}`);
        res.status(401).json({
          error: {
            code: 401,
            message: 'Something fishy is going on.'
          }
        });
      }
    })
    .catch((err) => {
      debug(`error deleting post: ${err}`);
      res.status(err.code || 500).json({
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

  console.log(user, lat, long, radiusMiles);

  if (!user || !lat || !long || !radiusMiles) {
    return res.status(400).json({
      error: {
        code: 400,
        message: 'Bad params - request did not pass validation'
      }
    });
  }

  queryPostsAtLocationAutoexpanding(user, lat, long, radiusMiles)
    .then((postsResults) => {
      res.json(postsResults);
    })
    .catch((err) => {
      debug(`Error fetching posts by location: ${err}`);
      res.status(err.code || 500).json({
        error: {
          code: err.code || 500,
          message: err.message || 'Couldn\'t find posts by location'
        }
      });
    });
}

/**
 * @description Utility for querying posts and autoexpanding radius!
 * This is private to this file and will assume that all params are valid
 */
function queryPostsAtLocationAutoexpanding(user, lat, long, radiusMiles, autoExpandAttempt) {
  if (!user || !lat || !long || !radiusMiles) {
    throw new Error('Bad params to queryPostsAtLocationAutoexpanding');
  }

  var radiusMeters = radiusMiles * METERS_PER_MILE;
  var coordinates = [long, lat];

  // specify a GeoJSON Point for center,
  // use meters not radians for GeoJSON (radians for legacy coordinate pairs)
  var queryPoint = {
    center: {
      type: 'Point',
      coordinates: coordinates // [long, lat]
    },
    maxDistance: radiusMeters,
    spherical: true
  };

  debug(`${user._id} Looking for posts ${radiusMiles} miles and ${radiusMeters} meters from ${coordinates}`);

  // look for public posts w/in X miles, not deleted, by most recent:
  var queryPromise = Post.find()
    .ne('is_deleted', true)
    .near('location', queryPoint)
    .sort('-createdAt')
    .limit(200)
    .exec()
    .then((posts) => {
      debug(`${posts.length} posts found.`);
      // *auto-expand* if there are less than X posts, try again w/ a larger radius
      autoExpandAttempt = autoExpandAttempt || 0; // jesus take the wheel haha
      // if there are less than X posts, try a larger radius but don't recurse forever:
      if (posts.length < AUTOEXPAND_MIN_POSTS && autoExpandAttempt < AUTOEXPAND_INTERVAL_RADIUS.length) {
        // set radius to be larger in hopes of finding more posts
        radiusMiles = radiusMiles + AUTOEXPAND_INTERVAL_RADIUS[autoExpandAttempt];
        debug(`Not enough posts found, AUTOEXPANDING RADIUS to ${radiusMiles}. ATTEMPT ${autoExpandAttempt + 1}`);
        // halt further scoped ops and recurse (in the promise chain), making sure to stop after 1 iteration.
        return queryPostsAtLocationAutoexpanding(user, lat, long, radiusMiles, autoExpandAttempt + 1);
      }
      // pass along the results:
      const postsResponse = {
        posts: posts,
        radius_miles: radiusMiles
      };

      return postsResponse;
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
