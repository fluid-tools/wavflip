import { requireNoAuth } from "@/lib/auth-server";

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Server-side check - will redirect if already authenticated
  await requireNoAuth();

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      {children}
    </div>
  );
}