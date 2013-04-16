module.exports = function(grunt, options) {

  'use strict';

  var fs = require('fs');
  var path = require('path');
  var util = require('util');

  var taskName = 'compile/languages';
  var suffixRegExp = /\/Localizable\.strings$/;
  var lineParsingRegExp = /^\s*\"([a-zA-Z0-9_\-\$]+)\"\s*=\s*\"(.*)\";\s*$/;
  var template = "define(function() {\nreturn {\n'name': '%s',\n'data': %s\n};\n});";

  function name (file, options) {
    var prefixRegexp = new RegExp('^' + options.src + '/');
    var langCode = file.replace(prefixRegexp, '').replace(suffixRegExp, '');
    if(options.languages[langCode].alias) {
      langCode = options.languages[langCode].alias;
    }
    return options.languages[langCode].file;
  }

  function compile (rawLanguageData, options, callback) {

    var json = {};
    rawLanguageData.split(/[\r\n]+/).forEach(function(line) {

      var sections = line.match(lineParsingRegExp);
      if (sections && sections.length >= 2 && !sections[1].match(/\s/)) {

        var key = sections[1];
        if (!(options.labels[key])) { // TODO: how to handle momentjs ?? && !key.match(/^momentjs_/)) {
          return;
        }

        var value = sections[2];
        value = value.replace(/%(([0-9]+)\$)?@/g, function(x, y, num) {
          return '$' + (num || '');
        }).replace(/\\\"/g, '"');

        json[key] = value;
      }
    });

    callback(null, JSON.stringify(json));
  }

  function compileAvailable(err, languages, options, done) {

    var prefixRegexp = new RegExp('^' + options.src + '/');
    var available = {};

    // Generate a map of available & enabled languages
    languages.forEach(function(lang) {

      var langCode = lang.file.replace(prefixRegexp, '').replace(suffixRegExp, '');
      lang = options.languages[langCode];

      // map aliases
      if(lang.alias) {
        lang = options.languages[lang.alias];
      }

      // Skip disabled languages
      if(!lang.enabled) {
        return;
      }

      available[langCode] = {
        "file": lang.file,
        "name": lang.name
      };

      // Add directiorn info for rtl languages
      if(lang.dir) {
        available[langCode].dir = lang.dir;
      }
    });

    // Copy over all the enabled aliases
    var _ = grunt.util._;
    _.each(options.languages, function(lang, code) {
      if(lang.alias && lang.alias in available) {
        available[code] = {
          'alias': lang.alias
        };
      }
    });

    var destFilePath = path.join(options.destPath, 'available.js');
    var module = util.format(template, 'available', JSON.stringify(available));
    fs.writeFile(destFilePath, module, done);
  }

  var BaseCompileTask = require('./base');
  function LanguageCompileTask() {
    BaseCompileTask.call(this, grunt, {
      'name': name,
      'template': template,
      'compile': compile,
      'options': {
        'src': 'public/languages/strings',
        'dest': 'build/languages',
        'labels': {},
        'languages': {}
      }
    }, compileAvailable);
  }

  grunt.registerMultiTask(taskName, 'Compile localization data as AMD modules', LanguageCompileTask);
};