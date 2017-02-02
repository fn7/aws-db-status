#!/usr/bin/env node
(function() {
  "use strict";
  var process = global.process;
  var console = global.console;
  var fs = require("fs");
  var _ = require("lodash");
  var CronJob = require("cron").CronJob;
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

  var config = fs.readFileSync("./" + configJson, "utf8");
  config = JSON.parse(config);

  if (config == null) {
    console.info("config is not defined");
    process.exit(1);
  }

  var executeLogging = function(envStr, logTarget) {
    console.log("logging start");
    dbEndpoints(envStr).then(function(endpoints) {
      console.log("SQL: ", logTarget.sql);
      var type = logTarget.logger;
      _.each(endpoints, function(endpoint) {
        var filenameBase = endpoint.Address.split(".")[0];
        var dsn = _.assign({
          host: endpoint.Address,
          port: endpoint.Port
        }, logTarget.dbOpt || {});
        if (type === "File") {
          var fileOpt = logTarget.fileOpt || {
            dir: ".",
            suffix: ".log"
          };
          var filepath = fileOpt.dir + "/" + filenameBase + fileOpt.suffix;
          (new (DBLogger.File)(logTarget.sql, filepath, dsn)).log();
        } else if (type === "S3"){
          var s3Opt = logTarget.s3Opt || {
            prefix: "s3Logging"
          };
          var bucketName = s3Opt.prefix + "." + filenameBase;
          (new (DBLogger.S3)(logTarget.sql, bucketName, dsn)).log();
        }
      });
    });
  };
  _.each(config.logTargets || [], function(logTarget) {
    var cronSetting = logTarget.cronSetting;
    try {
      var cronProcess = executeLogging.bind(null, config.envStr, logTarget);
      var startJobRightNow = true;
      new CronJob(cronSetting, cronProcess, startJobRightNow, "Asia/Tokyo");
    } catch(e) {
      console.log(e);
      process.exit(1);
    }
  });
})();
