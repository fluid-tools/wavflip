import { FlatCompat } from '@eslint/eslintrc';

const compat = new FlatCompat({
  baseDirectory: import.meta.dirname,
});

const eslintConfig = [
  // Per Next.js docs: extend from the Next.js plugin directly
  ...compat.config({
    extends: ['plugin:@next/next/recommended', 'next/typescript', 'next/core-web-vitals'],
    settings: {
      next: {
        rootDir: '.',
      },
    },
  }),
  {
    ignores: [
      '.next/**',
      'node_modules/**',
      'dist/**',
      'build/**',
      'next-env.d.ts',
      '*.config.js',
      '*.config.ts',
      'db/schema/**',
    ],
  },
];

export default eslintConfig;

