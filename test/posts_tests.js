//  ____           _         _____         _
// |  _ \ ___  ___| |_ ___  |_   _|__  ___| |_ ___
// | |_) / _ \/ __| __/ __|   | |/ _ \/ __| __/ __|
// |  __/ (_) \__ \ |_\__ \   | |  __/\__ \ |_\__ \
// |_|   \___/|___/\__|___/   |_|\___||___/\__|___/
//

/**
 * Module Dependencies
 */
const app = require('../app/app');
const supertest = require('supertest');
const expect = require('chai').expect;

const testPost = {
    user: "5ab32d094b54b427d462e5eb",
    content: "This is a test post!!",
    // Tahoe city:
    latitude: 39.1677,
    longitude: 120.1452
};

const testToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI1YmQ3YzMwZWY4MzZjMjE5M2FjNWY3ZDMiLCJpYXQiOjE1NDA4NjY4MzF9.GAvURlivow0C2LNYpdzEhcSkLjJdUyH7NvOEH44K8fM";

const differentToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI1YmQ3YzM3MjU0MTFiOTE5NDhhZGQ1MGYiLCJpYXQiOjE1NDA4NjY5MzJ9.wu_JN8R0KZbZNxF6fahrHJC5AEWbkRTlNdiTT3QgM54";

before(function (done) {
    app.on("DBConnected", function(){
        done();
    });
});

xdescribe('Post Tests', function() {

    describe('Create Post', function() {
        it('should return a 201 post response', function() {
            return supertest(app)
              .post('/api/v1/posts')
              .send(testPost)
              .set({ Authorization: `Bearer ${testToken}` })
              .expect(201)
              .then(ensureValidPostResponse)
              .then(function(res) {
                  testPost.postID = res.body._id;
                  console.log("testPostIDNoComments ", testPost.postID);
              });
        });
    });

    describe('Fetch Posts by Location', function() {
        it('should return a 200 response with nearby posts', function() {
            return supertest(app)
              .get('/api/v1/posts_by_location')
              .query({ lat: '39.1677', long: '120.1452', within: '30' })
              .set({ Authorization: `Bearer ${testToken}` })
              .expect(200)
              .then(function(res) {
                  expect(res.body).to.have.property('posts');
                  expect(res.body.posts).to.not.equal(null);
                  console.log(`\n\n\n${res.body.posts.length}${' posts found'}\n\n\n`);
              });
        });
    });

    describe('Read Post', function() {

        it('should return a 200 post response for valid postID', function() {
            return supertest(app)
              .get(`/api/v1/post/${testPost.postID}`)
              .set({ Authorization: `Bearer ${testToken}` })
              .expect(200)
              .then(ensureValidPostResponse);
        });

        it('should fail with invalid postID', function() {
            return supertest(app)
              .get(`/api/v1/post/${'bogusPostID'}`)
              .set({ Authorization: `Bearer ${testToken}` })
              .expect(400)
              .then(function(res) {
                  checkForErrorResponseAndMessage(res, 'Invalid postID');
              });
        });

        it('should fail with valid but nonexistent postID', function() {
            return supertest(app)
              .get(`/api/v1/post/${'5ab32d094b54b427d462e5ez'}`)
              .set({ Authorization: `Bearer ${testToken}` })
              .expect(400)
              .then(function(res) {
                  checkForErrorResponseAndMessage(res, 'Invalid postID');
              });
        });

    });

    describe('Delete Post', function() {

        it('should fail if user is not the post author', function() {
            return supertest(app)
              .delete(`/api/v1/post/${testPost.postID}`)
              .set({ Authorization: `Bearer ${differentToken}` })
              .expect(401)
              .then(function(res) {
                  checkForErrorResponseAndMessage(res, 'Something fishy is going on.');
              });
        });

        it('should return a 200 success response', function() {
            return supertest(app)
              .delete(`/api/v1/post/${testPost.postID}`)
              .set({ Authorization: `Bearer ${testToken}` })
              .expect(200)
              .then(function(res) {
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
