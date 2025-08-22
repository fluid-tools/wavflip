type LegalLayoutProps = {
  children: React.ReactNode;
};

export default function LegalLayout({ children }: LegalLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl px-4 py-12">
        <div className="rounded-lg p-8 shadow-xs">{children}</div>
      </div>
    </div>
  );
}
