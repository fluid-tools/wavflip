import { FlatCompat } from '@eslint/eslintrc';
import nextPlugin from '@next/eslint-plugin-next';

const compat = new FlatCompat({
  baseDirectory: import.meta.dirname,
});

const eslintConfig = [
  // Ensure Next.js plugin is explicitly loaded and rootDir is set for detection
  {
    plugins: {
      '@next/next': nextPlugin,
    },
  },
  ...compat.config({
    extends: ['next/core-web-vitals', 'next/typescript'],
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

