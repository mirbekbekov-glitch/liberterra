# Liberterra site and Telegram bot

Source snapshot for the Liberterra website (`liberterra.kg`) and `@Liberterra_kg_bot`.

- `guide/`: public website assets and frontend code. Uploaded listing photos are excluded.
- `worker.js`, `wrangler.toml`: Cloudflare Worker source and configuration.
- `bot.py`, `handlers/`, `utils/`, `texts.py`: Telegram bot source.
- `google_sheets_webhook.gs`, `viewing-server.gs`: Apps Script source.
- `migrations/`, `server/`, `scripts/`, `tests/`: related source and checks.

This is a local source snapshot, not a guarantee that every file matches the currently deployed Cloudflare or Apps Script version. Runtime data, backups, tokens and local evidence are intentionally excluded. Configure credentials through environment variables and Cloudflare bindings; do not commit them.


