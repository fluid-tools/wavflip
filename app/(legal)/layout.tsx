type LegalLayoutProps = {
    children: React.ReactNode;
};

export default function LegalLayout({ children }: LegalLayoutProps) {
    return (
        <div className="min-h-screen bg-background">
            <div className="max-w-4xl mx-auto py-12 px-4">
                <div className="rounded-lg shadow-xs p-8">
                    {children}
                </div>
            </div>
        </div>
    );
}