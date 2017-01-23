(function() {
  "use strict";
  var winston = require("winston");
  var _ = require("lodash");

  var Logger = function(filename) {
    this.logger = new (winston.Logger)({
      transports: [
        new (winston.transports.File)({
          filename: filename,
          json: false,
          formatter: function(opt) {
            var d = opt.meta;
            d.time = (new Date()).toLocaleString();
            // LTSV
            return _(d).keys().map(function(key) {
              return key + ":" + d[key]; return d[key].replace(/\n/g, " ");
            }).value().join("\t");
          }
        })
      ] 
    });
  };
  Logger.prototype.log = function(obj) {
    this.logger.info(obj);
  };
  module.exports = Logger;
})();
