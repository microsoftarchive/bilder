module.exports = function(grunt) {

  'use strict';

  var requirejs = require('requirejs');
  var UglifyJS = require('uglify-js');

  var path = require('path');
  var resolve = path.resolve;
  var join = path.join;

  var _ = grunt.util._;

  // This function takes JS code as string input,
  // & returns the compressed version
  function compress (code) {

    var tree = UglifyJS.parse(code);
    tree.figure_out_scope();

    var compressor = UglifyJS.Compressor({
      'warnings': false
    });

    var ast = tree.transform(compressor);
    ast.figure_out_scope();
    ast.compute_char_frequency();
    ast.mangle_names();

    var stream = UglifyJS.OutputStream({
      'indent_start': 0,
      'indent_level': 0,
      'beautify': true
    });

    ast.print(stream);
    return stream.toString();
  }

  function onBuildRead (name, path, contents ) {
    return compress(contents);
  }

  function RequireJSCompilerTask() {

    // Async task
    var done = this.async();

    // Options
    var target = this.target;
    var options = this.options({
      'logLevel': 2,
      'paths': {},
      'baseUrl': 'public',
      'useSourceUrl': true,
      'optimize': 'uglify2'
    });

    if(options.useSourceUrl) {
      options.onBuildRead = onBuildRead;
    }

    // make paths absolute, to be able to include files outside the base directory
    var paths = options.paths = options.paths || {};
    _.each(paths, function (path, key) {
      paths[key] = resolve(join(options.baseUrl, path));
    });

    // make the out-file path absolute too
    options.out = resolve(join(options.baseUrl, options.out));

    // Optimize
    requirejs.optimize(options, function() {
      grunt.log.writeln('\u2714'.green, target);
      process.nextTick(done);
    });
  }

  grunt.registerMultiTask('requirejs', 'Build a RequireJS project.', RequireJSCompilerTask);
};
