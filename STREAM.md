# STREAM

Running work log, newest first. One entry per change: timestamp · what · why · if-interrupted next step.
`HANDOFF.md`-style polished snapshots live elsewhere; this file is the play-by-play.

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

**Release mechanics:** Pushing `master` triggers `.github/workflows/docker-publish.yml`, publishing
`ghcr.io/sdenike/fauxdash:latest`. A `v*.*.*` tag would additionally publish a version-tagged image —
**no tag was created for 0.13.2** (0.12.8 and 0.12.6 also went untagged). To tag retroactively:
`git tag v0.13.2 && git push origin v0.13.2`.

**If interrupted here:** Release complete and pushed; `master` and `origin/master` level. The
`fix/ico-bmp-integer-overflow` branch is merged and can be deleted locally and on origin. Its stale
`origin` copy still points at the pre-rebase commit.

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
