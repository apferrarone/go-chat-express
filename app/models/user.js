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
    username: { type: String, required: true, lowercase: true, index: { unique: true } },
    password: { type: String, required: true }
}, { timestamps: true } ); // option to auto set createdAt & updatedAt Dates

var progress = function() {};

/**
* @description Hash the plaintext password when it changes
*/
userSchema.pre('save', function(next) {
    const user = this; // grab ref to user

    // only hash password if it has been modified (or is new):
    if (!user.isModified('password')) return next();

    // generate a salt:
    bcrypt.genSalt(SALT_WORK_FACTOR, function(err, salt) {
        if (err) return next(err);

        // hash password using new salt:
        bcrypt.hash(user.password, salt, progress, function(err, hash) {
            if (err) return next(err);

            // override the plaintext password w/ hashed one:
            user.password = hash;
            next();
        });
    });
});

/**
* @description Bcrypt password comparison helper
*/
userSchema.methods.comparePassword = function(guess) {
    const self = this;

    var comparisonPromise = new Promise(function(resolve, reject) {
        bcrypt.compare(guess, self.password, function(err, isMatch) {
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
