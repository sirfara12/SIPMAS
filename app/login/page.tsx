"use client";

import React, { useState } from "react";
import { auth, db } from "@/lib/firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Mail, Lock, Eye, EyeOff, ShieldCheck, LogIn } from "lucide-react";
import toast from "react-hot-toast";

export default function LoginPage() {
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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // 1. Autentikasi menggunakan Firebase Auth
      const userCredential = await signInWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );
      const user = userCredential.user;

      // 2. Validasi Verifikasi Email (Kebutuhan F-03)
      // Catatan: Jika masih dalam tahap pengembangan lokal, Anda bisa memberikan komentar (//) 
      // pada blok if di bawah ini agar bisa masuk tanpa harus verifikasi email asli.
      if (!user.emailVerified) {
        toast.error("Silakan verifikasi email Anda terlebih dahulu sebelum masuk!");
        setIsLoading(false);
        return;
      }

      // 3. Ambil data dokumen pengguna dari Firestore untuk mengecek Role (F-05)
      const userDocRef = doc(db, "users", user.uid);
      const userDocSnap = await getDoc(userDocRef);

      if (userDocSnap.exists()) {
        const userData = userDocSnap.data();
        const userRole = userData.role; // Mengambil data role ('masyarakat' / 'admin')

        toast.success(`Selamat datang kembali, ${userData.name}!`);

        // 4. Pengalihan Halaman Berdasarkan Role Sesuai Ketentuan SKPL
        if (userRole === "admin" || userRole === "superadmin") {
          router.push("/admin/dashboard"); // Dashboard Petugas/Admin Kelurahan
        } else {
          router.push("/dashboard"); // Dashboard Utama Warga/Masyarakat
        }
        router.refresh();
      } else {
        toast.error("Profil akun tidak ditemukan di database database.");
      }

    } catch (err: any) {
      console.error(err);
      // Penanganan pesan eror yang ramah pengguna
      if (
        err.code === "auth/wrong-password" ||
        err.code === "auth/user-not-found" ||
        err.code === "auth/invalid-credential"
      ) {
        toast.error("Email atau kata sandi yang Anda masukkan salah!");
      } else if (err.code === "auth/too-many-requests") {
        toast.error("Terlalu banyak percobaan masuk yang gagal. Silakan coba lagi nanti.");
      } else {
        toast.error(err.message || "Terjadi kesalahan saat masuk ke sistem.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0f19] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 shadow-2xl"
      >
        {/* Kontainer Ikon Logo */}
        <div className="flex justify-center mb-6">
          <div className="bg-blue-600/10 p-3 rounded-2xl text-blue-400 border border-blue-500/10">
            <ShieldCheck className="w-8 h-8" />
          </div>
        </div>

        {/* Judul Aplikasi */}
        <h1 className="text-2xl font-bold text-white text-center mb-2">SIPMAS KELURAHAN NGEMPLAKREJO</h1>
        <p className="text-slate-400 text-center text-sm mb-8">Sistem Pengaduan Masyarakat Kelurahan Ngemplakrejo</p>

        {/* Form Login */}
        <form onSubmit={handleLogin} className="space-y-4">
          
          {/* Input Email */}
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase mb-1.5 block">Alamat Email</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
              <input
                type="email"
                name="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="w-full bg-slate-950/80 border border-slate-800 rounded-xl py-3 pl-11 pr-4 text-white text-sm focus:border-blue-500 outline-none transition-all"
                placeholder="nama@email.com"
              />
            </div>
          </div>

          {/* Input Kata Sandi */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase block">Kata Sandi</label>
              <a href="/forgot-password" className="text-xs font-semibold text-blue-400 hover:underline">Lupa Sandi?</a>
            </div>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                required
                value={formData.password}
                onChange={handleChange}
                className="w-full bg-slate-950/80 border border-slate-800 rounded-xl py-3 pl-11 pr-11 text-white text-sm focus:border-blue-500 outline-none transition-all"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Tombol Submit Sign In */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 mt-6 disabled:opacity-50"
          >
            {isLoading ? "Memverifikasi..." : <><LogIn className="w-4 h-4" /> Masuk Aplikasi</>}
          </button>
        </form>

        {/* Link Navigasi ke Registrasi */}
        <div className="mt-6 text-center text-sm text-slate-500">
          Belum terdaftar sebagai anggota?{" "}
          <a href="/register" className="text-blue-400 font-semibold hover:underline">Buat akun warga</a>
        </div>
        {/* Tautan Kembali ke Portal Publik */}
        <div className="mt-6 pt-4 border-t border-slate-700/40 text-center">
          <a href="/" className="text-xs text-slate-500 hover:text-indigo-400 font-semibold transition-colors">
            ← Kembali ke Portal Dashboard
          </a>
        </div>
      </motion.div>

    </div>
  );
}