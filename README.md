# DigiWell — Smart Hydration Tracker

Huấn luyện viên Hydration thông minh. React + TypeScript + Supabase + Capacitor.

## Quick Start

```bash
npm install
npm run dev          # Web (Vite)
npm run cap open ios # Native iOS
npm run cap open android # Native Android
```

## Scripts

| Script | Mục đích |
|---|---|
| `npm run dev` | Dev server http://localhost:5173 |
| `npm run build` | Build production |
| `npm run test` | Chạy unit tests |
| `npm run test:watch` | Watch mode |
| `npm run test:coverage` | Coverage report |
| `npm run typecheck` | TypeScript check |
| `npm run lint` | ESLint |

## Tech Stack

- **Frontend:** React 19, TypeScript, Tailwind CSS 3, Zustand, TanStack Query
- **Mobile:** Capacitor 8 (iOS + Android)
- **Backend:** Supabase (PostgreSQL, Auth, Realtime, Edge Functions)
- **Payments:** Stripe
- **AI:** Groq (LLaMA 3.3-70B)
- **Monitoring:** Sentry
- **Testing:** Vitest + Testing Library

## Premium Subscription Flow

See [docs/stripe.md](./docs/stripe.md) for full setup guide.

## Environment Variables

Copy `.env.example` to `.env` and fill in:

```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_SENTRY_DSN=
VITE_OPENWEATHER_API_KEY=
```

Edge Function secrets (set via Supabase CLI):
```
supabase secrets set STRIPE_SECRET_KEY=sk_...
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...
supabase secrets set STRIPE_PRICE_MONTHLY=price_...
supabase secrets set STRIPE_PRICE_YEARLY=price_...
supabase secrets set GROQ_API_KEY=gsk_...
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
