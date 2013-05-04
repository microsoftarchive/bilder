module.exports = function(grunt, options) {

  'use strict';

  var stylus = require('stylus');

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

  var BaseCompileTask = require('../lib/base-compiler');
  function StyleCompileTask() {
    BaseCompileTask.call(this, grunt, {
      'name': name,
      'template': template,
      'compile': compile,
      'options': {
        'src': 'src/styles',
        'dest': 'public/styles',
        'glob': '**/*.styl'
      }
    });
  }

  grunt.registerTask('compile/stylus', 'Compile stylus sheets as AMD modules', StyleCompileTask);
  grunt.registerTask('compile/styles', ['compile/stylus']);
};