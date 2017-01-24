(function() {
  "use strict";
  // TODO: プロセスに異常があればSlack通知したい
  var winston = require("winston");
  require("winston-daily-rotate-file");
  var _ = require("lodash");
  var AWS = require("aws-sdk");
  var Promise = require("bluebird");

  var formatISO8601 = function (date) {
    var offset = (function (d) {
      var o = d.getTimezoneOffset() / -60;
      return ((0 < o) ? '+' : '-') + ('00' + Math.abs(o)).substr(-2) + ':00';
    })(date);

    return [
      [
        date.getFullYear(),
        ('00' + (date.getMonth() + 1)).substr(-2),
        ('00' + date.getDate()).substr(-2)
      ].join('-'),
      'T',
      [
        date.getHours(),
        date.getMinutes(),
        date.getSeconds()
      ].join(':'),
      offset
    ].join('');
  };


  var s3Logger = function(param) { this.param = param };
  s3Logger.prototype.info = function(obj) {
    var text = JSON.stringify(obj);
    var s3 = new AWS.S3();

    var promisify = function(obj, methodName) {
      return Promise.promisify(obj[methodName].bind(obj));
    };

    var createBucketIfNotExists = function(bucketName) {
      var hasBucket = promisify(s3, "headBucket");
      var createBucket = promisify(s3, "createBucket");
      return hasBucket({
        Bucket: bucketName
      }).then(
        function() { console.log("Bucket Found: ", bucketName); /* noop */ },
        function() {
          console.log("Bucket Not Found: ", bucketName);
          console.log(err);
          process.exit(1);
          return createBucket({
            Bucket: bucketName,
            CreateBucketConfiguration: {
              LocationConstraint: "ap-northeast-1"
            }
          }).catch(function(err) {
            console.log("Create failed: ", bucketName);
            console.log(err);
            process.exit(1);
          }).then(function(err) {
            console.log("Bucket Created: ", bucketName);
          });
        }
      );
    };
    var upload = function(bucketName, data) {
      return promisify(s3, "upload")({
        Bucket: bucketName,
        ACL: "bucket-owner-full-control",
        Body: data,
        Key: formatISO8601(new Date())
      });
    }

    var param = this.param;
    createBucketIfNotExists(param.bucket).then(function() {
      console.log("Save: ", param.bucket);
      return upload(param.bucket, text);
    })
  };

  var Logger = function(type, arg1) {
    if (type === "file") {
      var filename = arg1;
      this.logger = new (winston.Logger)({
        transports: [
          new (winston.transports.DailyRotateFile)({
            filename: filename,
            datePattern: ".yyyy-MM-dd",
            json: false,
            formatter: function(opt) {
              var d = opt.meta;
              d.time = formatISO8601(new Date());
              // LTSV
              return _(d).keys().map(function(key) {
                return key + ":" + d[key]; return d[key].replace(/\n/g, " ");
              }).value().join("\t");
            }
          })
        ]
      });
    } else if (type === "s3") {
      var bucketname = arg1;
      this.logger = new s3Logger({
        bucket: bucketname
      });
    }
  };
  Logger.prototype.log = function(obj) {
    this.logger.info(obj);
  };
  module.exports = Logger;
})();
