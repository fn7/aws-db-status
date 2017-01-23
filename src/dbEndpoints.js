module.exports = function(keyStr) {
  "use strict";
  var AWS = require("aws-sdk");
  var _ = require("lodash");
  var Promise = require("bluebird");
  var rds = new AWS.RDS({region: "ap-northeast-1"}); // 動的にならないの?

  var keyRegExp = new RegExp('^' + (keyStr || ''));

  return Promise.promisify(rds.describeDBInstances.bind(rds))({}).then(function(result) {
    return _(result.DBInstances).filter(function(dbInstance) {
      return dbInstance.DBInstanceStatus == "available";
    }).filter(function(dbInstance) {
      return keyRegExp.test(dbInstance.DBInstanceIdentifier);
    }).map(function(dbInstance) {
      return dbInstance.Endpoint;
    }).value();
  });
}
