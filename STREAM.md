# STREAM

Running work log, newest first. One entry per change: timestamp · what · why · if-interrupted next step.
`HANDOFF.md`-style polished snapshots live elsewhere; this file is the play-by-play.

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

**Verification:** Repro harness at
`/private/tmp/claude-501/-Users-shelby-Development-fauxdash/ab40e662-f011-4cbb-99e1-520a5deb2fd7/scratchpad/ico-repro.cts`
drives the real exported `convertToPng()` with `Buffer.alloc` instrumented and `icojs` stubbed (it is
ESM-only and will not load under tsx's CJS transform; stubbing it also forces control flow into Method 4).
Run with `./node_modules/.bin/tsx <path>`.
- Unpatched: 7/10 pass — attack cases requested 4096 MB / 8192 MB / 12288 MB.
- Patched: 10/10 pass — attack cases rejected at 0 MB with `Invalid ICO width/height`.
- All four VALID cases report `method4=true`, so the happy path is genuinely exercised, not bypassed.
- `tsc --noEmit` clean, `npm run lint` clean.

**Scope note:** Impact is memory exhaustion only. `Buffer.alloc` zero-fills and the bounds check on
`bestEntry.offset + bestEntry.size` confines reads to the fetched buffer, so there is no information
disclosure. Reachable only behind the admin-gated favicon fetch (all 8 entry points check
`session.user.isAdmin`).

**If interrupted here:** The fix, `CHANGELOG.md` (`[Unreleased]` → Security), and this file are done.
Nothing is committed and `package.json` is still at 0.12.9 — decide whether to fold this into a 0.12.10
release commit (bump version, move the `[Unreleased]` heading to `## [0.12.10] - <date>`) or ship it as a
standalone fix commit. This repo has **no test runner at all** (no `test` script, no jest/vitest, no test
files); the harness above lives in the scratchpad and is not wired into CI. Standing up a real test setup
for the ICO parser is an open opportunity, not something this change did.
