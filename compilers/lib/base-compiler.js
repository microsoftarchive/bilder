module.exports = (function() {

  'use strict';

  var fs = require('fs');
  var path = require('path');
  var util = require('util');

  function BaseCompileTask (grunt, params, callback) {

    // This is not a real task.. make grunt skip it
    if(this === grunt) {
      return;
    }

    // Utils
    var async = grunt.util.async;
    // var _ = grunt.util._;

    // populate options
    var options = this.options(params.options || {});

    // populate files
    var files = grunt.file.glob.sync(path.join(options.src, options.glob));
    if(!files || files.length === 0) {
      grunt.log.writeln('no files');
      return;
    }

    // This task is async
    var done = this.async();

    // If a callback is passed, use that instead after everything is done compiling
    if(typeof callback === 'function') {
      var _done = done;
      done = function(err, data) {
        callback(err, data, options, _done);
      };
    }

    // Source & dest paths
    options.srcPath = path.resolve(options.src);
    options.destPath = path.resolve(options.dest);

    // compilation should be asynchronous
    async.map(files, function(file, callback) {

      // extract the module name from the
      var name = params.name(file, options);

      // ensure the target destination exists
      var destFilePath = path.join(options.destPath, name + '.js');
      grunt.file.mkdir(path.dirname(destFilePath));

      // read the file
      var rawCode = grunt.file.read(file);

      // compile
      params.compile(rawCode, options, function(err, generatedCode) {

        // oopsie
        if (err) {
          return callback(err);
        }

        // write out the file
        var module = util.format(params.template, name, generatedCode);
        fs.writeFile(destFilePath, module, function() {
          var inFile = file.replace(options.src + '/',  '');
          var outFile = name + '.js';
          grunt.log.debug('\u2713', inFile, '\u2192', outFile);
          callback(null, {
            'file': file,
            'name': name
          });
        });
      });
    }, done);
  }

  return BaseCompileTask;

})();
