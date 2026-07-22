import coreWebVitals from 'eslint-config-next/core-web-vitals';

// Flat config (ESLint 9 / Next 16 — `next lint` and .eslintrc were removed in Next 16)
export default [
  ...coreWebVitals,
  {
    ignores: ['.next/**', 'node_modules/**', 'public/**', 'drizzle/**'],
  },
];
