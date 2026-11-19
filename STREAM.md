# STREAM

Running work log, newest first. One entry per change: timestamp · what · why · if-interrupted next step.
`HANDOFF.md`-style polished snapshots live elsewhere; this file is the play-by-play.

---

## 2026-11-19 — CVE sweep: issues #71 #72 #73, three stacked PRs (v0.14.6)

**What:** Owner asked for all open CVEs in the image to be fixed and tracked as issues + PRs. Trivy on
`latest` 0.14.5: 54 Alpine findings (OpenSSL, musl, zlib), 39 in the npm CLI bundled in the runtime image; app
deps clean (`npm audit` 0, Dependabot 0). Node 20 is EOL. Branches, stacked in this order:
`security/alpine-package-upgrade` (#71) → `security/remove-npm-from-runtime` (#72) → `security/node-24` (#73,
better-sqlite3 12, version 0.14.6). Rescan of the final image: 0 findings. Prod runs local tag
`fauxdash:security` (Node 24.22.3), health ok, backup `*-pre-node24.db`.

**If interrupted here:** merge the PRs in stack order (squash; retarget the next one to master after each).
After Actions builds `latest`, set compose `image:` back to `ghcr.io/sdenike/fauxdash:latest`, check health.
Local `node_modules/@emnapi` is root-owned (blocks `npm install`; `--package-lock-only` works).

---

## 2026-11-19 — v0.14.5 committed, PR open

**What:** Owner confirmed header colour fixed on Windows Chrome. Version 0.14.5, committed on
`fix/header-and-title-bar-color`, PR opened. Prod still runs local tag `fauxdash:header-color`.

**If interrupted here:** owner merges the PR. After GitHub Actions builds `latest`, set compose `image:` back to
`ghcr.io/sdenike/fauxdash:latest`, `docker compose up -d`, check health.

---

## 2026-11-19 — Chrome header colour fix live on prod (uncommitted)

**What:** Owner: on Windows Chrome the top header is greyer than the dark page. First guess (blurred header
layer) was wrong and is reverted. Reproduced in headless Chromium: header `#1c1819`, page `#171a1c`. Cause:
`tailwind.config.js` token helper used `color-mix(in oklch, var(--x) ..., transparent)`; the build turns tokens
into `lab()`, Chrome drops the hue of near-grey colours in oklch and takes hue 0 from `transparent`. Fix: mix in
`oklab` (also `::selection` in `globals.css`). After: header `#16191c`, page `#171a1c` (1 step, from the 75%
frosted blend). Also kept: `theme-color` now follows the page theme (`src/lib/theme-color.ts`,
`src/components/theme-color.tsx`). Branch `fix/header-and-title-bar-color`. Prod runs local tag
`fauxdash:header-color`, health ok. Backup `*-pre-header-color.db`.

**If interrupted here:** owner confirms on Windows Chrome (hard refresh). Then bump version, commit, PR, merge,
switch compose `image:` back to `ghcr.io/sdenike/fauxdash:latest`.

---

## 2026-11-16 16:30 EST — v0.14.1 polish live on prod (uncommitted)

**What:** Owner: "proceed with other optimization and fixes". Branch `fix/post-0.14-polish`: geolocation
Permissions-Policy fix, font cache headers, tap tooltips on heatmap and visitor map, targeted lint fixes, lockfile
version. Measured: signed-in start page ~105 ms warm, 21 KB gzipped HTML; JS is mostly the Next/React baseline.
Prod runs local tag `fauxdash:polish`. Deepmerge Dependabot alert #197 is a withdrawn advisory with no fix.

**If interrupted here:** owner tests, then commit, PR, merge, switch compose `image:` back to `latest`.

---

## 2026-11-16 10:05 EST — committed, PR #65 open

**What:** Commit 59f7aca on `design/bear-standardization`, pushed, PR https://github.com/sdenike/fauxdash/pull/65.
No `.env`, database or data files in the commit. Prod still runs local tag `fauxdash:bear`.

