import {
    createAuthClient
} from "better-auth/react";

export const {
    signIn,
    signOut,
    signUp,
    useSession,
    sendVerificationEmail
} = createAuthClient({
    baseURL: process.env.NEXT_PUBLIC_APP_URL,
});