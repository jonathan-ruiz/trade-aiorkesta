// Use root TypeScript ESLint config for now
// TODO: Re-enable eslint-config-next when Next.js babel deps are fixed
export default [
  {
    ignores: ['.next/**', 'out/**', 'build/**', 'next-env.d.ts'],
  },
];
