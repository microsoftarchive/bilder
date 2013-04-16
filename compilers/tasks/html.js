module.exports = function(grunt) {

  'use strict';

  var fs = require('fs');
  var path = require('path');
  var handlebars = require('handlebars');
  var minifier = require('html-minifier');

  var async = grunt.util.async;

  // Localization helper
  var localizationHelper = require('../lib/localizationHelper');
  handlebars.registerHelper('localized', localizationHelper);

  function precompilePartials (dir, callback) {

    // TODO: use glob instead of fs.readdir
    fs.readdir(dir, function(err, files) {

      files = files.filter(function (name) {
        return (/\.tmpl$/).test(name);
      });

      async.forEach(files, function (name, _callback) {
        var filePath = path.join(dir, name);
        name = name.replace(/\.tmpl$/, '');
        fs.readFile(filePath, function (err, data) {
          var partial = handlebars.compile(data.toString());
          handlebars.registerPartial(name, partial);
          _callback();
        });
      }, callback);
    });
  }

  function compileTemplate (options, callback) {
    // Read the template file, compile it & render it
    fs.readFile(options.input, function (err, data) {
      var template = handlebars.compile(data.toString());
      var markup = minifier.minify(template(options.params || {}), {
        'removeComments': true,
        'collapseWhitespace': true,
        'removeAttributeQuotes': true
      });
      fs.writeFile(options.output, markup, callback);
    });
  }

  function HTMLCompileTask() {

    var options = this.options({});

    // Async task
    var done = this.async();

    // if no out-file was specified, use the key instead
    options.out = options.out || this.target;

    // find the absolute path
    var inputFilePath  = path.resolve(path.join(options.src, options.template + '.tmpl'));
    var outputFilePath = path.resolve(path.join(options.dest, options.out + '.html'));

    // precompile all the partials
    var partialsPath = path.resolve(options.partials);

    // TODO: do this in a better way
    if(options.entry) {
      options.params.assets = new handlebars.SafeString('<script type="application/javascript" data-main="' + options.entry + '" src="vendor/require.js"></script>');
    }

    precompilePartials(partialsPath, function() {
      compileTemplate({
        'input': inputFilePath,
        'output': outputFilePath,
        'params': options.params
      }, done);
    });
  }

  grunt.registerMultiTask('compile/html', 'Compile html file that serve as entry points', HTMLCompileTask);
};