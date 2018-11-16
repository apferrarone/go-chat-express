//   ____                                     _         _____         _
//  / ___|___  _ __ ___  _ __ ___   ___ _ __ | |_ ___  |_   _|__  ___| |_ ___
// | |   / _ \| '_ ` _ \| '_ ` _ \ / _ \ '_ \| __/ __|   | |/ _ \/ __| __/ __|
// | |__| (_) | | | | | | | | | | |  __/ | | | |_\__ \   | |  __/\__ \ |_\__ \
//  \____\___/|_| |_| |_|_| |_| |_|\___|_| |_|\__|___/   |_|\___||___/\__|___/
//

/**
 * Module Dependencies
 */
const supertest = require('supertest');
const expect = require('chai').expect;
const testUtils = require('../utils');

// for eslint:
/* global it, describe, before */

var differentToken;
const testCommentID = '5bebd82f182f126103e833c8';     // parent = Squaw
const testPostID = '5be93c4f544d7e471df0e4ba';        // Squaw Valley
const noCommentsPostID = '5be938a9d3eaf846f43412d0';  // Aspen Post

const newComment = {
  content: 'This is a test comment about a post',
};

module.exports = function (app, user) {

  describe('Comments Tests', function () {

    before(function (done) {
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

    describe('Create Comment', function () {

      it('should return a 201 comment response', function () {
        return supertest(app)
          .post(`/api/v1/posts/${testPostID}/comments`)
          .set({ Authorization: user.token })
          .send(newComment)
          .expect(201)
          .then((res) => {
            expect(res.body).to.have.property('content');
            expect(res.body.content).to.not.equal(null);
          });
      });
    });

    describe('Fetch Comments for Post', function () {

      it('should return a 200 res with posts', function () {
        return supertest(app)
          .get(`/api/v1/posts/${testPostID}/comments`)
          .set({ Authorization: user.token })
          .expect(200)
          .then(ensureValidCommentsResponse);
      });

      it('should return a 200 res even if no posts exist', function () {
        return supertest(app)
          .get(`/api/v1/posts/${noCommentsPostID}/comments`)
          .set({ Authorization: user.token })
          .expect(200)
          .then(ensureValidCommentsResponse)
          .then((res) => {
            expect(res.body.comments.length).to.equal(0);
          });
      });

      it('should fail with invalid postID', function () {
        return supertest(app)
          .get('/api/v1/posts/bogusPostID/comments')
          .set({ Authorization: user.token })
          .expect(400)
          .then((res) => {
            expect(res.body).to.have.property('error');
            expect(res.body.error).to.have.property('message');
            expect(res.body.error.message).to.equal('Invalid postID');
          });
      });
    });

    describe('Delete Comment', function () {
      it('should fail if user is not the comment author', function () {
        return supertest(app)
          .delete(`/api/v1/posts/${testPostID}/comments/${testCommentID}`)
          .set({ Authorization: differentToken })
          .expect(401);
      });

      // TODO: need a before each here
      it('should return a 200 success response', function () {
        return supertest(app)
          .delete(`/api/v1/posts/${testPostID}/comments/${testCommentID}`)
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

  function ensureValidCommentsResponse(res) {
    expect(res.body).to.have.property('comments');
    expect(res.body.comments).to.not.equal(null);
    console.log(`\n\nComment count: ${res.body.comments.length}\n\n`);
    return res;
  }
};
