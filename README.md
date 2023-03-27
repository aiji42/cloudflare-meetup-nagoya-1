# CF Workers SwR handler

[Cloudflare Meetup Nagoya Kick Off!](https://cfm-cts.connpass.com/event/275121/) の LT で使用したソースコードです。

LTの資料のリンクをここに貼る

## Deploy

デプロイ前に下記を実行
```bash
yarn install
yarn run wrangler kv:create cache # ここで表示された id を wrangler.toml の id に記載する
yarn run wrangler kv:create cache --preview # ここで表示された id を wrangler.toml の preview_id に記載する
```

デプロイ
```bash
yarn run deploy
```

デプロイした後に、Cloudflareのウェブコンソールを開いて、「Workers Routes」から任意のルートにプロキシーとして動作するようにセットしてください。
