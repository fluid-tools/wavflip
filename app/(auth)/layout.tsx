import { AuthGuard } from "@/components/auth-guard";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard requireAuth={false}>
      <div className="min-h-screen flex items-center justify-center p-4">
        {children}
      </div>
    </AuthGuard>
  );
}