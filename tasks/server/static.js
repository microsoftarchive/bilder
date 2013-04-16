module.exports = function(grunt) {

  'use strict';

  var connect = require('connect');
  // var spdy = require('spdy');
  var fs = require('fs');
  var path = require('path');

  grunt.registerTask(

    // Name
    'static',

    // Description
    'Connect based static server with regexp based rewrite support',

    // All the magic
    function () {

      // Default options
      var options = this.options({
        'port': 5000,
        'root': '.',
        'base': 'public'
      });

      // Connect requires the root path to be absolute.
      options.root = path.resolve(options.root);

      // Precompile rewrite rules
      var rules = options.rewrite || {};
      var keys = [];
      Object.keys(rules).forEach(function (rule) {
        var regexp = new RegExp('^\\/' + rule + '$');
        rules[regexp] = rules[rule];
        delete rules[rule];
        keys.push(regexp);
      });

      // It's an async task
      var done = this.async();

      // Init the server
      var server = connect();

      // Favicon everything
      server.use(connect.favicon('public/images/favicon.ico'));

      // custom middleware for re-routing
      server.use(function (req, resp, next) {

        // Skip requests other than GET & HEAD
        if ('GET' !== req.method && 'HEAD' !== req.method) {
          return next();
        }

        // Loop through the rules to see if any match
        var regexp, matches, replacement;
        for (var i = 0, l = keys.length; i < l; i++ ) {
          regexp = keys[i];
          matches = req.url.match(regexp);

          // found a match
          if(matches && matches.length) {
            // re-write
            replacement = rules[regexp];
            for (var j = 0, k = matches.length; j < k; j++) {
              replacement = replacement.replace(new RegExp('\\$' + j, 'g'), matches[j]);
            }
            // & break out
            break;
          }
        }

        // rewritten url
        if(matches && matches.length && replacement) {
          req.url = path.join('/', replacement);
        }
        // everything else
        else {
          req.url = path.join('/', options.base, req.url);
        }

        next();
      });

      // use connect's static middleware
      connect['static'].mime.define(options.mime || {});
      server.use(connect['static'](options.root));

      // Once server is started
      server.on('listening', function() {

        var address = server.address();
        var host = address.host || '0.0.0.0';

        grunt.log.writeln('Started static server on ' + host + ':' + address.port + '');

        done();
      })

      // Die if the static server fails to start up
      .on('error', function(err) {
        if (err.code === 'EADDRINUSE') {
          grunt.fatal('Port ' + options.port + ' is already in use by another process.');
        } else {
          grunt.fatal(err);
        }
      });

      // Start listening
      server.listen(options.port);
    }
  );
};