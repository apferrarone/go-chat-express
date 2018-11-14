//   ____                                     _         _____         _
//  / ___|___  _ __ ___  _ __ ___   ___ _ __ | |_ ___  |_   _|__  ___| |_ ___
// | |   / _ \| '_ ` _ \| '_ ` _ \ / _ \ '_ \| __/ __|   | |/ _ \/ __| __/ __|
// | |__| (_) | | | | | | | | | | |  __/ | | | |_\__ \   | |  __/\__ \ |_\__ \
//  \____\___/|_| |_| |_|_| |_| |_|\___|_| |_|\__|___/   |_|\___||___/\__|___/
//

/**
 * Module Dependencies
 */
const app = require('../app/app');
const supertest = require('supertest');
const expect = require('chai').expect;

const testToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI1YmQ3YzMwZWY4MzZjMjE5M2FjNWY3ZDMiLCJpYXQiOjE1NDA4NjY4MzF9.GAvURlivow0C2LNYpdzEhcSkLjJdUyH7NvOEH44K8fM";

const differentToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI1YmQ3YzM3MjU0MTFiOTE5NDhhZGQ1MGYiLCJpYXQiOjE1NDA4NjY5MzJ9.wu_JN8R0KZbZNxF6fahrHJC5AEWbkRTlNdiTT3QgM54';

const testPostID = '5be93c4f544d7e471df0e4ba';
const noCommentsPostID = '5be938a9d3eaf846f43412d0';

const testComment = {
    content: 'This is a test comment about a post',
    _id: '5bebd82f182f126103e833c8'
};



// before(function (done) {
//     app.on("DBConnected", function(){
//         done();
//     });
// });

describe.only('Comments Tests', function() {

    describe('Create Comment', function() {

        it('should return a 201 comment response', function() {
            return supertest(app)
              .post(`/api/v1/posts/${testPostID}/comments`)
              .set({ Authorization: `Bearer ${testToken}` })
              .send(testComment)
              .expect(201)
              .then((res) => {
                  expect(res.body).to.have.property('content');
                  expect(res.body.content).to.not.equal(null);
              })
        });
    });

    describe('Fetch Comments for Post', function() {

        it('should return a 200 res with posts', function() {
            return supertest(app)
              .get(`/api/v1/posts/${testPostID}/comments`)
              .set({ Authorization: `Bearer ${testToken}` })
              .expect(200)
              .then(ensureValidCommentsResponse);
        });

        it('should return a 200 res even if no posts exist', function() {
            return supertest(app)
              .get(`/api/v1/posts/${noCommentsPostID}/comments`)
              .set({ Authorization: `Bearer ${testToken}` })
              .expect(200)
              .then(ensureValidCommentsResponse)
              .then(function(res) {
                  expect(res.body.comments.length).to.equal(0);
              });
        });

        it('should fail with invalid postID', function() {
            return supertest(app)
              .get('/api/v1/posts/bogusPostID/comments')
              .set({ Authorization: `Bearer ${testToken}` })
              .expect(400)
              .then(function(res) {
                  expect(res.body).to.have.property('error');
                  expect(res.body.error).to.have.property('message');
                  expect(res.body.error.message).to.equal('Invalid postID');
              });
        });

    });

    describe('Delete Comment', function () {
      it('should fail if user is not the comment author', function () {
        return supertest(app)
          .delete(`/api/v1/posts/${testPostID}/comments/${testComment._id}`)
          .set({ Authorization: `Bearer ${differentToken}` })
          .expect(401)
      });
    });

    it('should return a 200 success response', function () {
      return supertest(app)
      .delete(`/api/v1/posts/${testPostID}/comments/${testComment._id}`)
      .set({ Authorization: `Bearer ${testToken}` })
      .expect(200)
      .then((res) => {
        expect(res.body).to.have.property('success');
        expect(res.body.success).to.not.equal(null);
      })
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
