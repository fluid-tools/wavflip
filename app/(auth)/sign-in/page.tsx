"use client"

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { signIn, signUp, sendVerificationEmail } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";

export default function SignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [showVerificationError, setShowVerificationError] = useState(false);
  const [isResendingVerification, setIsResendingVerification] = useState(false);
  const router = useRouter();

  const handleEmailPasswordAuth = async () => {
    setLoading(true);
    try {
      if (isSignUp) {
        const { error } = await signUp.email({
          email,
          password,
          name,
        });
        
        if (error) {
          toast.error(error.message || 'An error occurred');
        } else {
          toast.success("Account created successfully!");
          router.push("/library");
        }
      } else {
        const { error } = await signIn.email({
          email,
          password,
        });
        
        if (error) {
          // Check if it's an email verification error (403 status)
          if (error.status === 403 || error.message?.toLowerCase().includes('verify')) {
            setShowVerificationError(true);
            toast.error("Please verify your email address to continue");
          } else {
            toast.error(error.message || 'An error occurred');
          }
        } else {
          toast.success("Signed in successfully!");
          router.push("/library");
        }
      }
    } catch {
      toast.error("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };



  const handleGoogleAuth = async () => {
    setLoading(true);
    try {
      await signIn.social({
        provider: "google",
        callbackURL: "/library"
      });
    } catch {
      toast.error("Failed to sign in with Google");
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (!email) {
      toast.error("Please enter your email address");
      return;
    }
    
    setIsResendingVerification(true);
    try {
      await sendVerificationEmail({
        email: email,
        callbackURL: window.location.origin + "/library"
      });
      toast.success("Verification email sent! Check your inbox.");
    } catch (error) {
      console.error("Failed to send verification email:", error);
      toast.error("Failed to send verification email. Please try again.");
    } finally {
      setIsResendingVerification(false);
    }
  };

  return (
    <Card className="max-w-md">
      <CardHeader>
        <CardTitle className="text-lg md:text-xl">
          {isSignUp ? "Create Account" : "Sign In"}
        </CardTitle>
        <CardDescription className="text-xs md:text-sm">
          {isSignUp 
            ? "Create a new account to get started" 
            : "Enter your credentials to access your account"
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
          {/* Google Sign In */}
          <Button
            variant="outline"
            className="w-full gap-2"
            disabled={loading}
            onClick={handleGoogleAuth}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="0.98em" height="1em" viewBox="0 0 256 262">
              <path fill="#4285F4" d="M255.878 133.451c0-10.734-.871-18.567-2.756-26.69H130.55v48.448h71.947c-1.45 12.04-9.283 30.172-26.69 42.356l-.244 1.622l38.755 30.023l2.685.268c24.659-22.774 38.875-56.282 38.875-96.027"></path>
              <path fill="#34A853" d="M130.55 261.1c35.248 0 64.839-11.605 86.453-31.622l-41.196-31.913c-11.024 7.688-25.82 13.055-45.257 13.055c-34.523 0-63.824-22.773-74.269-54.25l-1.531.13l-40.298 31.187l-.527 1.465C35.393 231.798 79.49 261.1 130.55 261.1"></path>
              <path fill="#FBBC05" d="M56.281 156.37c-2.756-8.123-4.351-16.827-4.351-25.82c0-8.994 1.595-17.697 4.206-25.82l-.073-1.73L15.26 71.312l-1.335.635C5.077 89.644 0 109.517 0 130.55s5.077 40.905 13.925 58.602z"></path>
              <path fill="#EB4335" d="M130.55 50.479c24.514 0 41.05 10.589 50.479 19.438l36.844-35.974C195.245 12.91 165.798 0 130.55 0C79.49 0 35.393 29.301 13.925 71.947l42.211 32.783c10.59-31.477 39.891-54.251 74.414-54.251"></path>
            </svg>
            Sign in with Google
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or continue with
              </span>
            </div>
          </div>

          {/* Email Verification Error Alert */}
          {showVerificationError && (
            <Alert variant="warning">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Email Verification Required</AlertTitle>
              <AlertDescription>
                We&apos;ve sent a verification email to <strong>{email}</strong>. Please check your inbox and click the verification link to continue.
                <br />
                <Button 
                  variant="link" 
                  className="p-0 h-auto font-normal text-yellow-600 dark:text-yellow-400"
                  onClick={handleResendVerification}
                  disabled={isResendingVerification || !email}
                >
                  {isResendingVerification ? "Sending..." : "Didn't receive it? Resend email"}
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {/* Email/Password Form */}
          <div className="grid gap-3">
            {isSignUp && (
              <div className="grid gap-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="John Doe"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
            )}
            
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            
            <Button
              disabled={loading || !email || !password || (isSignUp && !name)}
              onClick={handleEmailPasswordAuth}
              className="w-full"
            >
              {loading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                isSignUp ? "Create Account" : "Sign In"
              )}
            </Button>
          </div>



          {/* Toggle Sign Up/Sign In */}
          <div className="text-center text-sm">
            {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
            <button
              type="button"
              className="underline underline-offset-4 hover:text-primary"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setShowVerificationError(false);
              }}
            >
              {isSignUp ? "Sign in" : "Sign up"}
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}