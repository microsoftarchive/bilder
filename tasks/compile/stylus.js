module.exports = function(grunt, options) {

  'use strict';

  var stylus = require('stylus');

  var taskName = 'compile/stylus';
  var suffixRegExp = /\.styl$/;
  var template = "define(function() { return {'name': '%s', 'styles': %s }; });";

  function name (file, options) {
    var prefixRegexp = new RegExp('^' + options.src + '/');
    return file.replace(prefixRegexp, '').replace(suffixRegExp, '');
  }

  function compile (rawStylus, options, callback) {
    stylus(rawStylus, {
      'compress': true,
      'paths': [options.srcPath]
    }).render(function(err, css) {

      // oopsie
      if (err) {
        return callback(err);
      }

      callback(null, JSON.stringify(css.replace(/[\r\n\s]+/g, ' ')));
    });
  }

  var BaseCompileTask = require('./base');
  function StyleCompileTask() {
    BaseCompileTask.call(this, grunt, {
      'name': name,
      'template': template,
      'compile': compile
    });
  }

  grunt.registerMultiTask(taskName, 'Compile stylus sheets as AMD modules', StyleCompileTask);
};