//
//  _   _ ___  ___ _ __ ___
// | | | / __|/ _ \ '__/ __|
// | |_| \__ \  __/ |  \__ \
//  \__,_|___/\___|_|  |___/
//

const User = require('../models/user');
const mongoose = require('mongoose');
const JWT = require('jsonwebtoken');
const debug = require('debug')('app:controllers:users');

/***** DO NOT CHANGE THIS. LIVE AND SENSITIVE KEY *****/
const _auth_secret = process.env.JWT_SECRET;
/******/

/////////////////////
//  Auth Middleware
/////////////////////

function checkUser(req, res, next) {
  // grab auth bearer token (populated by tokenGrabber middleware):
  const token = req.token;
  if (!token) {
    debug('no bearer token');
    return unauthorized(res); // guard no token
  }

  // verify the token:
  JWT.verify(token, _auth_secret, (err, payload) => {
    // check for decoding error:
    if (err) {
      debug(`Error decoding token: ${err}`);
      return unauthorized(res);
    }

    // success - set basic user(+ _id) payload as the user
    // payload is { _id: userID, iat: issuedAtDate }
    req.user = payload;
    next();
  });
}

/////////////////////
//  Auth API
/////////////////////

function login(req, res) {
  // is username is null(falsy) it will just reassign and short circuit never lowercasing it,
  // if truthy aka non null it will be lowercased and returned
  const username = req.body.username && req.body.username.toLowerCase();
  const password = req.body.password;

  // find a user by email and check the Password:
  User.findOne({ username: username })
  .exec()                             // get a promise w/ user
  .then(ensureUserExists)             // returns user
  .then(matchUserPassword(password))  // returns user
  .then(generateTokenForUser)         // returns user and token obj
  .then(successfulLogin(res))         // sends the response w/ user and token
  .catch((err) => {
    debug(`Error logging in: ${err}`);
    return unauthorized(res);
  });
}

/////////////////////
//	API
/////////////////////

/**
* @description Creates user with POST body
*/
function createUser(req, res) {
  var username = req.body.username;
  const password = req.body.password;

  if (!(username && password)) {
    debug('Bad signup params');
    return res.status(400).json({
      error: {
        code: 400,
        message: 'Bad params'
      }
    });
  }

  // sanitize input,
  // could enforce min/max length for username/ password
  username = username.trim();

  // hold onto this for monitoring fraud:
  const ip = req.clientIp;
  debug(`IP: ${ip}`);
  debug(`Creating user ${username} from ${ip}`);

  const user = new User({
    username: username,
    password: password,
  });

  // save the user:
  user.save()
    .then((user) => {
      // we have a user, but we need to authenticate the user:
      const userAndToken = generateTokenForUser(user);
      res.status(201).json(userAndToken);
    })
    .catch((err) => {
      debug(`Error saving new user: ${err}`);
      // check for invalid uniqueness:
      if (err.code === 11000) { // mongodb unique key error
        res.status(409).json({
          error: {
            code: 409,
            message: "Username already taken"
          }
        });
      } else { // other error ??
        res.status(500).json({
          error: {
            code: err.code || 27107,
            message: "Could not save the user"
          }
        });
      }
    });
}

/**
* @description Finds user by ID
*/
function findUser(req, res, next) {
  const currentUserID = req.user && req.user._id;
  const targetUserID = req.params.id;
  debug(`current user ${currentUserID} looking at user ${targetUserID}`);
  // This is ok for now, we could make sure the users are the same

  if (!mongoose.Types.ObjectId.isValid(targetUserID)) {
    return res.status(400).json({
      error: {
        code: 400,
        message: 'Invalid userID'
      }
    });
  }

  // get the user by id, hide the password and logins
  User.findById(targetUserID)
  .select('-password') // hashed anyways but don't pass along in res
  .exec()
  .then((user) => {
    if (user) {
      res.json(user);
    } else {
      // that userID is bogus:
      res.status(400).json({
        error: {
          code: 400,
          message: 'That user doesn\'t exist'
        }
      });
    }
  })
  .catch((err) => {
    debug(`Error fetching user: ${err}`);
    next(err);
  });
}

////////////////
//  Utils
////////////////

/**
* Generate a JWT for a user
* @return {Object} userAndToken - the user and auto token
* @return {Object} userAndToken.user - the user Object
* @return {string} userAndToken.token - the jwt token
*/
function generateTokenForUser(user) {
  // create a token payload for th user
  const payload = {
    _id: user._id
  };
  // create the actual token:
  const token = JWT.sign(payload, _auth_secret);
  // return a user-and-token obj:
  const userAndToken = {
    user: user,
    token: token
  };

  return userAndToken;
}

function ensureUserExists(user) {
  if (!user) throw new Error('No user matched that login');
  return user;
}

function matchUserPassword(password) {
  return (user) => {
    return user.comparePassword(password)
      .then((matched) => {
        if (matched) return user;
        else throw new Error('Password doesn\'t match.');
      });
  };
}

function successfulLogin(res) {
  return (userAndToken) => {
    res.json(userAndToken);
  };
}

function unauthorized(res) {
  res.status(401).json({
    error: {
      code: 401,
      message: 'Not authorized'
    }
  });
}

/////////////////////
//	Exports
/////////////////////

module.exports.checkUser = checkUser;
module.exports.createUser = createUser;
module.exports.login = login;
module.exports.findUser = findUser;
