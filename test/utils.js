 //        _   _ _
 //  _   _| |_(_) |___
 // | | | | __| | / __|
 // | |_| | |_| | \__ \
 //  \__,_|\__|_|_|___/
 //

const supertest = require('supertest');
const expect = require('chai').expect;
const app = require('../app/app');

/**
 * @description Gets a new unauthenticated user.
 * Username should be random.
 */
module.exports.getNewUser = function () {
  let randomInt = Math.floor(Math.random() * 100000);
  return {
    username: `TestUser${randomInt}`,
    password: 'qqqqqq'
  };
}

/**
 * @description Gets and authenticated User object.
 * Returns a promise.
 */
module.exports.getAuthenticatedUser = function () {
  let testUser = this.getNewUser();
  return supertest(app)
    .post('/api/v1/signup')
    .send(testUser)
    .expect(201)
    .then((res) => {
      console.log(res.body);
      expect(res.body).to.have.property('token');
      expect(res.body.token).to.not.equal(null);
      expect(res.body).to.have.property('user');
      expect(res.body.user).to.have.property('_id');
      expect(res.body.token).to.not.equal(null);
      return res;
    })
    .then((res) => {
      testUser.token = `Bearer ${res.body.token}`;
      testUser._id = res.body.user._id;
      return testUser;
    })
}
