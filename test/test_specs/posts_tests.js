//  ____           _         _____         _
// |  _ \ ___  ___| |_ ___  |_   _|__  ___| |_ ___
// | |_) / _ \/ __| __/ __|   | |/ _ \/ __| __/ __|
// |  __/ (_) \__ \ |_\__ \   | |  __/\__ \ |_\__ \
// |_|   \___/|___/\__|___/   |_|\___||___/\__|___/
//

/**
 * Module Dependencies
 */
const supertest = require('supertest');
const expect = require('chai').expect;
const testUtils = require('../utils');

// for eslint:
/* global it, describe, before */

const testPost = {
  content: 'This is a test post from nonexistent user!!',
  // Tahoe city:
  latitude: 39.1677,
  longitude: -120.1452
};

const invalidTestPost = {
  content: 'This is an invalid test post'
};

var differentToken;

module.exports = function (app, user) {

  describe('Post Tests', function () {

    // set the user on testPost:
    before(function (done) {
      testPost.user = user;
      // generate another token for a second user:
      testUtils.getAuthenticatedUser()
        .then((user) => {
          differentToken = user.token;
          done();
        })
        .catch((err) => {
          throw (err);
        });
    });

    /**
     * POST CREATION TESTS
     */
    describe('Create Post', function () {
      it('should return a 201 post response', function () {
        return supertest(app)
          .post('/api/v1/posts')
          .send(testPost)
          .set({ Authorization: user.token })
          .expect(201)
          .then(ensureValidPostResponse)
          .then((res) => {
            testPost.postID = res.body._id;
          });
      });

      it('should return a 400 post response for invalid params', function () {
        return supertest(app)
          .post('/api/v1/posts')
          .send(invalidTestPost)
          .set({ Authorization: user.token })
          .expect(400)
          .then((res) => {
            checkForErrorResponseAndMessage(res, 'Bad params - request did not pass validation');
          });
      });
    });

    /**
     * FETCH POSTS BY LOCATION TESTS
     */
    describe('Fetch Posts by Location', function () {
      it('should return a 200 response with nearby posts', function () {
        return supertest(app)
          .get('/api/v1/posts_by_location')
          .query({ lat: '39.1677', long: '-120.1452', within: '30' })
          .set({ Authorization: user.token })
          .expect(200)
          .then((res) => {
            expect(res.body).to.have.property('posts');
            expect(res.body.posts).to.not.equal(null);
          });
      });

      it('should fail b/c of bad params', function () {
        return supertest(app)
          .get('/api/v1/posts_by_location')
          .query({ lat: '37.1', within: '300' }) // no long
          .set({ Authorization: user.token })
          .expect(400)
          .then((res) => {
            expect(res.body).to.have.property('error');
            expect(res.body.error).to.not.equal(null);
          });
      });
    });

    /**
     * FETCH POSTS TESTS
     */
    describe('Read Post', function () {
      it('should return a 200 post response for valid postID', function () {
        return supertest(app)
          .get(`/api/v1/post/${testPost.postID}`)
          .set({ Authorization: user.token })
          .expect(200)
          .then(ensureValidPostResponse);
      });

      it('should fail with invalid postID', function () {
        return supertest(app)
          .get(`/api/v1/post/${'bogusPostID'}`)
          .set({ Authorization: user.token })
          .expect(400)
          .then((res) => {
            checkForErrorResponseAndMessage(res, 'Invalid postID');
          });
      });

      it('should fail with valid but nonexistent postID', function () {
        return supertest(app)
          .get(`/api/v1/post/${'5be7d11ab74c413f876b72e8'}`)
          .set({ Authorization: user.token })
          .expect(400)
          .then((res) => {
            checkForErrorResponseAndMessage(res, 'That post doesn\'t exist');
          });
      });
    });

    /**
     * DELETE POSTS TESTS
     */
    describe('Delete Post', function () {
      it('should fail if user is not the post author', function () {
        return supertest(app)
          .delete(`/api/v1/post/${testPost.postID}`)
          .set({ Authorization: differentToken })
          .expect(401)
          .then((res) => {
            checkForErrorResponseAndMessage(res, 'Something fishy is going on.');
          });
      });

      // TODO: make sure you test for deleting one post when user has multiple posts,
      // This has been tested manually but not w/ written tests

      it('should return a 200 success response', function () {
        return supertest(app)
          .delete(`/api/v1/post/${testPost.postID}`)
          .set({ Authorization: user.token })
          .expect(200)
          .then((res) => {
            expect(res.body).to.have.property('success');
            expect(res.body.success).to.not.equal(null);
          });
      });
    });
  });

  ////////////////
  //  Utils
  ////////////////

  function ensureValidPostResponse(res) {
    expect(res.body).to.have.property('_id');
    expect(res.body._id).to.not.equal(null);
    expect(res.body).to.have.property('user');
    expect(res.body.user).to.not.equal(null);
    expect(res.body).to.have.property('content');
    expect(res.body.content).to.not.equal(null);
    expect(res.body).to.have.property('latitude');
    expect(res.body.latitude).to.not.equal(null);
    expect(res.body).to.have.property('longitude');
    expect(res.body.longitude).to.not.equal(null);
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
};
