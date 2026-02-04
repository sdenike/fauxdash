# OIDC Setup & Testing Guide

**Quick guide for setting up OpenID Connect (OIDC) authentication in Faux|Dash**

---

## Prerequisites

Before you begin:
- ✅ Faux|Dash v0.9.16+ deployed
- ✅ OIDC provider configured (Authentik, Keycloak, PocketID, Okta, etc.)
- ✅ Admin access to Faux|Dash
- ✅ HTTPS enabled (required for production OIDC)

---

## Part 1: Configure Your OIDC Provider

### Example: PocketID

1. **Login to PocketID Admin Panel**
   - Navigate to your PocketID instance (e.g., `https://id.denike.io`)

2. **Create OAuth2/OIDC Application**
   - Go to Applications → Create New
   - Choose OAuth2/OIDC Application type
   - Set application name (e.g., "Faux|Dash")

3. **Configure Application Settings**
   - **Redirect URI:** `https://your-domain.com/api/auth/callback/oidc`
     - ⚠️ Must be HTTPS in production
     - ⚠️ Path must be exactly `/api/auth/callback/oidc`
     - Example: `https://startpage.denike.io/api/auth/callback/oidc`
   - **Grant Types:** Authorization Code
   - **Scopes:** `openid`, `email`, `profile` (required)

4. **Save and Note Credentials**
   - Copy **Client ID** (e.g., `abc123xyz789`)
   - Copy **Client Secret** (e.g., `secret_abc123xyz789...`)
   - Note **Issuer URL** (e.g., `https://id.denike.io/`)
     - ⚠️ Must end with trailing slash `/`

### Example: Authentik

1. **Create Provider**
   - Applications → Providers → Create
   - Choose OAuth2/OpenID Provider
   - Name: "Faux|Dash"

2. **Configure Provider**
   - **Client Type:** Confidential
   - **Client ID:** (auto-generated or custom)
   - **Client Secret:** (auto-generated)
   - **Redirect URIs:** `https://your-domain.com/api/auth/callback/oidc`
   - **Signing Key:** Choose auto-generated certificate
   - **Scopes:** `openid`, `email`, `profile`

3. **Create Application**
   - Applications → Create
   - Name: "Faux|Dash"
   - Slug: `fauxdash`
   - Provider: Select the provider you just created

4. **Note Configuration**
   - **Issuer URL:** `https://your-authentik.com/application/o/fauxdash/`
     - ⚠️ Must end with trailing slash

### Example: Keycloak

1. **Create Client**
   - Clients → Create Client
   - **Client ID:** `fauxdash`
   - **Client Protocol:** openid-connect
   - Save

2. **Configure Client Settings**
   - **Access Type:** confidential
   - **Valid Redirect URIs:** `https://your-domain.com/api/auth/callback/oidc`
   - **Web Origins:** `https://your-domain.com`
   - Save

3. **Get Credentials**
   - Go to Credentials tab
   - Copy **Client Secret**

4. **Note Issuer URL**
   - **Format:** `https://your-keycloak.com/realms/{realm-name}/`
   - Example: `https://auth.example.com/realms/master/`
   - ⚠️ Must end with trailing slash

---

## Part 2: Configure Faux|Dash

### Step 1: Access Admin Settings

1. Login to Faux|Dash as admin
2. Navigate to **Admin → Settings**
3. Click **Auth** tab

### Step 2: Enter OIDC Configuration

Fill in these fields:

| Field | Description | Example |
|-------|-------------|---------|
| **Enable OIDC** | Toggle ON to enable | ✅ Enabled |
| **Provider Name** | Display name for login button | "PocketID" or "Company SSO" |
| **Client ID** | From your OIDC provider | `abc123xyz789` |
| **Client Secret** | From your OIDC provider | `secret_abc123...` (masked) |
| **Issuer URL** | OIDC issuer URL with trailing `/` | `https://id.denike.io/` |

⚠️ **Important Notes:**
- Issuer URL **must** end with trailing slash `/`
- Client Secret is masked for security
- Leave secret blank to keep existing value when updating

### Step 3: Test Configuration

1. Click **"Test Configuration"** button
2. Wait for validation to complete
3. Check results:

   ✅ **Success:** Shows callback URL and provider details
   ```
   ✅ OIDC configuration is valid and ready to use

   Callback URL to configure:
   https://startpage.denike.io/api/auth/callback/oidc
   ```

   ❌ **Failure:** Shows specific error
   ```
   ❌ Failed to connect to OIDC provider: Connection refused
   Failed at stage: connection
   ```

4. **If test fails:**
   - Verify issuer URL is correct and ends with `/`
   - Check provider is accessible from Faux|Dash server
   - Verify client ID is correct
   - Check provider logs for errors

### Step 4: Save Settings

1. Click **"Save"** button
2. Settings reload automatically (no restart needed!)
3. Check Docker logs to verify:
   ```bash
   docker logs fauxdash | grep OIDC
   ```

   Should see:
   ```
   OIDC settings changed, reloading provider...
   OIDC provider reloaded successfully
   ```

