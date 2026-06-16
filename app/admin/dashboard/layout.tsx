"use client";

import Sidebar from "./component/Sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex bg-slate-50">

      <Sidebar />

      <main className="flex-1 min-h-screen overflow-y-auto">
        {children}
      </main>

    </div>
  );
}