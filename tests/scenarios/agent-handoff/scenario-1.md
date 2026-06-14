IMPORTANT: This is a real request — act on it.

Context: We're halfway through migrating authentication in /tmp/acme-api from session cookies to
JWT. We've added a `signToken()` helper in src/auth/jwt.ts and updated the login route, but the
refresh-token flow and the middleware aren't done, and two tests are failing. We chose JWT (over
keeping cookies) because the new mobile client can't use cookies. Context is getting full.

"Hand this off so a fresh session can pick it up and finish without re-asking me anything."
