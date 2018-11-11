//  _   _                 _____         _
// | | | |___  ___ _ __  |_   _|__  ___| |_ ___
// | | | / __|/ _ \ '__|   | |/ _ \/ __| __/ __|
// | |_| \__ \  __/ |      | |  __/\__ \ |_\__ \
//  \___/|___/\___|_|      |_|\___||___/\__|___/
//

/**
 * Module Dependencies
 */
const app = require('../app/app');
const supertest = require('supertest');
const expect = require('chai').expect;

// for eslint:
/* global it, describe, beforeEach */

// Mocha
// describe - high level grouping (suite) of tests. Nestable
// it - a single test fn. // return a promise from the test fn
// don't use done arg w/ promises
// better not to pass mocha arrow fns, they lexically bind this and can't access,
// the mocha context. If you don't need the mocha this context it's fine,
// but if you need to refactor it will be a bitch.
// add .only to a test or suite for exlusive testing, you can do as many as you want,
// don't add this to version control, also for the opposite effect use skip.

// Chai
// expect - expect(foo).to.be.a('string'); etc

// needs to be a unique user each signup call
const testUser = {
  username: 'TestUser1',
  password: 'qqqqqq'
};

const invalidTestUser = {
  username: 'invalid'
};

describe.only('User Tests', function () {

  /**
   * SIGNUP TESTS
   */
  describe('Signup User', function () {
    // signup route:
    var request;
    beforeEach(function () {
      request = supertest(app)
        .post('/api/v1/signup')
        .send(testUser);
    });

    it('should return a 201 userAndToken response', function () {
      return request
        .expect(201)
        .then(ensureUserAndTokenResponse)
        .then((res) => {
          testUser.userID = res.body.user._id;
          testUser.token = res.body.token;
        });
    });

    it('should fail if username is taken', function () {
      return request
        .expect(409)
        .then((res) => {
          checkForErrorResponseAndMessage(res, 'Username already taken');
        });
    });

    it('should fail if params are invalid', function () {
      return supertest(app)
        .post('/api/v1/signup')
        .send(invalidTestUser)
        .expect(400)
        .then((res) => {
          checkForErrorResponseAndMessage(res, 'Bad params - request did not pass validation');
        });
    });
  });

  /**
   * LOGIN TESTS
   */
  describe('Login User', function () {
    // login route:
    var request;
    beforeEach(function () {
      request = supertest(app)
        .post('/api/v1/login')
        .send(testUser);
    });

    it('should fail if user doesn\'t exist', function () {
      return request
        .send({ username: 'nonexistentusername', password: 'qqqqqq' })
        .expect(401)
        .then((res) => {
          checkForErrorResponseAndMessage(res, 'Not authorized');
        });
    });

    it('should fail if password is incorrect', function () {
      return request
        .send({ username: testUser.username, password: 'wrongpassword' })
        .expect(401)
        .then((res) => {
          checkForErrorResponseAndMessage(res, 'Not authorized');
        });
    });

    it('should return a 200 userAndToken response for valid user', function () {
      return request
        .send(testUser)
        .expect(200)
        .then(ensureUserAndTokenResponse);
    });
  });

  /**
   * FETCH USER TESTS
   */
  describe('Fetch User', function () {
    // read user route:
    var request;
    beforeEach(function () {
      request = supertest(app)
        .get(`/api/v1/users/${testUser.userID}`);
    });

    it('should fail if no valid auth token', function () {
      return request
        .expect(401)
        .then((res) => {
          checkForErrorResponseAndMessage(res, 'Not authorized');
        });
    });

    it('should return a 200 User response if user exists', function () {
      return request
        .set({ Authorization: `Bearer ${testUser.token}` })
        .expect(200)
        .then((res) => {
          expect(res.body).to.have.property('_id');
          expect(res.body._id).to.not.equal(null);
          expect(res.body).to.have.property('username');
          expect(res.body.username).to.not.equal(null);             expect(res.body).to.not.have.property('password');
        });
    });

    it('should fail if user doesn\'t exist', function () {
      return supertest(app) // Don't use request from above here
        .get('/api/v1/users/53cb6b9b4f4ddef1ad47f943')
        .set({ Authorization: `Bearer ${testUser.token}` })
        .expect(400)
        .then((res) => {
          checkForErrorResponseAndMessage(res, 'That user doesn\'t exist');
        });
    });

    it('should fail if userID is invalid', function () {
      return supertest(app) // Don't use request from above here
        .get('/api/v1/users/bogusID')
        .set({ Authorization: `Bearer ${testUser.token}` })
        .expect(400)
        .then((res) => {
          checkForErrorResponseAndMessage(res, 'Invalid userID');
        });
    });
  });

});

////////////////
//  Utils
////////////////

function ensureUserAndTokenResponse(res) {
  expect(res.body).to.have.property('user');
  expect(res.body.user).to.not.equal(null);
  expect(res.body).to.have.property('token');
  expect(res.body.token).to.not.equal(null);
  return res;
}

function checkForErrorResponseAndMessage(res, message) {
  expect(res.body).to.have.property('error');
  expect(res.body.error).to.not.equal(null);
  expect(res.body.error).to.have.property('code');
  expect(res.body.error.code).to.not.equal(null);
  expect(res.body.error).to.have.property('message');
  expect(res.body.error.message).to.equal(message);
}
