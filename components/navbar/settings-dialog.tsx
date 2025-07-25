"use client"

import * as React from "react"
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useSession, signOut, sendVerificationEmail, requestPasswordReset } from "@/lib/auth-client"
import { User, Mail, Shield, AlertTriangle, LogOut, Camera } from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

interface SettingsDialogProps {
  children?: React.ReactNode
}

export default function SettingsDialog({ children }: SettingsDialogProps) {
  const { data: session } = useSession()
  const router = useRouter()
  const [open, setOpen] = React.useState(false)
  const [isResending, setIsResending] = React.useState(false)
  const [isRequestingPasswordReset, setIsRequestingPasswordReset] = React.useState(false)

  const handleSignOut = async () => {
    try {
      await signOut()
      toast.success("Signed out successfully")
      setOpen(false)
      router.push("/sign-in")
    } catch {
      toast.error("Failed to sign out")
    }
  }

  const handleResendVerification = async () => {
    if (!session?.user.email) return
    
    setIsResending(true)
    try {
      await sendVerificationEmail({
        email: session.user.email,
        callbackURL: window.location.origin
      })
      toast.success("Verification email sent! Check your inbox.")
    } catch (error) {
      console.error("Failed to send verification email:", error)
      toast.error("Failed to send verification email. Please try again.")
    } finally {
      setIsResending(false)
    }
  }

  const handleChangePassword = async () => {
    if (!session?.user.email) return
    
    setIsRequestingPasswordReset(true)
    try {
      await requestPasswordReset({
        email: session.user.email,
        redirectTo: window.location.origin + "/reset-password"
      })
      toast.success("Password reset email sent! Check your inbox to change your password.")
    } catch (error) {
      console.error("Failed to send password reset email:", error)
      toast.error("Failed to send password reset email. Please try again.")
    } finally {
      setIsRequestingPasswordReset(false)
    }
  }

  const initials = session?.user.name
    ? session.user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
    : session?.user.email[0].toUpperCase() || "U"

  const isEmailVerified = session?.user.emailVerified

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || <Button variant="outline" size="sm">Settings</Button>}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>User Settings</DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="account">Account</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
          </TabsList>
          
          <TabsContent value="profile" className="space-y-4">
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
                      <AvatarImage src={session?.user.image || ""} alt={session?.user.name || ""} />
                      <AvatarFallback className="text-lg">{initials}</AvatarFallback>
                    </Avatar>
                    <Button
                      size="sm"
                      variant="outline"
                      className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full p-0"
                    >
                      <Camera className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold">{session?.user.name || "Anonymous User"}</h3>
                    <p className="text-sm text-muted-foreground">{session?.user.email}</p>
                    <div className="flex items-center gap-2 mt-2">
                      {isEmailVerified ? (
                        <Badge variant="secondary" className="text-green-600 bg-green-50 dark:bg-green-950">
                          <Shield className="h-3 w-3 mr-1" />
                          Verified
                        </Badge>
                      ) : (
                        <Badge variant="destructive">
                          <AlertTriangle className="h-3 w-3 mr-1" />
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
                      id="name"
                      defaultValue={session?.user.name || ""}
                      placeholder="Enter your display name"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      defaultValue={session?.user.email || ""}
                      disabled
                      className="bg-muted"
                    />
                    <p className="text-xs text-muted-foreground">
                      Email cannot be changed. Contact support if needed.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="account" className="space-y-4">
            {!isEmailVerified && (
              <Alert variant="warning">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Email Verification Required</AlertTitle>
                <AlertDescription>
                  Your email address is not verified. Some features may be limited until you verify your email.
                  <Button 
                    variant="link" 
                    className="p-0 h-auto font-normal text-yellow-600 dark:text-yellow-400"
                    onClick={handleResendVerification}
                    disabled={isResending}
                  >
                    {isResending ? "Sending..." : "Resend verification email"}
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
                      <p className="text-sm text-muted-foreground">
                        {isEmailVerified ? "Your email is verified" : "Email verification pending"}
                      </p>
                      {!isEmailVerified && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="mt-2"
                          onClick={handleResendVerification}
                          disabled={isResending}
                        >
                          {isResending ? "Sending..." : "Send Verification Email"}
                        </Button>
                      )}
                    </div>
                    {isEmailVerified ? (
                      <Badge variant="secondary" className="text-green-600 bg-green-50 dark:bg-green-950">
                        <Shield className="h-3 w-3 mr-1" />
                        Verified
                      </Badge>
                    ) : (
                      <Badge variant="destructive">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        Unverified
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Account Created</p>
                      <p className="text-sm text-muted-foreground">
                        {session?.user.createdAt 
                          ? new Date(session.user.createdAt).toLocaleDateString()
                          : "Unknown"
                        }
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="security" className="space-y-4">
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
                    <h4 className="font-medium mb-2">Password</h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      Change your account password by requesting a reset email.
                    </p>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={handleChangePassword}
                      disabled={isRequestingPasswordReset}
                    >
                      {isRequestingPasswordReset ? "Sending..." : "Change Password"}
                    </Button>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-2">Sign Out</h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      Sign out of your account on this device.
                    </p>
                    <Button variant="destructive" size="sm" onClick={handleSignOut}>
                      <LogOut className="h-4 w-4 mr-2" />
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
  )
} 