**If interrupted here:** owner merges PR #65. After GitHub Actions builds `latest`, set compose `image:` back to
`ghcr.io/sdenike/fauxdash:latest`, `docker compose up -d`, check health.

---

## 2026-11-16 09:55 EST — lone fields capped at half width

**What:** Owner: "cap lone fields at half width". Log level (General, GeoIP) and site name (Appearance) now take one
column of the two-across grid; GeoIP log legend moved to its own full-width row. Current password was already half.
Rebuilt `fauxdash:bear`, redeployed, health ok.

**If interrupted here:** owner reviews on prod. Then commit, PR, merge, switch compose `image:` back.

---

## 2026-11-16 09:40 EST — plain sections everywhere, fields two across

**What:** Owner: "Use plain sections everywhere, and fields two across." Every Card in admin, settings and analytics
is now an `AdminSection` (sections separated by `border-t`/`divide-y`); short fields sit in
`grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2`, long ones span both columns. Analytics KPI tiles became one plain
stat row. Boxes kept only for content that needs one (test results, previews, drop zones, warnings). tsc 0, palette
clean, rebuilt `fauxdash:bear`, redeployed, health ok.

**If interrupted here:** owner reviews on prod. Then commit, PR, merge, switch compose `image:` back.

---

## 2026-11-16 09:10 EST — remember-me confirmed; uniform admin width

**What:** Owner signed in again; Profile shows "1 month", so the remember choice now reaches the session token.
Profile and Settings had their own narrower content widths (max-w-2xl, max-w-3xl); removed so every admin page uses
the shell's one width. Profile cards now sit two across on large screens, with "This sign-in" as a card below.
Rebuilt `fauxdash:bear`, redeployed, health ok.

**If interrupted here:** owner keeps testing on prod. Then commit, PR, merge, switch compose `image:` back.

---

## 2026-11-16 08:45 EST — live on prod; remember-me diagnostics

**What:** Owner asked to test on production instead of the side container. DB backup
`fauxdash-2026-11-16_0836-pre-bear-deploy.db` (integrity ok). Prod compose `image:` now points at local tag
`fauxdash:bear` (Watchtower cannot pull it). Test container removed. Owner also reports "stay signed in for X" still
does not hold. Probe against prod: a minted 30-day token is refreshed with a 30-day JWT exp, so the server side works
for a token that carries `rememberDays`. Added: "Session length set" auth log line on every sign-in (with
`cookiePresent` for OIDC), a "This sign-in" section on Profile, and the login page now remembers the last choice.

**If interrupted here:** owner signs out, signs in with remember me, then check the auth log line and the Profile
page. If OIDC shows `cookiePresent:false`, the remember cookie is lost across the Pocket-ID redirect. After testing:
commit, PR, merge, switch compose `image:` back to `ghcr.io/sdenike/fauxdash:latest`.

---

## 2026-11-15 23:30 EST — iOS / touch pass (uncommitted)

**What:** Owner: "This needs better iOS mobile support." 16px fields on touch (no focus zoom), black-translucent status
bar + safe-area padding everywhere, `coarse:` and `standalone:` variants in `tailwind.config.js`,
`hoverOnlyWhenSupported`, 44px targets, tap-to-open weather/clock, drawer scroll lock, dvh, dialogs scroll, stacked
two-column forms. tsc + build ok, test container rebuilt on :8099. Not tested on a real iPhone.

**If interrupted here:** wait for owner's iPhone test. Then commit, PR.

---

## 2026-11-15 23:00 EST — Verified; test container up on :8099 (uncommitted)

**What:** `tsc` 0 errors, `next build` ok, `check-palette` clean (565 to 0), `impeccable detect src` clean,
`docker build -t fauxdash:test .` ok (Alpine). `fauxdash-test` runs on <host>:8099 with `REDIS_ENABLED=false`,
`NEXTAUTH_URL=http://<host>:8099`, data `~/Development/fauxdash-testdata`, favicons mounted read-only. Health ok;
`/admin` and `/settings` redirect correctly signed out; signed-out start page is empty because every category
requires sign-in (expected).

