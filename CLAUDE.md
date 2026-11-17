# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Liberterra — demo site for a verified real-estate marketplace in Bishkek (UI text is Russian). The whole app is a single static file, [index.html](index.html) (~800 lines: inline `<style>` then one inline `<script>`). There is no build step, package manager, linter, or test suite. To run it, open `index.html` in a browser (no server needed); only Google Fonts need the network. [README.md](README.md) (Russian) describes the product features and the demo-vs-real distinction.

## Architecture (inside the `<script>`)

Vanilla JS, string-template rendering, no framework:

- **`CONFIG`** (top of script): `rate` (som per $), `csvUrl` (published Google Sheets CSV; empty = demo data), company contacts, `commissionAgentPct`, and `today` (frozen to 2026-10-24 for the demo; use `new Date()` in production). Date logic (`daysAgo`, "Новое" badge, `confirm` action) relies on `CONFIG.today`.
- **Data**: `AGENTS`, `LISTINGS`, `REQUESTS` are fictional in-file arrays; `DISTRICTS` holds x/y percentages for the schematic map (not a real map). Prices are stored in USD (`usd`) and converted to som at render time via `money()`/`moneyTxt()` depending on `S.cur`. `loadCSV()`/`parseCSV()` replace `LISTINGS` when `csvUrl` is set (column list is in README).
- **State `S`**: role (`guest`|`agent`, toggled by a demo switch, not real auth), currency, favorites, filters `S.f`, agent-added listings `mineExtra`, extra requests `reqExtra`, application status. Persisted to `localStorage` key `lt2` via `save()` — only a subset of fields is saved; add new persisted fields in both the load line and `save()`.
- **Routing**: hash-based. `render()` parses `location.hash`, switches on the first segment to a page function (`pHome`, `pCatalog`, `pObject(id)`, `pRequests`, `pAgents`, `pMortgage`, `pCabinet(tab)`, `pAdd`), writes into `#main`, and rebuilds the `#nav` and `#tabbar`. Add a page = new `p*` function + `case` in `render()` + entry in `NAV`/tabbar if needed. `add` is gated to agents.
- **Events**: delegated, not inline handlers. Markup uses `data-a="name"` and the single document click listener dispatches to `A[name](el, event)`. Inputs use `data-f` (filters) / `data-m` (mortgage calc) handled by the `input`/`change` listeners; forms by the `submit` listener. New interactions: add a `data-a` attribute and a method on `A`.
- **Partial refresh**: filter changes call `refreshFilters()`/`refreshResults()` instead of a full `render()` to preserve input focus; use full `render()` when state affects the whole page.
- **Helpers**: always wrap user/CSV text in `esc()` when interpolating into templates; `art(l)` generates the SVG illustration (stands in for photos); `plural()` handles Russian plurals; `toast()` shows messages.

## Conventions

- Reply in Russian, briefly and without introductory phrases; keep full explanations for architecture, security and legal questions.
- Keep it a single self-contained file; don't introduce external JS dependencies or a build.
- Everything is fictional demo data and forms send nothing — keep "(демо)" wording on actions that don't really do anything.
- Role-dependent UI (agent commission badges, cabinet, "my listings" filter) branches on `isAgent()`.

## Production site (liberterra.kg)

The live platform is not built from this repo; its files live inline in Cloudflare Workers.

- `liberterra.kg/*` is routed to the Worker **`liberterra-listing-ui`**: pages and assets are string values of its `const files={...}` literal (`/agent-cabinet.html`, `/site-theme.js`, `/profile.html`, …). UI fixes go here.
- Some keys are reassigned after that literal (`files["/profile.js"]="…"`, also `/profile.html`, `/index.html`, `/login.html`, …); the last assignment is what is served. Compare a file's hash with the live URL before patching it.
- **`hidden-pine-cbff`** is only its backend (service binding `BACKEND`): `/api/*`, `/api/crm/*`, `/api/crm-workflow/*`, `/web-registration.js`. It carries a stale embedded copy of the UI that is never served on the domain — patching that copy changes nothing on the site.
- Response headers show the source: `x-liberterra-release` = listing-ui, `x-liberterra-crm-release` / `x-liberterra-crm-workflow` = backend.
- Deploy code-only changes with `PUT /workers/scripts/<name>/content` (keeps bindings), then purge the zone cache. Verify against the live URL, not the bundle.
- A page's inline scripts can have a **third copy** of the same code baked into the worker's own source, outside `const files={…}` and outside the `files["…"]=` overrides. That copy is what gets inlined into the served HTML, so patching the matching `/*.js` entry alone changes nothing. Search the whole worker body for the snippet and count every hit before editing.
- The deal board's renderer lives in the backend worker as `crmWorkflowAssets["crm-workflow.js"]` (served at `/api/crm-workflow/crm-workflow.js`), not in `const files={…}`; patch that string the same way (verify its SHA against the live URL first).
## Apps Script backend (data storage)

`/api/crm-action` in `hidden-pine-cbff` only proxies a whitelisted set of fields to `ACCOUNT_WEBHOOK_URL` — a Google Apps Script web app. Everything is stored in Google Sheets, not in Cloudflare.

- The live project is **«Проект без названия»**, bound to the **Liberterra Objects** spreadsheet (Extensions → Apps Script; the chooser also lists a stale copy, «Copy of Проект без названия», which has only 3 files and is not deployed).
- Code is split across files; `Код.gs` holds the `doPost` dispatcher, CRM and task handlers live in `crm-workflow-server.gs` (`agentTasksAction_`, `crmWorkflowAction_`, `crmWorkflowContext_`, `crmClientOwned_`).
- Bound projects are not reachable through the Drive API, so their source cannot be read from here; only standalone projects export via `files.export` with `application/vnd.google-apps.script+json`.
- Data lives in the **Liberterra Private CRM** spreadsheet: sheets `CRM Workflow` (clients/deals/selections as `record_json`), `Agent Tasks`, `Agent Private Objects`, `Agent Private Access`. `ensureHeaders_` appends missing columns, so adding a field to a `*_HEADERS` array is enough to create its column.
- `get_agent_dashboard` goes through `/api/account-action` → `handleWebAccountAction` in `hidden-pine-cbff`, and its answer is cached there for 20 s in `caches.default` under a key built from the verified `session.sub`; any other action in that handler deletes the key first, so a write invalidates the agent's own entry. Removing that block restores the old behaviour — the upstream call is the only thing it skips.
- `/exec` serves the **deployed** version: after editing, update the existing «Воронка сделок» deployment (Deploy → Manage deployments → edit → New version). A new deployment would get a different URL the Worker does not know.

- `platform/assets/site/files/` holds copies of listing-ui files changed from here (and, under `api/`, backend-served assets); `platform/public/` is older and does not match production.
