export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="bg-slate-50 min-h-screen">
      <main className="min-h-screen overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
