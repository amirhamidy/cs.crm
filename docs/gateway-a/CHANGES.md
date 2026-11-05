# Step A: point the frontend at the ClientraPlatform API Gateway

Scope: base URL + gateway headers + tenant-safe caching. No change to rendering strategy,
routing, UI, or where tokens are stored (that is step B).

## What changed (17 files: 2 new, 15 edited)

| Area | File | Change |
|---|---|---|
| Config | `lib/config.ts` | Placeholder default replaced. Dev default `http://127.0.0.1:8080` (gateway). Production default `""` (same origin). Precedence unchanged: `/config.js` > `NEXT_PUBLIC_API_URL` > default. New `getMediaUrl()` (`MEDIA_URL`, falls back to API URL). |
| Gateway (new) | `lib/gateway.ts` | `X-Organization-Token` handling: `getOrgToken / setOrgToken / clearOrgToken`, single-flight `ensureOrgToken()` with a pluggable `registerOrgTokenProvider()`, helpers `attachOrgToken()` and `gatewayHeaders()`. If no token is configured, no header is sent, so a plain backend still works. |
| Scope (new) | `lib/sessionScope.ts` | Tiny registry: `onSessionScopeChange()` / `resetSessionScope()`. |
| HTTP | `lib/axiosInstance.ts` | Attaches the org token on every request (retries included, since they re-run the interceptor). |
| HTTP | `lib/portal/portalAxios.ts` | Same, for the customer portal. |
| HTTP | `lib/clientAuth.ts`, `services/authService.ts` | The bare `axios.post` calls (refresh, logout) now send the org token. |
| HTTP | `lib/minutesApi.ts` | Public signing client sends the org token; **see behavior change 1**. |
| Tenant safety | `lib/requestGovernor.ts` | GET dedupe key now includes the org token (before: only `Authorization`). In-flight map is cleared on scope change. |
| Tenant safety | `lib/api/_core.ts`, `lib/dashboard.ts`, `lib/api/accounts.ts`, `lib/api/customers.ts` | Module-level caches are cleared on scope change. |
| Tenant safety | `lib/clientAuth.ts`, `lib/portal/portalAuth.ts`, `components/AuthInitializer.tsx` | Scope reset on login, logout, forced sign-out (401), portal login/logout, and when another tab signs in as a different user. |
| Media | `lib/media.ts`, `components/admin/human_resources/hrUtils.ts` | Use `getMediaUrl()`; media URLs work in same-origin mode. |

## Behavior changes you should know about

1. **Public signing calls (`minutesApi.publicClient`).** It used `axiosInstance.defaults.baseURL`,
   which is never set (the base URL is applied in an interceptor), so these calls always went
   to the page origin. They now go to the configured API URL like everything else. If production
   relied on same-origin routing for `/minutes/api/v1/signer/public/...`, either keep `API_URL`
   empty there or tell me and I will revert this one.
2. **Caches are now dropped on every login/logout.** Before, module-level caches survived an
   in-tab logout/login (SPA navigation), so user B could see user A's cached lists for up to the TTL.
3. **Dedupe key includes the org token**, so two tenants with identical bearer tokens never share a response.
4. **Dev quirk:** an empty `API_URL` in `config.js` in development falls back to the dev default
   (empty string is falsy). In production an empty value means same-origin.

## Verification done / not done

Done:
- `tsc --noEmit` before vs after (same dependency set): **0 new errors**. The 14 errors that exist
  in both are `LucideIcon` typing mismatches caused by the sandbox's lucide version, not your code.
- 18 runtime assertions (esbuild bundle + fake `window`): header attached / absent, precedence,
  single-flight provider, provider failure, scope reset events, dedupe per tenant, media URLs in
  dev / production / same-origin / `MEDIA_URL` modes.
- All 17 files keep pure CRLF line endings; the diff removes only 13 lines.

Not done (I only had `src/`):
- `next build`, ESLint, or running against a real gateway/backend.
- I never saw `next.config.*`, `package.json`, `middleware.ts`, or `public/config.js`.

## Rollback
`git revert <commit>` or `git checkout main -- src`. No data migration, no new dependencies.
