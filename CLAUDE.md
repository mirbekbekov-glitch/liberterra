# CLAUDE.md

For the verified live-platform source and CRM development, start with `platform/README.md` and `platform/AGENTS.md`. The single-file demo instructions below describe only the historical root `index.html`; they do not apply to the Worker and Apps Script source inside `platform/`.

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
