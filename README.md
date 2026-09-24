# Niciumma4

Scratch の `project.json` を GitHub に置き、Cloudflare Workers 上の Discord Bot から検索するボットです。

## 主な機能

- `/niciumma [スプライト] [関数]`
- `/niciumma ls [リスト名]`
- Scratch の通常の `project.json` を直接使用
- カスタムブロック（プロシージャ）を関数名として検索
- `main` / `start` は緑の旗スクリプトとして扱う
- 20行ごとのページング
- 行番号はページをまたいで連番
- ページ送りはコマンド実行者だけ操作可能
- Scratch の日本語ブロック名を表示
- Discord Bot Token / Public Key は Cloudflare Secret に保存

## scratch4js

開発用の `.sb3` 検査・変換ツールに `scratch4js` 1.2.x を使用しています。
`scratch4js` は `.sb3` の読み書きライブラリで、内部の `blocks` も直接参照できます。

```bash
npm install
npm run inspect:sb3 -- ./game.sb3
npm run convert:sb3 -- ./game.sb3 ./data/project.json
```

`convert:sb3` で作った `project.json` を GitHub の `data/project.json` としてコミットしてください。

## Cloudflare

`wrangler.jsonc` の `DATA_BASE_URL` を自分の GitHub raw URL に変更。

例:

`https://raw.githubusercontent.com/USERNAME/Niciumma4/main/data/project.json`

Secrets:

```bash
npx wrangler secret put DISCORD_PUBLIC_KEY
npx wrangler secret put DISCORD_TOKEN
```

## Discord

Application の Interactions Endpoint URL を Worker の URL に設定します。

コマンド登録:

```bash
DISCORD_TOKEN="..." \
DISCORD_APPLICATION_ID="..." \
DISCORD_GUILD_ID="..." \
npm run register
```

`DISCORD_GUILD_ID` を省略するとグローバルコマンドとして登録します。

## 注意

`data/project.json` は普通の Scratch 3 project.json です。
Niciumma4 独自の `niciumma.functions` フィールドは不要です。

現時点では主要な標準ブロックを日本語化しています。
未対応の opcode は opcode 名をそのまま表示するため、対応表を `src/index.js` の `OPCODES` に追加できます。
