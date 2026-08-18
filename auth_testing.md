# Auth-Gated App Testing Playbook (Emergent Google OAuth)

DB: `test_database` (Mongo at localhost:27017). Collections: `users`, `user_sessions`.

## Create test user & session
```
mongosh --quiet --eval "
const db = db.getSiblingDB('test_database');
const uid='test-user-'+Date.now();
const tok='test_session_'+Date.now();
db.users.insertOne({user_id:uid, email:'qa.'+Date.now()+'@example.com', name:'QA Baker', picture:null, created_at:new Date().toISOString()});
db.user_sessions.insertOne({user_id:uid, session_token:tok, expires_at:new Date(Date.now()+7*24*3600*1000).toISOString(), created_at:new Date().toISOString()});
print(tok);
"
```

## Backend auth
- `GET /api/auth/me` with header `Authorization: Bearer <session_token>` OR cookie `session_token=<token>` → returns user JSON.
- All `/api/recipes*`, `/api/upload`, `/api/files/*`, `/api/ai/suggest` require the same auth.

## Browser testing
Preferred: set the cookie via a response, OR add cookie and reload. If Playwright `add_cookies` httpOnly cookies are not attached to XHR in this env, instead intercept and inject the `Authorization` header is NOT supported by the app (cookie/Bearer only). Best approach: set cookie with `sameSite:"None", secure:true`, then `page.reload()` before asserting. If still 401, drive the app through the real login button is not possible in automation; rely on backend API checks for auth-gated data and test UI rendering by seeding a session cookie.

Cookie name: `session_token`, path `/`, secure, sameSite None.
Main app route after login: `/dashboard`. Other routes: `/ricette`, `/ricette/nuova`, `/ricette/:id`, `/ricette/:id/modifica`, `/calcolatore`.
