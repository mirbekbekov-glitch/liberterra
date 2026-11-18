# Working platform source

This directory contains the verified production-source baseline for Liberterra, captured on 2026-10-27. The repository-root index.html is an older static demo and is not the platform entrypoint. The root single-file demo constraints do not apply inside platform/.

- Read README.md and provenance.json before modifying platform code. Preserve the captured manifest as the initial comparison point; distinguish subsequent development changes from production bytes.
- Captured templates: workers/backend.mjs and workers/site.mjs. Keep these immutable. Edit extracted resources in assets/, additive features in features/, and Apps Script sources. Run scripts/build.cjs to generate dist/workers/*.mjs. Read DEVELOPMENT.md for the build and isolated sandbox.
- Apps Script: apps-script/ contains all seven files from deployed version 68. Keep global cross-file functions and dispatch compatible. CRM records use the existing private Sheets book.
- public/ is an HTTP-verified reference of served static files, including api/crm-workflow/. Changes there alone do not update embedded Worker assets. Establish and test a reproducible asset rebuild before a UI release.
- Do not deploy, merge to main, modify live data or add credentials as part of ordinary development. Production mutations require the user's explicit authorization. Never publish private document contents, account data or secrets.
- All CRM writes need server-side identity, role and ownership checks. Public responses must use an explicit field projection. Preserve idempotency, locking and version checks.
- Use existing Liberterra skills for CRM, authorization and UI work. Test logic using synthetic fixtures and a separate environment. Do not run the exported production bundles against live APIs during local development.
- No default deploy command or production credential configuration is supplied. Record required bindings by name, never by secret value.
- Validate source with `node platform/scripts/verify-source.cjs`; use `--baseline` only to verify the unmodified capture. Run `node --test platform/tests/*.test.cjs`. Local preview: `node platform/dev/server.cjs`; it uses synthetic identity and disk Sheets fixtures, never production APIs.

## Deploying

Several sessions edit these Workers at the same time. On 2026-11-18 a deploy built from an eight-minute-old base silently removed the telephony block another session had shipped in between; the incident, with the version table, is in DEVELOPMENT.md. These rules come from that day.

- **The user authorizes every deploy, in their own words, in the session that deploys.** Another session relaying "the user approved" is not authorization. Say what you are about to PUT before you PUT it.
- **One session deploys a Worker at a time.** Announce the target before starting and say when you release it. If another session holds it, wait.
- **The base is the live file, read by site URL, immediately before PUT** — not the captured template, not a base read earlier in the session, and not `GET /workers/scripts/<name>`, which returns the last *uploaded* version. Upload and deployment usually coincide, so the two agree most of the time; they diverge once a version other than the newest upload is deployed — after a rollback through the deployments API, for instance, as on 2026-11-18 between 18:33 and 18:41. Read the site URL and you are never wrong.
- **Whoever deploys, builds.** A build handed over by another session is already stale; rebuild on the base you just read.
- **Compare lengths and content, not feature markers.** Markers survive both versions and hide what a stale base drops. Diff the built value against the live file and look at what is missing, not only at what is new.
- **After PUT, read the same URL again and verify.** For CSS the only proof is computed style on the live page: pages apply inline `criticalStyles` copies while the linked files are `media="print"`.
- **Rolling back means deploying the version that was live, which is not necessarily your previous upload.** Read the Worker's version history first; another session may have deployed in between.
- **`features.json` is only for features that are not already inside the served value.** A feature shipped straight into the Worker is in the snapshot too, and appending it again duplicates it. `build.cjs` refuses the build in that case.
- **A change the repository cannot express does not get deployed from the repository.** For a key served from a post-map assignment or an embedded bundle copy, fix the source of that copy; if it lives in a frozen template, say so instead of shipping a build that reverts it.
