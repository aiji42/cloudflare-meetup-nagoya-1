# CF Workers SwR handler

[Cloudflare Meetup Nagoya Kick Off!](https://cfm-cts.connpass.com/event/275121/) の LT で使用したソースコードです。

LTの資料は[こちら](https://speakerdeck.com/aiji42/cloudflare-workerstokvde-kiyatusiyuwofei-tong-qi-nigeng-xin-suru-cloudflare-meetup-nagoya)

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

またオリジンは、`Cache-Control: public, max-age=x, stale-while-revalidate=x` (xは任意の秒数) をレスポンスヘッダーに含めるようにしてください。