**If interrupted here:** wait for owner's test feedback. Then commit on the branch, PR to master. Remove the test
container with `docker rm -f fauxdash-test` when done.

---

## 2026-11-15 22:50 EST — Phases 1-6 implemented on `design/bear-standardization` (uncommitted, v0.14.0)

**What:** Bear tokens + Geist; server-rendered start page (`src/app/page.tsx`, `src/lib/server/start-page.ts`,
`src/components/start/*`); server admin guard + `AdminShell`/`AdminPage`/`ConfirmDialog`; `/settings` redirect;
Appearance reduced to theme/density/columns; dashboard rewrite; base UI restyle; dead components removed;
`scripts/check-palette.mjs`. Token sweep of settings tabs, admin pages and content/auth pages done by three Sonnet
subagents in parallel. DB backup `data/backups/fauxdash-2026-11-15_2245-pre-bear-test.db` (integrity ok); test data
copy at `~/Development/fauxdash-testdata` (never point a test container at `/docker/fauxdash/data`).

**Why:** Owner asked to proceed with all phases and be told when it can be tested.

**If interrupted here:** run tsc + `npm run build` in a `node:20` container (host node_modules is root-owned and stale:
`npm ci --legacy-peer-deps` inside the container first), `node scripts/check-palette.mjs`, then
`docker build -t fauxdash:test .` and run it on port 8099 against the test data copy. Do not merge or deploy.

---

## 2026-11-15 22:15 EST — Design critique + Bear "Red Graphite" theme file (no behaviour change)

**What:** Ran `/impeccable critique` on the start page and admin pages: 19/40. Snapshot in
`.impeccable/critique/2026-11-16T03-11-08Z__src-app.md`. Added `docs/design/bear-red-graphite.css` (light + dark
tokens copied unchanged from Wausau Billing, plus the Tailwind 3.4 `color-mix` config snippet). Nothing imports it.

**Why:** Owner wants the app standardized, clean, minimal, and on the same Bear palette as the other projects.

**Decisions (owner, 2026-11-15):** all six phases, one release each, in this order:
1. Bear theme: tokens, `tailwind.config.js`, early-paint colours, blocking theme script in `layout.tsx`.
2. No flash: `src/app/page.tsx` becomes a server component; session + settings + content read once on the server.
3. One shell: `AdminPage`, `ConfirmDialog`, one toast path, one loading/empty state, on all 7 admin pages.
4. One settings home: only `/admin/settings`; `/settings` redirects; header theme toggle writes a cookie only.
   Appearance: per-section size/spacing replaced by one Density + one Columns; gradient title removed;
   background image, graphic and logo stay.
5. Token sweep: replace the ~486 hardcoded palette classes; add a test that fails on new ones.
6. Accessibility + cleanup: aria-labels, headings, focus ring, `/` shortcut, keyboard reorder, delete
   `bookmark-manager-old.tsx`, merge the two add-forms, lucide only.

**If interrupted here:** nothing is in progress. Start phase 1 from `docs/design/bear-red-graphite.css`.

---

## 2026-07-28 09:15 EDT — Drop the unused `shadcn` devDependency

**What:** Removed `shadcn` (^3.7.0) from devDependencies. `package.json` + `package-lock.json` only.

**Why:** Traced during an `npm audit` review. It was pure install bloat — **250 lockfile packages** (1252 → 1002)
— and the sole source of the moderate `@hono/node-server` path-traversal advisory, pulled in via
`@modelcontextprotocol/sdk`. Audit goes 23 → 21 findings, moderate 3 → 1.

**Verified unused before removing:**
- No source imports the `shadcn` package. The `src/components/ui/*` files (19 of them) are its *generated
  output* and are unaffected — they import `class-variance-authority` / `tailwind-merge`, not `shadcn`.
