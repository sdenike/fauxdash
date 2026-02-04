# Security Vulnerabilities Report

**Date:** 2026-02-04
**Faux|Dash Version:** v0.9.17

---

## Summary

GitHub Dependabot identified 31 security alerts. **29 are fixed**, **2 are open**:

### Open Vulnerabilities (Require Action)

#### 1. 🔴 HIGH: d3-color ReDoS Vulnerability
- **Package:** d3-color
- **Current Version:** 2.0.0
- **Fixed Version:** 3.1.0+
- **Severity:** High
- **CVE:** Regular Expression Denial of Service
- **Impact:** Potentially slow down application with crafted color strings
- **Usage:** Transitive dependency via react-simple-maps and recharts
- **Status:** OPEN

**Affected Dependencies:**
```
react-simple-maps@3.0.0 → d3-zoom@2.0.0 → d3-interpolate@2.0.1 → d3-color@2.0.0
recharts@3.7.0 → victory-vendor@37.3.6 → d3-interpolate@3.0.1 → d3-color@2.0.0
```

#### 2. 🟡 MEDIUM: esbuild Development Server Vulnerability
- **Package:** esbuild
- **Current Version:** 0.18.20, 0.25.12
- **Fixed Version:** 0.24.3+
- **Severity:** Medium
- **Impact:** Development server can respond to any website requests
- **Usage:** Transitive dependency via drizzle-kit
- **Status:** OPEN
- **Risk:** Development only (not production)

**Affected Dependencies:**
```
drizzle-kit@0.31.8 → esbuild@0.25.12
drizzle-kit@0.31.8 → @esbuild-kit/core-utils@3.3.2 → esbuild@0.18.20
```

#### 3. 🔴 HIGH: @isaacs/brace-expansion Uncontrolled Resource Consumption
- **Package:** @isaacs/brace-expansion
- **Status:** AUTO-DISMISSED (likely false positive or low actual risk)
- **Action:** None required

---

## Risk Assessment

### d3-color (HIGH Priority)

**Attack Vector:**
- ReDoS (Regular Expression Denial of Service)
- Attacker provides malicious color string
- CPU-intensive regex matching causes hang

**Likelihood:** Low-Medium
- User-controlled color input via analytics/charts
- Requires specific crafted input

**Impact:** Medium
- Could slow down analytics page
- Not a data breach risk
- Temporary DoS only

**Mitigation Strategy:**
1. Update react-simple-maps to version with d3-color@3.1.0+
2. Update recharts to version with d3-color@3.1.0+
3. If no updates available, consider replacing libraries or accepting risk

### esbuild (MEDIUM Priority)

**Attack Vector:**
- Development server accepts requests from any origin
- Could leak source code or internal files

**Likelihood:** Very Low
- Only affects development environment
- Production uses built/compiled code
- Development server typically not exposed

**Impact:** Low
- Development environment only
- Source code already in repository

**Mitigation Strategy:**
1. Update drizzle-kit when new version available
2. Accept risk (dev environment only)
3. Ensure dev server not exposed to internet

---

## Recommended Actions

### Immediate (Do Now)

1. **Update d3-color transitive dependencies**
   ```bash
   # Check for updates
   npm outdated react-simple-maps recharts

   # Update if available
   npm update react-simple-maps recharts

   # If not fixed, use resolutions
   npm install --save-dev npm-force-resolutions
   ```

2. **Add package resolutions (if needed)**
   ```json
   // package.json
   {
     "resolutions": {
       "d3-color": "^3.1.0"
     }
   }
   ```

3. **Test after updates**
   ```bash
   npm install
   npm run build
   # Test analytics map functionality
   # Test charts/graphs
   ```

### Short-Term (This Week)

1. **Monitor for drizzle-kit updates**
   ```bash
   npm outdated drizzle-kit
   ```

2. **Review development environment security**
   - Ensure dev server not exposed to internet
   - Use localhost binding only
   - Consider VPN for remote development

3. **Test vulnerability patches**
   - Create test branch
   - Apply updates
   - Run full test suite
   - Check analytics and charts

### Long-Term (Consider)

1. **Alternative chart libraries**
   - Evaluate recharts alternatives
   - Consider lightweight chart solutions
   - Assess d3-color necessity

2. **Alternative map libraries**
   - Evaluate react-simple-maps alternatives
   - Consider Leaflet or Mapbox
   - Assess mapping requirements

