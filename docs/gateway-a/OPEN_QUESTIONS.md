# Open questions (needed from the backend team before this works end to end)

1. **Org token endpoint contract.** `POST/GET http://<control-plane>/organizations/api/v1/authenticate/auth/token/`:
   what does the request carry (org slug? credentials?), what does the response look like, how long
   does the token live, how is it refreshed? Plug the answer into `registerOrgTokenProvider()` in
   `lib/gateway.ts`. Nothing is invented there today.
2. **How does the browser know which organization?** Layer 1 must succeed *before* the user logs in
   (login itself goes through the gateway). Subdomain, path slug, or a field on the login form?
3. **Public flows have no user.** `/minutes/sign/[token]` and the customer-portal login still need an
   org to be routed. Should the org be part of the link, or embedded in the signing token?
4. **Files and avatars.** `<img src>` and `<a href>` cannot send `X-Organization-Token`. If the gateway
   requires it for `/media/...`, files need signed URLs, a separate origin (`MEDIA_URL`), or the BFF
   from step B. Until answered, media only works if the gateway serves it without the header.
5. **Which route prefixes exist behind the gateway?** The README documents `accounts/*` only. This app
   also calls `tasks`, `customers`, `department`, `dashboard`, `minutes`, `portal`, warehouse,
   purchasing and quality-control routes.
6. **CORS (if the browser talks to the gateway directly).** The gateway must allow the frontend origin
   and list `X-Organization-Token` in `Access-Control-Allow-Headers`; otherwise every preflight fails.
7. **Production topology.** Same origin behind a reverse proxy (`API_URL` empty), or a separate gateway host?
8. **Storage.** The org token lives in `localStorage` for now, like the JWTs. Step B moves both to
   HttpOnly cookies behind a BFF.

## Found while reading, not changed
- `app/login/LoginClient.tsx` is unused (the page imports `components/login/LoginClient`); delete one.
- Other module-level state is not reset on scope change: `lib/api/statusPage.ts` (capability flags,
  not user data) and the notification snapshot (already keyed by user id).