- No npm script, Dockerfile step, or GitHub workflow invokes it.
- `.mcp.json` runs `npx shadcn@latest mcp`. The `@latest` specifier makes npx fetch from the registry and
  ignore `node_modules`, so the shadcn MCP server still works — as does `npx shadcn@latest add <component>`
  for generating new UI components. `components.json` is retained for exactly that.
- `npm run build` clean, `tsc --noEmit` clean.
- `npm run lint` reports 47 problems (41 errors, 6 warnings) — **identical with and without this change**
  (confirmed by stashing and re-running). Pre-existing, as noted in the 0.13.0 entry.

**Zero production impact:** `shadcn` was never traced into `.next/standalone`, so the shipped image is
unchanged. This is a dev-install-size and audit-noise change only.

**Also:** added a note under README "Tech Stack" recording that shadcn/ui components are generated into
`src/components/ui/` and committed, that `shadcn` is deliberately not a dependency, and that new components
come from `npx shadcn@latest add <component>` — so the retained `components.json` isn't mistaken for an
oversight and nobody re-adds the package.

**If interrupted here:** Committed and pushed to `master`. **No version bump was taken** — a devDependency
removal doesn't alter the runtime image, so it sits under CHANGELOG `[Unreleased]` to be folded into the
next release. Nothing to deploy: the running container is unaffected.

**Audit state after this change** (all dev/build-time; none reach the container — verified by inspecting the
19 packages Next traces into `.next/standalone`, which contains sharp 0.35.3 and no postcss):
- `sharp` <0.35.0 (high) — next pins `optionalDependency ^0.34.5`, so npm keeps a nested vulnerable 0.34.5
  that is NOT traced into the image. Clears when Next moves its pin.
- `postcss` <=8.5.17 (high) — nested 8.4.31 under next, build-time CSS only.
- `brace-expansion` <=5.0.7 (high, DoS) — eslint toolchain; drives ~15 cascade entries via `minimatch`.
- Do **not** run `npm audit fix --force` — it wants to install `next@9.3.3`.

---

## 2026-07-28 08:02 EDT — Release v0.13.2

**What:** Bumped `package.json` + `package-lock.json` to 0.13.2 and added the CHANGELOG `[0.13.2]` Security
entry for the ICO overflow fix below.

**Why:** Ship the security fix. Note the version path: this work was originally cut as **0.12.10** against a
stale local `master` (decb3e8 / v0.12.9). The push was rejected because `origin/master` had advanced six
commits to **v0.13.1** (remember-me fix, OIDC remember-me, dependency refresh, analytics indexes). The
0.12.10 release commit was dropped, the fix rebased onto `origin/master`, and re-cut as 0.13.2. Only
`CHANGELOG.md` conflicted; `src/lib/favicon-utils.ts` was untouched upstream and applied cleanly.

**Dependency note:** 0.13.0 bumped **sharp 0.33 → 0.35.3**, which Method 4 feeds raw pixel buffers into, so
the fix was re-verified end-to-end against 0.35.3 (not just the 0.33.5 it was originally written against).
`npm ci` alone fails on this tree — `nodemailer` 9 conflicts with `next-auth`'s `peerOptional nodemailer@^7`.
That is pre-existing and not a break: `Dockerfile:10` already runs `npm ci --legacy-peer-deps`. Use that flag
locally too.

**Release mechanics:** Both CI builds green — the `master` push published `ghcr.io/sdenike/fauxdash:latest`,
and tag `v0.13.2` published `:v0.13.2` + `:latest`.

**Deployed and verified** on the Ubuntu host at `/docker/fauxdash` via `docker compose pull` +
`down`/`up -d`. Container start log confirms `Version: 0.13.2`, build `2026-07-28T11:50:07.626Z`, Node
v20.20.2, Next.js 16.2.11; consolidated migrations and performance indexes applied cleanly; OIDC provider
(`id.denike.io`) configured.

