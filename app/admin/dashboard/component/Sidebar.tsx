"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";

import {
  LayoutDashboard,
  FileText,
  BarChart3,
  PieChart,
  LogOut,
  ShieldCheck,
} from "lucide-react";

import toast from "react-hot-toast";

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const menus = [
    {
      name: "Dashboard",
      href: "/admin/dashboard",
      icon: LayoutDashboard,
    },
    {
      name: "Pengaduan",
      href: "/admin/dashboard/pengaduan",
      icon: FileText,
    },
    {
      name: "Laporan",
      href: "/admin/dashboard/laporan",
      icon: BarChart3,
    },
    {
      name: "Analitik",
      href: "/admin/dashboard/analitik",
      icon: PieChart,
    },
  ];

  const handleLogout = async () => {
    try {
      await signOut(auth);

      toast.success("Berhasil keluar");

      router.push("/admin/login");
    } catch (error) {
      console.error(error);

      toast.error("Gagal logout");
    }
  };

  return (
    <aside className="w-72 h-screen sticky top-0 bg-white border-r border-slate-100 shadow-sm flex flex-col">

      {/* HEADER */}
      <div className="p-6 border-b border-slate-100">

        <div className="flex items-center gap-3">

          <div className="bg-gradient-to-br from-blue-600 to-indigo-600 p-3 rounded-2xl shadow-lg">

            <ShieldCheck className="w-6 h-6 text-white" />

          </div>

          <div>

            <h1 className="font-black text-slate-900 text-lg">
              SIPMAS
            </h1>

            <p className="text-xs text-slate-500">
              Panel Petugas
            </p>

          </div>

        </div>

      </div>

      {/* MENU */}
      <nav className="flex-1 p-4 overflow-y-auto">

        <div className="space-y-2">

          {menus.map((menu) => {
            const Icon = menu.icon;

            const isActive =
              pathname === menu.href;

            return (
              <Link
                key={menu.href}
                href={menu.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-200 font-medium
                  
                  ${
                    isActive
                      ? "bg-blue-600 text-white shadow-lg shadow-blue-100"
                      : "text-slate-600 hover:bg-slate-100"
                  }
                `}
              >
                <Icon className="w-5 h-5" />

                <span>{menu.name}</span>
              </Link>
            );
          })}

        </div>

      </nav>

      {/* LOGOUT FIXED BAWAH */}
      <div className="p-4 border-t border-slate-100 bg-white">

        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 text-white py-3 rounded-2xl font-semibold transition-all shadow-lg shadow-red-100"
        >
          <LogOut className="w-4 h-4" />

          Logout
        </button>

      </div>

    </aside>
  );
}