3. **Dependency audit automation**
   - Set up automated security scanning
   - Configure Dependabot auto-merge for patches
   - Add CI/CD security checks

---

## Implementation Plan

### Phase 1: Research (1 hour)
- [ ] Check react-simple-maps releases for d3-color@3.1.0+
- [ ] Check recharts releases for d3-color@3.1.0+
- [ ] Test if manual resolution works
- [ ] Review breaking changes

### Phase 2: Update Dependencies (1-2 hours)
- [ ] Create branch: `security/update-d3-color`
- [ ] Update react-simple-maps (if available)
- [ ] Update recharts (if available)
- [ ] Add package resolutions (if needed)
- [ ] Run `npm install`
- [ ] Run `npm audit` to verify fixes

### Phase 3: Testing (1-2 hours)
- [ ] Test analytics map rendering
- [ ] Test chart displays
- [ ] Test color rendering accuracy
- [ ] Test on different themes
- [ ] Load test with many data points
- [ ] Check for console errors

### Phase 4: Deployment (30 mins)
- [ ] Commit changes
- [ ] Update CHANGELOG.md
- [ ] Create PR with security notes
- [ ] Merge to master
- [ ] Tag as v0.9.18
- [ ] Deploy and verify

---

## Manual Testing Checklist

After applying updates:

### Analytics Testing
- [ ] Load Admin → Analytics
- [ ] Verify map renders correctly
- [ ] Test with multiple locations
- [ ] Check color coding works
- [ ] Zoom in/out functionality
- [ ] Click markers for details

### Charts Testing (if using recharts)
- [ ] Load pages with charts
- [ ] Verify chart rendering
- [ ] Check color accuracy
- [ ] Test interactive features
- [ ] Verify tooltips
- [ ] Check responsive behavior

### Visual Regression
- [ ] Compare before/after screenshots
- [ ] Verify color consistency
- [ ] Check theme colors (light/dark)
- [ ] Test custom theme colors

---

## Notes

### Why d3-color@2.0.0 is Vulnerable
The ReDoS vulnerability exists in how d3-color parses color strings using regex. A specially crafted string can cause exponential backtracking, hanging the CPU.

**Example malicious input:**
```javascript
// This could cause ReDoS
d3.color("rgb(aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa)")
```

### Production vs Development Risk
- **d3-color:** Production risk (user-facing analytics)
- **esbuild:** Development only (not in production build)

### Alternative: Accept Risk?
If updates break functionality:
- d3-color risk is low (requires crafted input)
- Analytics page is admin-only
- Could add input validation instead
- Document risk acceptance

---

## Update Commands

### Check Current Versions
```bash
npm list d3-color esbuild
npm outdated
```

### Update Packages
```bash
# Try updating parent packages first
npm update react-simple-maps recharts drizzle-kit

# If not fixed, force resolution
npm install d3-color@^3.1.0
```

### Verify Fixes
```bash
npm audit
npm audit --audit-level=high
```

### Test Build
```bash
npm run build
npm run lint
```

---

## Monitoring

### Auto-Updates (Recommended)
Enable Dependabot auto-merge for:
- Patch versions (e.g., 3.1.0 → 3.1.1)
- Security updates
- Minor versions with tests passing

### Manual Review Required
- Major version updates
- Breaking changes
- Core dependencies

### CI/CD Integration
```yaml
# .github/workflows/security.yml
name: Security Audit
on: [push, pull_request]
jobs:
  audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: npm audit --audit-level=high
```

---

## Decision Log

**Date:** 2026-02-04
**Decision:** Document vulnerabilities, plan updates
**Rationale:**
- OIDC implementation was priority
- Security updates require testing
- Plan systematic approach

**Next Review:** After OIDC testing complete

---

## References

- [d3-color ReDoS CVE](https://github.com/advisories/GHSA-36jr-mh4h-2g58)
- [esbuild Security Advisory](https://github.com/evanw/esbuild/security/advisories)
- [NPM Audit Documentation](https://docs.npmjs.com/cli/v9/commands/npm-audit)
- [Dependabot Docs](https://docs.github.com/en/code-security/dependabot)

---

**Status:** Open - Requires Action
**Priority:** Medium (after OIDC testing)
**Estimated Effort:** 3-5 hours total
