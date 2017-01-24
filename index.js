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

  var config = fe.readFileSync("./" + configJson, "utf8");
  config = JSON.parse(config);

  if (config == null) {
    console.info("config is not defined");
    process.exit(1);
  }

  console.log("ENV_STR: ", config.envStr);
  dbEndpoints(config.envStr).then(function(endpoints) {
    _.each(endpoints, function(endpoint) {
      console.log("TARGET: ", endpoint.Address);
      var filenameBase = endpoint.Address.split(".")[0];
      _.each(config.logTargets || [], function(logTarget) {
        var sql = logTarget.sql || "select now()";
        var fileOpt = logTarget.fileOpt || {
          dir: ".",
          suffix: ".log"
        };
        var filepath = fileOpt.dir + "/" + filenameBase + fileOpt.suffix;
        console.log("SQL: ", logTarget.sql);
        console.log("OUTPUT: ", filepath);
        var dsn = _.assign({
          host: endpoint.Address,
          port: endpoint.Port
        }, logTarget.dbOpt || {});
        (new (DBLogger)(logTarget.sql, filepath, dsn)).log();
      });
    });
  });
})();
