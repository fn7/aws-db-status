(function() {
  "use strict";
  var mysql = require("mysql");
  var Logger = require("./Logger");

  var BaseLogger = function(sql, dsn, logger) {
    this.sql = sql || "select now()";
    this.logger = logger;
    this.dsn = dsn;
  };

  BaseLogger.prototype.log = function() {
    var connection = this.createConnection(this.dsn);
    connection.query(this.sql)
      .on("result", function(row) {
        this.logger.log(row);
      }.bind(this))
      .on("error", function(err) {
        this.logger.log({error: JSON.stringify(err)});
      }.bind(this))
      .on("end", function() {
        connection.end();
        connection = null;
      });
  };
  BaseLogger.prototype.createConnection = function(dsn) {
    var connection = mysql.createConnection({
      host: dsn.host,
      port: dsn.port,
      user: dsn.user,
      password: dsn.pass,
    });
    return connection;
  };

  var callDelegateMethod = function(methodName) {
    return function() {
      this.delegate[methodName].apply(this.delegate, arguments);
    };
  };


  var FileLogger = function(sql, filename, dsn) {
    var logger = new Logger("file", filename);
    this.delegate = new BaseLogger(sql, dsn, logger);
  };
  FileLogger.prototype.createConnection = callDelegateMethod("createConnection");
  FileLogger.prototype.log = callDelegateMethod("log");

  var S3Logger = function(sql, bucketname, dsn) {
    var logger = new Logger("s3", bucketname);
    this.delegate = new BaseLogger(sql, dsn, logger);
  };
  S3Logger.prototype.createConnection = callDelegateMethod("createConnection");
  S3Logger.prototype.log = callDelegateMethod("log");

  module.exports = {
    File: FileLogger,
    S3: S3Logger,
  };
})();
