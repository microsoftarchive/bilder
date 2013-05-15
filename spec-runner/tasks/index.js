module.exports = function (grunt) {

  'use strict';

  var path = require('path');
  var jsdom = require('jsdom');
  var jquery = require('jquery');
  var chai = require('chai');
  var sinon = require('sinon');
  var Mocha = require('mocha');
  var requirejs = require('requirejs');

  var define = requirejs.define;
  var _ = grunt.util._;
  var glob = grunt.file.glob;

  var isTravis = (process.env.TRAVIS === 'true');

  // Dummies/Mocks for require.js to work
  function noop() { return {}; }
  function fakeLoader(a, b, load) { load(noop); }

  // patch the context with some globals & stuff
  function patchMochaContext (mocha) {

    mocha.suite.on('pre-require', function(context) {

      // use a fresh new dom for every test
      var win = jsdom.jsdom().createWindow('<!doctype html><body/>');
      win.navigator = context.navigator = {
        'userAgent': 'Wunderlist Test Runner',
        'appVersion': '1.0.0'
      };

      var $ = jquery.create(win);

      // enhance chai's flavour
      chai.use(require('sinon-chai'));

      // Attach globals to all the contexts
      function fixContext(ctx) {

        // Augment BOM
        ctx.window = win;
        ctx.document = win.document;

        ctx.$ = ctx.window.$ = $;

        // make "requirejs" a global in specs running in nodejs
        ctx.requirejs = ctx.require = requirejs;

        // make chai functions available
        ctx.should = chai.should();
        ctx.expect = chai.expect;

        // make sinon available
        ctx.sinon = sinon;

        // manually load sinon's fake xhr module
        // TODO: is this really the best way to load it?
        require('sinon/lib/sinon/util/fake_xml_http_request');

        // make requirejs methods available
        ctx.define = define;

        // Let specs use underscore
        ctx._ = _;

        // Specs are in nodejs
        ctx.isNode = true;

        // Specs are on travis
        ctx.isTravis = isTravis;

      }

      // fix the main suite context first
      fixContext(context);

      // also make all this stuff available on beforeEach of these suites
      mocha.suite.on('suite', function(suite) {
        suite.on('beforeEach', function(hook) {
          fixContext(hook.ctx);
        });
      });
    });
  }

  grunt.registerTask('specs/mocha', 'Node based spec-runner for mocha', function () {

    var options = this.options({
      'base': 'public',
      'glob': '**/*.spec.js',
      'ui': 'bdd',
      'reporter': 'spec',
      'globals': ['_', '$'],
      'mocks': {},
      'fake_plugins': [],
      'fake_modules': []
    });

    // Stub requirejs plugins
    options.fake_plugins.forEach(function (pluginName) {
      define(pluginName, { 'load': fakeLoader });
    });

    // Fake some requirejs modules
    options.fake_modules.forEach(function (pluginName) {
      define(pluginName, noop);
    });

    // Async task here
    var done = this.async();

    // Create a new spec-runner
    var mocha = new Mocha();

    // Allow certain globals in mocha
    mocha.globals(options.globals);

    // Run Mocha as BDD
    mocha.ui(options.ui);
    mocha.reporter(options.reporter);

    // Make mock paths absolute
    var mockPaths = options.mocks;
    Object.keys(mockPaths).forEach(function(name) {
      mockPaths[name] = path.join(__dirname, '..', mockPaths[name]);
    });

    // find modules in the app folder
    requirejs.config({
      'baseUrl': path.resolve(options.base),
      'paths': mockPaths
    });

    // Path the context
    patchMochaContext(mocha);

    // populate files
    var globRule = path.join(options.base, options.glob);
    mocha.files = glob.sync(globRule);

    // Run it
    mocha.run(function (count) {
      if(count) {
        grunt.fatal(count + ' failures.');
      } else {
        done();
      }
    });

  });
};
