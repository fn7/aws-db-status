(function() {
  'use strict';
  var mysql = require("mysql");
  var _ = require("lodash");
  var Logger = require("./Logger");

  var FileLogger = function(sql, filename, dsn) {
    this.sql = sql || "select now()";
    this.logger = new Logger(filename);
    this.dsn = dsn;
  };

  var SlackLogger = function(sql, slackOpt, dsn) {
    this.sql = sql || "select now()";
    this.slackOpt = slackOpt;
    this.dsn = dsn;
  };

  FileLogger.prototype.createConnection = SlackLogger.prototype.createConnection = function(dsn) {
    var connection = mysql.createConnection({
      host: dsn.host,
      port: dsn.port,
      user: dsn.user,
      password: dsn.pass,
    });
    return connection;
  };

  FileLogger.prototype.log = function() {
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

  module.exports = FileLogger;
})();
