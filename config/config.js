//                   __ _
//   ___ ___  _ __  / _(_) __ _
//  / __/ _ \| '_ \| |_| |/ _` |
// | (_| (_) | | | |  _| | (_| |
//  \___\___/|_| |_|_| |_|\__, |
//                         |___/

var debug = require('debug')('app:config');

// Don't want to use .env files in production:
if (!process.env.NODE_ENV || process.env.NODE_ENV == 'development') {
  console.log(require('dotenv').config({ silent: true }));
}

console.log('NODE_ENV: ', process.env.NODE_ENV);

const mongolab = {
  name: 'MongoLab',
  connection: process.env.MONGO_CONNECTION
};

function configure(configuration) {
  for (var key in configuration) {
    var config = configuration[key];
    // if it's missing, bail:
    if (!config) {
      var error = new Error(`Could not configure ${configuration.name}. Missing ${key}`);
      debug(error);
      throw error;
    }
  }
  return configuration;
}

exports.db = configure(mongolab);
