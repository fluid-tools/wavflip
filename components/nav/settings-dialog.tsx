'use client';

import {
  AlertTriangle,
  Camera,
  LogOut,
  Mail,
  Shield,
  User,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import * as React from 'react';
import { toast } from 'sonner';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  requestPasswordReset,
  sendVerificationEmail,
  signOut,
  useSession,
} from '@/lib/auth-client';

type SettingsDialogProps = {
  children?: React.ReactNode;
};

export default function SettingsDialog({ children }: SettingsDialogProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [isResending, setIsResending] = React.useState(false);
  const [isRequestingPasswordReset, setIsRequestingPasswordReset] =
    React.useState(false);

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success('Signed out successfully');
      setOpen(false);
      router.push('/sign-in');
    } catch {
      toast.error('Failed to sign out');
    }
  };

  const handleResendVerification = async () => {
    if (!session?.user.email) {
      return;
    }

    setIsResending(true);
    try {
      await sendVerificationEmail({
        email: session.user.email,
        callbackURL: `${process.env.NEXT_PUBLIC_BASE_URL}/vault`,
      });
      toast.success('Verification email sent! Check your inbox.');
    } catch (_error) {
      toast.error('Failed to send verification email. Please try again.');
    } finally {
      setIsResending(false);
    }
  };

  const handleChangePassword = async () => {
    if (!session?.user.email) {
      return;
    }

    setIsRequestingPasswordReset(true);
    try {
      await requestPasswordReset({
        email: session.user.email,
        redirectTo: `${process.env.NEXT_PUBLIC_BASE_URL}/reset-password`,
      });
      toast.success(
        'Password reset email sent! Check your inbox to change your password.'
      );
    } catch (_error) {
      toast.error('Failed to send password reset email. Please try again.');
    } finally {
      setIsRequestingPasswordReset(false);
    }
  };

  const initials = session?.user.name
    ? session.user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
    : session?.user.email[0].toUpperCase() || 'U';

  const isEmailVerified = session?.user.emailVerified;

  return (
    <Dialog onOpenChange={setOpen} open={open}>
      <DialogTrigger asChild>
        {children || (
          <Button size="sm" variant="outline">
            Settings
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-h-[80vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>User Settings</DialogTitle>
        </DialogHeader>

        <Tabs className="w-full" defaultValue="profile">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="account">Account</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
          </TabsList>

          <TabsContent className="space-y-4" value="profile">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Profile Information
                </CardTitle>
                <CardDescription>
                  Manage your profile details and preferences.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <Avatar className="h-20 w-20">
                      <AvatarImage
                        alt={session?.user.name || ''}
                        src={session?.user.image || ''}
                      />
                      <AvatarFallback className="text-lg">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <Button
                      className="-bottom-2 -right-2 absolute h-8 w-8 rounded-full p-0"
                      size="sm"
                      variant="outline"
                    >
                      <Camera className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold">
                      {session?.user.name || 'Anonymous User'}
                    </h3>
                    <p className="text-muted-foreground text-sm">
                      {session?.user.email}
                    </p>
                    <div className="mt-2 flex items-center gap-2">
                      {isEmailVerified ? (
                        <Badge
                          className="bg-green-50 text-green-600 dark:bg-green-950"
                          variant="secondary"
                        >
                          <Shield className="mr-1 h-3 w-3" />
                          Verified
                        </Badge>
                      ) : (
                        <Badge variant="destructive">
                          <AlertTriangle className="mr-1 h-3 w-3" />
                          Unverified
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">Display Name</Label>
                    <Input
                      defaultValue={session?.user.name || ''}
                      id="name"
                      placeholder="Enter your display name"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      className="bg-muted"
                      defaultValue={session?.user.email || ''}
                      disabled
                      id="email"
                      type="email"
                    />
                    <p className="text-muted-foreground text-xs">
                      Email cannot be changed. Contact support if needed.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent className="space-y-4" value="account">
            {!isEmailVerified && (
              <Alert variant="warning">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Email Verification Required</AlertTitle>
                <AlertDescription>
                  Your email address is not verified. Some features may be
                  limited until you verify your email.
                  <Button
                    className="h-auto p-0 font-normal text-yellow-600 dark:text-yellow-400"
                    disabled={isResending}
                    onClick={handleResendVerification}
                    variant="link"
                  >
                    {isResending ? 'Sending...' : 'Resend verification email'}
                  </Button>
                </AlertDescription>
              </Alert>
            )}

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Account Status
                </CardTitle>
                <CardDescription>
                  Your account information and verification status.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Email Verification</p>
                      <p className="text-muted-foreground text-sm">
                        {isEmailVerified
                          ? 'Your email is verified'
                          : 'Email verification pending'}
                      </p>
                      {!isEmailVerified && (
                        <Button
                          className="mt-2"
                          disabled={isResending}
                          onClick={handleResendVerification}
                          size="sm"
                          variant="outline"
                        >
                          {isResending
                            ? 'Sending...'
                            : 'Send Verification Email'}
                        </Button>
                      )}
                    </div>
                    {isEmailVerified ? (
                      <Badge
                        className="bg-green-50 text-green-600 dark:bg-green-950"
                        variant="secondary"
                      >
                        <Shield className="mr-1 h-3 w-3" />
                        Verified
                      </Badge>
                    ) : (
                      <Badge variant="destructive">
                        <AlertTriangle className="mr-1 h-3 w-3" />
                        Unverified
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Account Created</p>
                      <p className="text-muted-foreground text-sm">
                        {session?.user.createdAt
                          ? new Date(
                              session.user.createdAt
                            ).toLocaleDateString()
                          : 'Unknown'}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent className="space-y-4" value="security">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Security Settings
                </CardTitle>
                <CardDescription>
                  Manage your account security and authentication.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div>
                    <h4 className="mb-2 font-medium">Password</h4>
                    <p className="mb-2 text-muted-foreground text-sm">
                      Change your account password by requesting a reset email.
                    </p>
                    <Button
                      disabled={isRequestingPasswordReset}
                      onClick={handleChangePassword}
                      size="sm"
                      variant="outline"
                    >
                      {isRequestingPasswordReset
                        ? 'Sending...'
                        : 'Change Password'}
                    </Button>
                  </div>

                  <div>
                    <h4 className="mb-2 font-medium">Sign Out</h4>
                    <p className="mb-2 text-muted-foreground text-sm">
                      Sign out of your account on this device.
                    </p>
                    <Button
                      onClick={handleSignOut}
                      size="sm"
                      variant="destructive"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Sign Out
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
