"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { motion } from "framer-motion";
import { ShieldCheck, AlertCircle, Eye, EyeOff } from "lucide-react";
import { toast } from "react-hot-toast";

export default function RegisterPage() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    name: "",
    nik: "",
    phone: "",
    email: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    if (error) setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    // Validasi Sesuai SKPL F-02
    if (formData.password.length < 8) {
      setError("Kata sandi terlalu pendek! Minimal harus 8 karakter.");
      setIsLoading(false);
      return;
    }

    try {
      // Simulasi proses daftar
      await new Promise((resolve) => setTimeout(resolve, 1500));
      
      toast.success("Akun berhasil dibuat! Silakan masuk.");
      
      // Navigasi ke halaman login yang benar
      router.push("/login"); 
    } catch (err) {
      toast.error("Terjadi kesalahan sistem.");
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    signIn("google", { callbackUrl: "/dashboard" });
  };

  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 flex items-center justify-center p-4 relative overflow-hidden font-sans">
      <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-blue-500/10 blur-[120px] pointer-events-none"></div>
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-xl bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl relative z-10 my-8"
      >
        <div className="flex justify-center mb-4">
          <div className="bg-blue-600/10 border border-blue-500/20 p-3 rounded-2xl flex items-center gap-2 text-blue-400">
            <ShieldCheck className="w-6 h-6" />
            <span className="font-extrabold text-sm tracking-wider">SIPMAS-KELURAHAN NGEMPLAKREJO</span>
          </div>
        </div>

        <div className="text-center mb-6">
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Pendaftaran Akun Warga</h1>
          <p className="text-slate-400 text-sm mt-1">Lengkapi data diri Anda untuk mulai mengajukan pengaduan</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <motion.div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3.5 flex items-center gap-2 text-red-400 text-xs font-semibold">
              <AlertCircle className="w-4.5 h-4.5 shrink-0" />
              <span>{error}</span>
            </motion.div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">Nama Lengkap *</label>
              <input type="text" name="name" required value={formData.name} onChange={handleChange} className="w-full bg-slate-950/80 border border-slate-800 focus:border-blue-500 rounded-xl py-2.5 pl-4 pr-4 text-white text-sm outline-none transition-all" placeholder="Nama sesuai KTP" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">NIK (Opsional)</label>
              <input type="text" name="nik" maxLength={16} value={formData.nik} onChange={handleChange} className="w-full bg-slate-950/80 border border-slate-800 focus:border-blue-500 rounded-xl py-2.5 pl-4 pr-4 text-white text-sm outline-none transition-all" placeholder="16 digit No. KTP" />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">Alamat Email *</label>
            <input type="email" name="email" required value={formData.email} onChange={handleChange} className="w-full bg-slate-950/80 border border-slate-800 focus:border-blue-500 rounded-xl py-2.5 pl-4 pr-4 text-white text-sm outline-none transition-all" placeholder="nama@email.com" />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">Kata Sandi (Min. 8 Karakter) *</label>
            <div className="relative">
              <input type={showPassword ? "text" : "password"} name="password" required value={formData.password} onChange={handleChange} className="w-full bg-slate-950/80 border border-slate-800 focus:border-blue-500 rounded-xl py-2.5 pl-4 pr-11 text-white text-sm outline-none transition-all" placeholder="••••••••" />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500">
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button type="submit" disabled={isLoading} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl transition-all">
            {isLoading ? "Memproses..." : "Daftarkan Akun Baru"}
          </button>
        </form>
      </motion.div>
    </div>
  );
}