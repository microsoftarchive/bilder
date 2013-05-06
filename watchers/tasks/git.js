var gaze = require('gaze');
var path = require('path');
var exec = require('child_process').exec;

module.exports = function (grunt) {

  'use strict';

  function GitWatcherTask () {

    // options
    var options = this.options({
      'root': '',
      'keepAlive': false,
      'head': '.git/HEAD',
      'submodules': []
    });

    // Never finish this task
    var done = this.async();

    // Make root path absolute
    options.root = path.resolve(options.root);

    // Watch the git HEAD
    gaze(options.head, {
      'cwd': options.root
    }, function(err, watcher) {

      // On change
      watcher.on('changed', function() {

        grunt.log.debug('git commit was changed');

        // Check if the submodules are at the correct version
        options.submodules.forEach(function (submodule) {

          exec('git diff --minimal ' + submodule, {
            'cwd': options.root
          }, function(err, stdout, stderr) {

            var lines = (stdout || '').split(/[\r\n]+/);
            if(!err && lines.length > 3) {
              var whatItIs = lines[6].split(' ')[2];
              var whatItShouldBe = lines[5].split(' ')[2];

              // git checkout the hash that should have been
              if(whatItShouldBe !== whatItIs) {

                grunt.log.debug('reseting module ' + submodule);

                exec('git checkout ' + whatItShouldBe, {
                  'cwd': path.join(options.root, submodule)
                }, function(err) {
                  if(!err) {
                    grunt.log.ok('submodule switched -', submodule);
                  }
                });
              }
            } else {
              grunt.log.debug(submodule + ' at correct hash');
            }
          });
        });

      });

      // return, unless explicitely need to wait
      if(!options.keepAlive) {
        done();
      }
    });
  }

  grunt.registerTask('watch/git', 'Keep git submodules at the correct hash', GitWatcherTask);
};
