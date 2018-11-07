//
//  _   _ ___  ___ _ __
// | | | / __|/ _ \ '__|
// | |_| \__ \  __/ |
//  \__,_|___/\___|_|
//

const bcrypt = require('bcrypt-nodejs');
const debug = require('debug')('app:models:user');
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/*
  The user's password is based off a salted hash,
  this number determines how many 2^work times to run the salt hashing
  (for better security in bruce force attacks).
  DO NOT CHANGE IT
*/
const SALT_WORK_FACTOR = 10;
/// DO NOT CHANGE AFTER PROD DEPLOYMENT

/**
* @description The User schema
*/
const userSchema = new Schema({
  username: { type: String, required: true, lowercase: true, minlength: 2, maxlength: 20, index: { unique: true } },
  password: { type: String, required: true }
}, { timestamps: true } ); // option to auto set createdAt & updatedAt Dates


/**
* @description Hash the plaintext password when it changes,
* Remember that we cannot use arrow fns here or methods b/c they don't bind this, they just,
* look at lexical scope which is global here. The scope is not class level.
* Just like prototypes using arrow fns will be bad b/c the dot notation will not,
* properly bind this b/c arrow fns only bind lexically and automatically.
* Inside the fns we use arrow fns to capture this once inside when this will be bound,
* to the db document (obj).
*/

var noop = function() {};

userSchema.pre('save', function(next) {

  // only hash password if it's value is different than current
  if (!this.isModified('password')) return next();

  // generate a salt
  bcrypt.genSalt(SALT_WORK_FACTOR, (err, salt) => {
    if (err) return next(err);

    // hash password using new salt
    bcrypt.hash(this.password, salt, noop, (err, hash) => {
      if (err) return next(err);
      // override the plaintext password w/ hashed one:
      this.password = hash;
      next();
    });
  });
});


/**
* @description Bcrypt password comparison helper
*/
userSchema.methods.comparePassword = function(guess) {
  const comparisonPromise = new Promise((resolve, reject) => {
    bcrypt.compare(guess, this.password, (err, isMatch) => {
      if (err) return reject(err);
      else resolve(isMatch);
    });
  });

  return comparisonPromise;
};

/////////////////////
//	Exports
/////////////////////

const User = mongoose.model('User', userSchema);
module.exports = User;
