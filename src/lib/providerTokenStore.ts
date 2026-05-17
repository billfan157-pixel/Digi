// src/lib/providerTokenStore.ts
// In-memory store for OAuth provider tokens (avoids sessionStorage plaintext)

let _providerToken: string | null = null;
let _providerRefreshToken: string | null = null;

export const providerTokenStore = {
  get token() { return _providerToken; },
  get refreshToken() { return _providerRefreshToken; },
  set(token: string, refresh: string | null) {
    _providerToken = token;
    _providerRefreshToken = refresh;
  },
  clear() {
    _providerToken = null;
    _providerRefreshToken = null;
  },
};