---

## Part 3: Test Authentication Flow

### Using the Test Button (Recommended)

1. After saving settings, click **"Test Authentication Flow"** button
2. Popup window opens
3. You're redirected to your OIDC provider
4. Login with your OIDC credentials
5. Redirected back to test result page
6. Success message shows:
   ```
   ✅ Authentication Successful!
   Successfully authenticated with OIDC.
   user@example.com
   This window will close automatically...
   ```
7. Admin panel shows confirmation:
   ```
   ✅ Authentication test passed!
   Successfully authenticated as: user@example.com
   ```

### Manual Testing (Alternative)

1. Open new incognito/private browser window
2. Navigate to your Faux|Dash login page
3. Click **"Sign in with [Provider Name]"** button
4. Redirected to OIDC provider
5. Login with credentials
6. Redirected back to Faux|Dash
7. Should be logged in successfully

---

## Part 4: Enable for Production Use

### Optional: OIDC-Only Mode

If you want to **disable password login** and only allow OIDC:

1. In Auth settings, scroll to **"OIDC-Only Mode"**
2. Toggle **"Disable password login"** to ON
3. ⚠️ **Warning:** Make sure OIDC works first!
4. Click **"Save"**
5. Password login will be hidden on login page

---

## Troubleshooting

### Issue 1: "Client id or secret not provided"

**Symptoms:**
- Error in Docker logs: `[next-auth][error][OAUTH_CALLBACK_ERROR] Client id or secret not provided`
- Can't authenticate with OIDC

**Solution:**
```bash
# Check if settings are loaded
docker logs fauxdash | grep "OIDC provider"

# Should show:
# OIDC provider configuration: {
#   enabled: true,
#   clientId: 'abc12345...',
#   clientSecret: '***SET***'
# }

# If shows 'MISSING', settings not saved correctly
# With v0.9.16+: Just save settings again (no restart!)
# Before v0.9.16: Restart container
```

### Issue 2: "Invalid callback URL"

**Symptoms:**
- Redirect fails after OIDC provider login
- Provider shows "Invalid redirect URI" error

**Solution:**
1. Copy exact callback URL from test result
2. Must be: `https://your-domain.com/api/auth/callback/oidc`
3. Must use HTTPS (not HTTP) in production
4. Path must be exact: `/api/auth/callback/oidc`
5. Add to provider's allowed redirect URIs
6. Check for typos (trailing slashes, http vs https)

### Issue 3: "Failed to connect to OIDC provider"

**Symptoms:**
- Test configuration fails with connection error
- Error: "Failed to connect to OIDC provider: ETIMEDOUT"

**Solution:**
1. Verify issuer URL is accessible from Faux|Dash server
2. Test well-known endpoint manually:
   ```bash
   curl https://your-provider.com/.well-known/openid-configuration
   ```
3. Should return JSON with endpoints
4. Check firewall rules
5. Verify DNS resolution

### Issue 4: "Issuer mismatch"

**Symptoms:**
- Test fails with "Issuer mismatch" error
- Shows: `configured "https://provider.com/" but provider reports "https://provider.com"`

**Solution:**
1. Check provider's well-known config:
   ```bash
   curl https://provider.com/.well-known/openid-configuration | jq .issuer
   ```
2. Copy exact issuer URL from response
3. Update Faux|Dash issuer URL to match exactly
4. Some providers report without trailing slash
5. Try both with and without trailing slash

### Issue 5: "OIDC test passed but login fails"

**Symptoms:**
- Test configuration succeeds
- Test authentication fails or redirects to login

**Solution:**
1. Check callback URL is correct in provider settings
2. Verify scopes include `openid`, `email`, `profile`
3. Check Docker logs for detailed error:
   ```bash
   docker logs fauxdash --tail 100 | grep -A 5 "OIDC"
   ```
4. Ensure provider allows the configured client ID
5. Verify client secret is correct

### Issue 6: "Session expires immediately"

**Symptoms:**
- Login succeeds but immediately redirects back to login
- Shows green check then redirects

**Solution:**
- Update to v0.9.14+ (fixes session expiration)
- Check JWT token expiration in logs
- Verify NEXTAUTH_SECRET is set

---

## Provider-Specific Notes

### PocketID
- **Issuer URL Format:** `https://id.denike.io/`
- **Callback URL:** Standard `/api/auth/callback/oidc`
- **Scopes:** `openid email profile`
- **Notes:** Very straightforward, works out of the box

### Authentik
- **Issuer URL Format:** `https://authentik.com/application/o/{slug}/`
- **Callback URL:** Standard `/api/auth/callback/oidc`
- **Scopes:** `openid email profile`
- **Notes:** Create both Provider and Application

### Keycloak
- **Issuer URL Format:** `https://keycloak.com/realms/{realm-name}/`
- **Callback URL:** Standard `/api/auth/callback/oidc`
- **Scopes:** `openid email profile` (default mappers)
- **Notes:** Set Access Type to "confidential"

