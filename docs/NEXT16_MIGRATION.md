# Next.js 16 migration

The frontend was migrated from unsupported Next.js 14 and React 18 to pinned production versions:

- Next.js 16.3.1;
- React and React DOM 19.2.8;
- ESLint 9 with `eslint-config-next` 16.3.1;
- Node.js 20.9.0 or newer.

Migration changes include the current flat ESLint configuration, removal of the legacy webpack browser fallbacks, React 19-compatible ref and hydration state, reproducible lockfile installation and valid CSS import ordering for Turbopack.

Validation commands:

```bash
npm ci
npm run lint
npx tsc --noEmit
npm run build
npm audit --omit=dev
```

The Next.js/PostCSS/Sharp advisories reported by the previous dependency line are resolved. The legacy Solana wallet-adapter, web3 and React Native/mobile dependency tree was also removed. Browser wallet access is now restricted to explicitly selected injected providers and ownership-message signing; deposits and withdrawals remain unavailable while custody is disabled.
