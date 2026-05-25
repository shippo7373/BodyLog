# BodyLog

nami / kaz 専用の、体重・食事・運動をゆるく記録する React + Vite アプリです。

## セットアップ

```bash
npm install
npm run netlify:dev
```

Netlify Functions と Netlify Blobs を使うため、ローカル確認は `netlify dev` 推奨です。

## デプロイ

Netlify に接続すると `netlify.toml` の設定でビルドされます。

- Build command: `npm run build`
- Publish directory: `dist`
- Functions directory: `netlify/functions`

データは Netlify Blobs の `bodylog-daily-logs` と `bodylog-exercise-master` に保存します。
