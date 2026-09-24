# Niciumma4

Cloudflare Workers + Discord Interactions bot for browsing Scratch project data.

## Current commands

- `/niciumma <スプライト名> <関数名>`
- `/niciumma ls <リスト名>`

Code is shown with line numbers and Scratch-style tree indentation.
20 lines are displayed per page. Only the user who invoked the command can use the pagination buttons.

## Secrets

Never commit Discord credentials.

```bash
npx wrangler secret put DISCORD_PUBLIC_KEY
npx wrangler secret put DISCORD_TOKEN
```

For local development use `.dev.vars`, which is ignored by Git.

## Data

`data/project.json` is a starter format. The next step is to make `tools/sb3-convert.mjs` parse a real `.sb3` and generate the `niciumma.functions` index.
