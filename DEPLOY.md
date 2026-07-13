# デプロイ手順 (Vercel + Turso, 無課金)

ホスティングは Vercel(Hobbyプラン、無料・クレカ不要)、DBは Turso(libSQL、
SQLite互換、無料枠・クレカ不要)。どちらも個人の無料利用ポリシー範囲内で、
2人だけのプロトタイプ用途なら十分。

`src/lib/db.ts` の libSQL アダプタはローカルの `file:` URLでもTursoの
`libsql://` URLでも同じ設定形で動くため、schema.prisma やアプリコードは
環境変数を差し替えるだけで本番に対応できる。

スキーマは今後も変更していく前提で、`vercel-build`(package.json)が
`prisma migrate deploy && next build` になっており、デプロイのたびに
未適用のマイグレーションが自動でTursoに反映されてからビルドされる。

## 初回セットアップ

Turso の公式CLIはWindows向けバイナリが配布されていないため、CLIではなく
Webダッシュボードでアカウント作成・DB作成・トークン発行を行う
(WSLがあればCLIも使えるが、ここではダッシュボードのみで完結させる)。

```
1. https://app.turso.tech で無料サインアップ (クレカ不要)
2. 「Create Database」でDB作成 (名前: benkyousagi、リージョンは Tokyo/nrt を選択)
3. DBの詳細画面で以下を控える:
   - Database URL (libsql://... 形式)               → DATABASE_URL
   - 「Create Token」で発行したトークン              → DATABASE_AUTH_TOKEN
```

```bash
# 1. 既存のマイグレーションを一度ローカルから当てて、2アカウントをseedする
DATABASE_URL="上で取得したlibsql://..." \
DATABASE_AUTH_TOKEN="上で取得したトークン" \
npx prisma migrate deploy

DATABASE_URL="同上" DATABASE_AUTH_TOKEN="同上" \
SEED_USER1_NAME="任意" SEED_USER1_PIN="任意の6桁" \
SEED_USER2_NAME="任意" SEED_USER2_PIN="任意の6桁" \
npm run db:seed

# 2. Vercel CLI のインストール・ログイン (無料、クレカ不要 / GitHub連携なしでもOK)
npm i -g vercel
vercel login
vercel link   # プロジェクトディレクトリで初回のみ

# 3. 環境変数を登録 (Production環境)
vercel env add DATABASE_URL production
vercel env add DATABASE_AUTH_TOKEN production
vercel env add SESSION_SECRET production   # openssl rand -base64 32 で生成した値

# 4. デプロイ
vercel --prod
```

GitHubリポジトリと連携すれば `git push` だけで自動デプロイになる
(Vercelダッシュボードの「Import Git Repository」から連携、またはリモート追加後
`vercel git connect`)。今は未連携でも `vercel --prod` で直接デプロイできる。

## 以後のスキーマ変更フロー

```bash
npm run db:migrate   # ローカルでマイグレーションファイル生成 (ローカルのfile: DBに対して)
git add prisma/migrations && git commit -m "..."
vercel --prod          # ビルド時に migrate deploy が自動でTursoに当たる
```

## 制限・注意点

- Turso無料枠には月間の行読み書き数・DB容量の上限がある。2人の個人利用なら
  通常は十分だが、上限に近づいたらTursoダッシュボードで確認する。
- Vercel Hobbyプランは個人・非商用利用が前提。関数実行時間などの上限もあるが
  この規模のアプリなら問題にならない想定。
- サーバーレスのため常駐プロセスはない。初回アクセス時にコールドスタートで
  数百ms〜数秒の遅延が出ることがあるが、2人用途では許容範囲のはず。
