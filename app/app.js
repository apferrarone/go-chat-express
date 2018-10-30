//                  _
//  _ __ ___   __ _(_)_ __
// | '_ ` _ \ / _` | | '_ \
// | | | | | | (_| | | | | |
// |_| |_| |_|\__,_|_|_| |_|
//

var config = require('../config/config');
var express = require('express');
var path = require('path');
var logger = require('morgan');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');

var routes = require('./routes');

var app = express();

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

// mount routing middleware:
app.use('/', routes);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
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
