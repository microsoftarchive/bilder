module.exports = (function () {

  'use strict';

  var langData = {};

  function localizationHelper () {

    var args = Array.prototype.slice.call(arguments);
    var key = args.shift();

    return langData[key] || 'STRING_NOT_FOUND_' + key;
  }

  function setLangData (data) {
    if (data) {
      langData = data;
    }
  }

  localizationHelper.setLangData = setLangData;
  return localizationHelper;

})();