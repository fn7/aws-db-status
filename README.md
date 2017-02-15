# aws-db-status


インストール方法
```
$ npm install -g techcross/aws-db-status

```

## 使いかた

```
$ aws-db-status -c config.json
```

## 設定


```:config.json
{
  "envStr": "hogehoge",
  "logTargets": {
    "cronSetting": "00 * * * * *",
    "logger": "File",
    "sql": "show full processlist",
    "dbOpt": {"user": "hoge", "pass": "fugafuga"},
    "fileOpt": {
      "dir": "./logs",
      "suffix": ".log"
    }
  ]
}
```

- envStr: DBのエンドポイントをフィルタリングするための文字列
- logTargets: ロギングする為の設定(複数記述可能)
  - cronSetting: cron書式で指定する実行間隔
  - logger: 保存形式
     - File: fileOpt で設定されたディレクトリに保存。日付によるローテーションを行う
     - S3: S3にuploadする
  - sql: 発行するSQL
  
  - dbOpt: DB接続に関する設定
    - user: ユーザ名
    - pass: パスワード
  
  - fileOpt: ファイル保存に関する設定
     - dir： ディレクトリ名
     - suffix： ファイル名の接尾語
  - s3Opt: S3用の設定
     - prefix： S3バケットの接頭語


