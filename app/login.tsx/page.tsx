"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { motion } from "framer-motion";
import { Mail, Lock, Eye, EyeOff, ShieldCheck, LogIn } from "lucide-react";
import toast from "react-hot-toast";

export default function LoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Menggunakan NextAuth untuk proses autentikasi
      const result = await signIn("credentials", {
        redirect: false,
        email: formData.email,
        password: formData.password,
      });

      if (result?.error) {
        toast.error("Email atau kata sandi salah!");
      } else {
        toast.success("Berhasil masuk ke SIPMAS");
        // Arahkan ke dashboard setelah berhasil
        router.push("/dashboard");
        router.refresh(); // Memastikan sesi terupdate
      }
    } catch (error) {
      toast.error("Terjadi kesalahan sistem, silakan coba lagi.");
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
        <div className="flex justify-center mb-6">
          <div className="bg-blue-600/10 p-3 rounded-2xl text-blue-400">
            <ShieldCheck className="w-8 h-8" />
          </div>
        </div>

        <h1 className="text-2xl font-bold text-white text-center mb-2">Selamat Datang Kembali</h1>
        <p className="text-slate-400 text-center text-sm mb-8">Masuk untuk mengelola pengaduan Anda</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Input Email */}
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase mb-1.5 block">Email</label>
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

          {/* Input Password */}
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase mb-1.5 block">Kata Sandi</label>
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

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 mt-6 disabled:opacity-50"
          >
            {isLoading ? "Memproses..." : <><LogIn className="w-4 h-4" /> Masuk</>}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-slate-500">
          Belum punya akun?{" "}
          <a href="/register" className="text-blue-400 font-semibold hover:underline">Daftar sekarang</a>
        </div>
      </motion.div>
    </div>
  );
}