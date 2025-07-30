"use client"

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useEffect, Suspense } from "react";
import { Loader2, CheckCircle, AlertTriangle } from "lucide-react";
import { resetPassword } from "@/lib/auth-client";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

function ResetPasswordForm() {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const tokenParam = searchParams.get("token");
    const errorParam = searchParams.get("error");
    
    if (errorParam) {
      setError("Invalid or expired reset token. Please request a new password reset.");
    } else if (tokenParam) {
      setToken(tokenParam);
    } else {
      setError("No reset token provided. Please request a new password reset.");
    }
  }, [searchParams]);

  const handleResetPassword = async () => {
    if (!token) {
      toast.error("No reset token available");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters long");
      return;
    }

    setLoading(true);
    try {
      const { error } = await resetPassword({
        newPassword,
        token,
      });
      
      if (error) {
        toast.error(error.message || 'Failed to reset password');
      } else {
        setSuccess(true);
        toast.success("Password reset successfully!");
        setTimeout(() => {
          router.push("/sign-in");
        }, 2000);
      }
    } catch {
      toast.error("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="text-lg md:text-xl flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Reset Link Invalid
            </CardTitle>
            <CardDescription>
              There was a problem with your password reset link.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>
                {error}
              </AlertDescription>
            </Alert>
            <Button 
              className="w-full mt-4" 
              onClick={() => router.push("/sign-in")}
            >
              Back to Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="text-lg md:text-xl flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Password Reset Successful
            </CardTitle>
            <CardDescription>
              Your password has been successfully updated.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertTitle>Success!</AlertTitle>
              <AlertDescription>
                You can now sign in with your new password. Redirecting to sign in page...
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <Card className="max-w-md w-full">
        <CardHeader>
          <CardTitle className="text-lg md:text-xl">
            Reset Your Password
          </CardTitle>
          <CardDescription>
            Enter your new password below to complete the reset process.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="newPassword">New Password</Label>
              <Input
                id="newPassword"
                type="password"
                placeholder="Enter your new password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                minLength={8}
              />
              <p className="text-xs text-muted-foreground">
                Password must be at least 8 characters long
              </p>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Confirm your new password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                minLength={8}
              />
            </div>
            
            <Button
              disabled={loading || !newPassword || !confirmPassword || !token}
              onClick={handleResetPassword}
              className="w-full"
            >
              {loading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                "Reset Password"
              )}
            </Button>

            <div className="text-center text-sm">
              <button
                type="button"
                className="underline underline-offset-4 hover:text-primary"
                onClick={() => router.push("/sign-in")}
              >
                Back to Sign In
              </button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function ResetPassword() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p>Loading...</p>
          </CardContent>
        </Card>
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
}