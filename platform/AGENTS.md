# Working platform source

This directory contains the verified production-source baseline for Liberterra, captured on 2026-10-27. The repository-root index.html is an older static demo and is not the platform entrypoint. The root single-file demo constraints do not apply inside platform/.

- Read README.md and provenance.json before modifying platform code. Preserve the captured manifest as the initial comparison point; distinguish subsequent development changes from production bytes.
- Backend: workers/backend.mjs. Public frontend Worker: workers/site.mjs. Both are actual deployed bundles, including embedded assets; they are not identical to the older local worker.js.
- Apps Script: apps-script/ contains all seven files from deployed version 68. Keep global cross-file functions and dispatch compatible. CRM records use the existing private Sheets book.
- public/ is an HTTP-verified reference of served static files, including api/crm-workflow/. Changes there alone do not update embedded Worker assets. Establish and test a reproducible asset rebuild before a UI release.
- Do not deploy, merge to main, modify live data or add credentials as part of ordinary development. Production mutations require the user's explicit authorization. Never publish private document contents, account data or secrets.
- All CRM writes need server-side identity, role and ownership checks. Public responses must use an explicit field projection. Preserve idempotency, locking and version checks.
- Use existing Liberterra skills for CRM, authorization and UI work. Test logic using synthetic fixtures and a separate environment. Do not run the exported production bundles against live APIs during local development.
- No default deploy command or production credential configuration is supplied. Record required bindings by name, never by secret value.
- Validate source with `node platform/scripts/verify-source.cjs`; use `--baseline` only to verify the unmodified capture. Run `node platform/tests/crm-workflow.test.cjs` and `node platform/tests/crm-gateway.test.cjs` for relevant changes.
