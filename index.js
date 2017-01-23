#!/usr/bin/env node
(function() {
  'use strict';
  var fs = require("fs");
  var _ = require("lodash");
  var argv = require("minimist")(process.argv.slice(2));

  var dbEndpoints = require("./src/dbEndpoints");
  var DBLogger = require("./src/DBLogger");

  var configJson = argv.c;

  if (configJson == null || configJson == "") {
    console.info("config not specified: use option -c with filename");
    process.exit(1);
  }
  if (!fs.existsSync(configJson)) {
    console.info("config not found: " + configJson);
    process.exit(1);
  }

  var config = require("./" + configJson);
  if (config == null) {
    console.info("config is not defined");
    process.exit(1);
  }

  console.log("ENV_STR: ", config.envStr);
  dbEndpoints(config.envStr).then(function(endpoints) {
    _.each(endpoints, function(endpoint) {
      console.log("TARGET: ", endpoint.Address);
      var filenameBase = endpoint.Address.split(".")[0];
      _.each(config.logTargets, function(logTarget) {
        console.log("SQL: ", logTarget.sql);
        var filepath = logTarget.fileOpt.dir + "/" + filenameBase + logTarget.fileOpt.suffix;
        var dsn = _.assign({
          host: endpoint.Address,
          port: endpoint.Port
        }, logTarget.dbOpt);
        (new (DBLogger)(logTarget.sql, filepath, dsn)).log();
      });
    });
  });
})();
