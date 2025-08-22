import { createAuthClient } from 'better-auth/react';

export const {
  signIn,
  signOut,
  signUp,
  useSession,
  sendVerificationEmail,
  requestPasswordReset,
  resetPassword,
} = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_BASE_URL,
});