**If interrupted here:** Done — released, deployed, verified. `master` and `origin/master` level at
`355aa32`; `fix/ico-bmp-integer-overflow` deleted local and remote.

**Open, not blocking:**
- `npm ci` fails on this tree (`nodemailer` 9 vs `next-auth`'s `peerOptional nodemailer@^7`). Pre-existing
  from the 0.13.0 dep refresh; `Dockerfile:10` already uses `--legacy-peer-deps`, so the image build is
  fine, but plain `npm ci` locally will fail for anyone on master.
- The server's compose pins `:latest`. Pinning `:v0.13.2` would make the running version explicit and
  rollback a one-line edit.
- Still no test runner in this repo; the ICO parser harness lives only in a session scratchpad.

---

## 2026-07-28 07:24 EDT — Fix integer overflow in manual ICO BMP parser

**What:** Added a dimension guard in `icoToPng()` Method 4 (`src/lib/favicon-utils.ts`, immediately after
`actualHeight` is computed and the compression check). Both `bmpWidth` and `actualHeight` must now be
positive integers `<= MAX_ICO_DIMENSION` (1024) before any row/size arithmetic runs.

**Why:** The 24bpp row-padding expression `(bmpWidth * 3 + 3) & ~3` uses a bitwise operator, which coerces
via ToInt32. A DIB header declaring `bmpWidth` in roughly `[715827882, 1431655765]` wrapped past 2^31 and
yielded a **negative** `srcRowBytes`, so `pixelDataSize` went negative and passed the
`pixelStart + pixelDataSize > imageData.length` bounds check. The following `Buffer.alloc` used the
*unwrapped* positive `dstRowBytes`, so a 70-byte `.ico` requested multi-gigabyte allocations. Surfaced by a
security review of `v0.12.7..HEAD`. 1024 is generous headroom — ICO directory entries cap a frame at 256x256.

**Verification:** Repro harness in the session scratchpad (`ico-repro-esm.mts` + `tsconfig.harness.json`,
under `.../ab40e662-f011-4cbb-99e1-520a5deb2fd7/scratchpad/`) drives the real exported `convertToPng()`
with `Buffer.alloc` instrumented to record the largest requested allocation. Run with:
`./node_modules/.bin/tsx --tsconfig <scratchpad>/tsconfig.harness.json <scratchpad>/ico-repro-esm.mts`

`icojs` is redirected to a stub via tsconfig `paths` — it depends on `file-type` v21, which publishes only
an `import` condition and so cannot be resolved by tsx's CJS side. Stubbing also forces control flow into
Method 4, the block under test. (The real webpack build resolves `file-type` fine; this is a harness-only
artifact.) Results, confirmed on **sharp 0.35.3**, the version that ships:
- Unpatched: 7/10 — attack cases requested 4096 MB / 8192 MB / 12288 MB from a 70-byte input.
- Patched: 10/10 — attack cases rejected at 0 MB with `Invalid ICO width/height`.
- All four VALID cases report `method4=true`, so the happy path is genuinely exercised, not bypassed.
- Also confirmed identically on sharp 0.33.5 (the pre-0.13.0 version) before rebasing.
- `tsc --noEmit` clean, `npm run build` clean.

**Scope note:** Impact is memory exhaustion only. `Buffer.alloc` zero-fills and the bounds check on
`bestEntry.offset + bestEntry.size` confines reads to the fetched buffer, so there is no information
disclosure. Reachable only behind the admin-gated favicon fetch (all 8 entry points check
`session.user.isAdmin`).

**If interrupted here:** Fix, `CHANGELOG.md`, and this file are done and committed. This repo has **no test
runner at all** (no `test` script, no jest/vitest, no test files); the harness above lives in the scratchpad
and is not wired into CI. Standing up a real test setup for the ICO parser is an open opportunity, not
something this change did.
