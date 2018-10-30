//                  _
//  _ __ ___   __ _(_)_ __
// | '_ ` _ \ / _` | | '_ \
// | | | | | | (_| | | | | |
// |_| |_| |_|\__,_|_|_| |_|
//

const express = require('express');
const path = require('path');
const logger = require('morgan');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const tokenGrabber = require('express-bearer-token');
const debug = require('debug')('app:main');

const config = require('../config/config');
const routes = require('./routes');

const app = express();

// connect to the db asap:
mongoose.connect(config.db.connection, { useNewUrlParser: true });
mongoose.set('debug', process.env.DEBUG); // for logging

// ensure connection was successful:
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
  console.log('CONNECTED to the DB!!!');
});

// standard middleware:
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// TODO: setup auth w/ jwt and attempt to grab bearer token and populate req.token
app.use(tokenGrabber());

// mount routing middleware:
app.use('/', routes);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  const err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  console.log(`\n\n\n${err}\n\n\n`);
  res.status(err.status || 500);
  res.json({
    error: {
      // app.get('env') returns 'development' if NODE_ENV is undefined
      message: req.app.get('env') === 'development' ? err.message: 'Not Found'
    }
  });
});

module.exports = app;
