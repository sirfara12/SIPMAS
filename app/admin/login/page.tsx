"use client";

import React, { useState } from "react";
import { auth, db } from "@/lib/firebase";
import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Mail, Lock, Eye, EyeOff, ShieldCheck, LogIn, AlertTriangle } from "lucide-react";
import toast from "react-hot-toast";

export default function AdminLoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // 1. Autentikasi Menggunakan Firebase Auth (Kebutuhan F-05)
      const userCredential = await signInWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );
      const user = userCredential.user;

      // 2. Tarik Data Hak Akses Berdasarkan Role dari Firestore (Kebutuhan Bab 5.4.2)
      const userDocRef = doc(db, "users", user.uid);
      const userDocSnap = await getDoc(userDocRef);

      if (userDocSnap.exists()) {
        const userData = userDocSnap.data();
        const userRole = userData.role; // Mengambil data role ('masyarakat' / 'admin' / 'superadmin')

        // 3. Proteksi & Validasi Role Ketat (Sesuai Karakteristik Pengguna Bab 2.3)
        if (userRole === "admin" || userRole === "superadmin") {
          toast.success(`Selamat datang di Panel Petugas, ${userData.name}!`);
          
          router.replace("/admin/dashboard"); 
          router.refresh();
        } else {
          // JIKA WARGA MENCOBA LOGIN DI SINI: Keluarkan paksa & batalkan sesi (NF-07)
          await signOut(auth);
          toast.error("Akses Ditolak! Halaman ini khusus untuk Petugas Kelurahan.");
        }
      } else {
        await signOut(auth);
        toast.error("Profil akun Anda tidak terdaftar dalam database sistem.");
      }

    } catch (err: any) {
      console.error(err);
      // Penanganan error kredensial (Kebutuhan Keamanan)
      if (
        err.code === "auth/wrong-password" ||
        err.code === "auth/user-not-found" ||
        err.code === "auth/invalid-credential"
      ) {
        toast.error("Email atau kata sandi petugas salah!");
      } else if (err.code === "auth/too-many-requests") {
        toast.error("Terlalu banyak percobaan gagal. Akses ditangguhkan sementara.");
      } else {
        toast.error(err.message || "Terjadi kesalahan sistem saat memproses login.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 font-sans">
      
      {/* Ornamen Latar Belakang Elegan khusus Admin */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-900/40 via-slate-900 to-slate-900 -z-10"></div>

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md bg-slate-800/40 backdrop-blur-xl border border-slate-700/60 rounded-3xl p-8 shadow-2xl"
      >
        {/* Kontainer Ikon Perisai Petugas */}
        <div className="flex justify-center mb-5">
          <div className="bg-indigo-500/10 p-3.5 rounded-2xl text-indigo-400 border border-indigo-500/20 shadow-inner">
            <ShieldCheck className="w-8 h-8" />
          </div>
        </div>

        {/* Judul Halaman */}
        <h1 className="text-xl font-black text-white text-center tracking-tight mb-1">
          PANEL LOGIN PETUGAS
        </h1>
        <p className="text-slate-400 text-center text-xs mb-6 font-medium">
          SIPMAS Kelurahan Ngemplakrejo Kota Pasuruan
        </p>

        {/* Notifikasi Warning untuk Memastikan Keamanan */}
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 flex items-start gap-2.5 mb-6">
          <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
          <p className="text-[11px] text-amber-300/90 leading-relaxed font-medium">
            Halaman ini dilindungi enkripsi JWT & Firestore Security Rules. Akses tidak sah akan dicatat oleh log sistem.
          </p>
        </div>

        {/* Form Login Admin */}
        <form onSubmit={handleAdminLogin} className="space-y-4">
          
          {/* Input Email Petugas */}
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">
              Email Official Petugas
            </label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
              <input
                type="email"
                name="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="w-full bg-slate-950/60 border border-slate-700/70 rounded-xl py-3 pl-11 pr-4 text-white text-sm focus:border-indigo-500 outline-none transition-all placeholder:text-slate-600"
                placeholder="petugas@ngemplakrejo.go.id"
              />
            </div>
          </div>

          {/* Input Password Petugas */}
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">
              Kata Sandi Resmi
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                required
                value={formData.password}
                onChange={handleChange}
                className="w-full bg-slate-950/60 border border-slate-700/70 rounded-xl py-3 pl-11 pr-11 text-white text-sm focus:border-indigo-500 outline-none transition-all placeholder:text-slate-600"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Tombol Masuk Aplikasi */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm py-3 rounded-xl transition-all flex items-center justify-center gap-2 mt-6 disabled:opacity-50 shadow-lg shadow-indigo-950"
          >
            {isLoading ? (
              "Memvalidasi Akses..."
            ) : (
              <>
                <LogIn className="w-4 h-4" /> Otorisasi Masuk
              </>
            )}
          </button>
        </form>

        {/* Tautan Kembali ke Portal Publik */}
        <div className="mt-6 pt-4 border-t border-slate-700/40 text-center">
          <a href="/" className="text-xs text-slate-500 hover:text-indigo-400 font-semibold transition-colors">
            ← Kembali ke Portal Pengaduan Warga
          </a>
        </div>

      </motion.div>
    </div>
  );
}