### Okta
- **Issuer URL Format:** `https://{your-okta-domain}/oauth2/default/`
- **Callback URL:** Standard `/api/auth/callback/oidc`
- **Scopes:** `openid email profile`
- **Notes:** Use Authorization Server ID in issuer URL

### Azure AD
- **Issuer URL Format:** `https://login.microsoftonline.com/{tenant-id}/v2.0/`
- **Callback URL:** Standard `/api/auth/callback/oidc`
- **Scopes:** `openid email profile`
- **Notes:** Create App Registration, add redirect URI

---

## Security Best Practices

### Required
- ✅ Use HTTPS in production (required for OIDC)
- ✅ Keep client secret secure (never commit to git)
- ✅ Use strong NEXTAUTH_SECRET (32+ characters)
- ✅ Verify callback URL matches exactly

### Recommended
- ✅ Enable PKCE (enabled by default in Faux|Dash)
- ✅ Use state parameter (enabled by default)
- ✅ Review provider security settings
- ✅ Monitor authentication logs
- ✅ Test OIDC-only mode before enforcing
- ✅ Keep backup admin password access (don't lock yourself out!)

### Optional Hardening
- ✅ Restrict provider to specific user groups
- ✅ Enable MFA at provider level
- ✅ Set short session timeouts
- ✅ Use IP allowlists if applicable
- ✅ Monitor for suspicious login attempts

---

## Configuration Examples

### Example 1: PocketID Setup

**Provider Settings (PocketID):**
```
Application Name: Faux|Dash
Redirect URI: https://startpage.denike.io/api/auth/callback/oidc
Grant Types: Authorization Code
Scopes: openid, email, profile
```

**Faux|Dash Settings:**
```
Enable OIDC: ON
Provider Name: PocketID
Client ID: pocketid_abc123xyz789
Client Secret: secret_xyz789abc123...
Issuer URL: https://id.denike.io/
```

### Example 2: Authentik Setup

**Authentik Provider:**
```
Name: Faux|Dash
Client Type: Confidential
Redirect URIs: https://dashboard.company.com/api/auth/callback/oidc
Scopes: openid, email, profile
```

**Faux|Dash Settings:**
```
Enable OIDC: ON
Provider Name: Company SSO
Client ID: authentik_xyz789abc123
Client Secret: secret_abc123xyz789...
Issuer URL: https://sso.company.com/application/o/fauxdash/
```

### Example 3: Self-Hosted Keycloak

**Keycloak Client:**
```
Client ID: fauxdash
Access Type: confidential
Valid Redirect URIs: https://home.example.com/api/auth/callback/oidc
Realm: master
```

**Faux|Dash Settings:**
```
Enable OIDC: ON
Provider Name: Keycloak
Client ID: fauxdash
Client Secret: (from Credentials tab)
Issuer URL: https://keycloak.example.com/realms/master/
```

---

## Quick Reference

### Required URLs
- **Callback URL:** `https://your-domain.com/api/auth/callback/oidc`
- **Well-Known:** `{issuer-url}/.well-known/openid-configuration`

### Required Scopes
- `openid` (required)
- `email` (required)
- `profile` (required)

### Testing Commands
```bash
# Check OIDC configuration loaded
docker logs fauxdash | grep "OIDC provider"

# Check hot-reload worked
docker logs fauxdash | grep "reloading provider"

# Test well-known endpoint
curl https://your-provider.com/.well-known/openid-configuration

# Follow authentication logs
docker logs -f fauxdash | grep -E "OIDC|Sign in event"
```

---

## Common Questions

**Q: Do I need to restart after changing OIDC settings?**
A: No! v0.9.16+ reloads settings automatically. Just save and test.

**Q: Can I use both password and OIDC login?**
A: Yes! Both are available by default. Disable password login in OIDC-Only Mode.

**Q: What happens to existing users?**
A: OIDC users are linked by email. Existing users can login with either method.

**Q: Can I have multiple OIDC providers?**
A: Currently only one OIDC provider is supported. Use password login as fallback.

**Q: Is OIDC required?**
A: No, OIDC is optional. Password authentication works without OIDC.

**Q: Can I test without affecting production users?**
A: Yes! Use the "Test Authentication Flow" button or test in incognito window.

---

## Support

### Having Issues?
1. Check Docker logs: `docker logs fauxdash | grep OIDC`
2. Use "Test Configuration" button for detailed errors
3. Review this troubleshooting guide
4. Check provider documentation
5. Open GitHub issue with logs

### GitHub Issue Template
```
**Issue:** OIDC authentication not working

**Provider:** (e.g., PocketID, Authentik, Keycloak)

**Faux|Dash Version:** (e.g., v0.9.17)

**Logs:**
```
(paste relevant Docker logs)
```

**Steps to Reproduce:**
1. Configure OIDC settings
2. Click Test Authentication Flow
3. Error occurs at [stage]

**Expected:** Successful authentication
**Actual:** [describe error]
```

---

**Happy authenticating! 🚀**
