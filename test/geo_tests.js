//   ____              _____         _
//  / ___| ___  ___   |_   _|__  ___| |_ ___
// | |  _ / _ \/ _ \    | |/ _ \/ __| __/ __|
// | |_| |  __/ (_) |   | |  __/\__ \ |_\__ \
//  \____|\___|\___/    |_|\___||___/\__|___/
//

/**
  * Module Dependencies
  */
const app = require('../app/app');
const supertest = require('supertest');
const expect = require('chai').expect;

// for eslint:
/* global it, describe */

const testToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI1YmQ3YzMwZWY4MzZjMjE5M2FjNWY3ZDMiLCJpYXQiOjE1NDA4NjY4MzF9.GAvURlivow0C2LNYpdzEhcSkLjJdUyH7NvOEH44K8fM';

// These must be in the db:
const testPosts = [
  {
    user: '5ab32d094b54b427d462e5eb',
    content: 'This is a post from Squaw Valley!',
    latitude: 39.21,
    longitude: -120.24
  },
  {
    user: '5ab32d094b54b427d462e5eb',
    content: 'This is a post from Mammoth Lakes!',
    latitude: 37.61,
    longitude: -118.9
  },
  {
    user: '5ab32d094b54b427d462e5eb',
    content: 'This is a post from Aspen!',
    latitude: 39.18,
    longitude: -106.82
  },
  {
    user: '5ab32d094b54b427d462e5eb',
    content: 'This is a post from Whistler!',
    latitude: 50.12,
    longitude: -122.95
  }
];

describe('Geo Tests from SF', function () {

  it('should return 2 posts, excluding Whistler and Aspen', function () {
    return supertest(app)
      .get('/api/v1/posts_by_location')
      .query({ lat: '37.1', long: '-122.5', within: '300' }) // SF Coordinates
      .set({ Authorization: `Bearer ${testToken}` })
      .expect(200)
      .then((res) => {
        expect(res.body).to.have.property('posts');
        expect(res.body.posts).to.not.equal(null);
        expect(res.body.posts.length).to.equal(2);
        console.log('\n\n\n\nPosts: ', res.body.posts);
      });
  });

});
