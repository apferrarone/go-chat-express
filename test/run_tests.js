//                     _            _
//  _ __ _   _ _ __   | |_ ___  ___| |_ ___
// | '__| | | | '_ \  | __/ _ \/ __| __/ __|
// | |  | |_| | | | | | ||  __/\__ \ |_\__ \
// |_|   \__,_|_| |_|  \__\___||___/\__|___/
//

// Mocha Notes
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

/**
* Mocha test runner, in our test script, point to this file,
* specify --delay flag to wait on run() call after async ops.
*/

const fs = require('fs');
const app = require('../app/app');
const testUtils = require('./utils');

app.on('DBConnected', () => {
  testUtils.getAuthenticatedUser()
    .then((user) => {
      // Get all test spec files:
      let testFiles = fs.readdirSync(__dirname + '/test_specs');
      testFiles.forEach((file) => {
        require('./test_specs/' + file)(app, user);
      });
      // start the mocha tests:
      run();
    })
    .catch((err) => {
      throw(err);
    });
});
