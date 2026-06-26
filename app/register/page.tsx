"use client";

import React, { useState } from "react";
import { auth, db } from "@/lib/firebase";
import { createUserWithEmailAndPassword, sendEmailVerification, signOut } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Mail, Lock, Eye, EyeOff, ShieldCheck, User, Phone, FileText, UserPlus } from "lucide-react";
import toast from "react-hot-toast";

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
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Validasi F-02: Kekuatan Kata Sandi (Minimal 8 Karakter)
    if (formData.password.length < 8) {
      toast.error("Kata sandi harus minimal 8 karakter!");
      setIsLoading(false);
      return;
    }

    try {
      // 1. Daftarkan akun ke Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );
      const user = userCredential.user;

      // 2. Kirim email verifikasi (Kebutuhan F-03)
      await sendEmailVerification(user);

      // 3. Simpan data profil tambahan ke Firestore koleksi 'users'
      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        nik: formData.nik || null, // NIK Opsional (F-01)
        role: "masyarakat", // Default role untuk registrasi publik
        createdAt: new Date().toISOString(),
      });

      // 4. Paksa Sign Out setelah register agar sesi login otomatis Firebase dibersihkan
      await signOut(auth);

      toast.success("Registrasi berhasil! Silakan cek email Anda untuk verifikasi.");
      
      // Kosongkan form
      setFormData({ name: "", nik: "", phone: "", email: "", password: "" });
      
      // Alihkan ke halaman login setelah 2 detik
      setTimeout(() => {
        router.push("/login");
      }, 2000);

    } catch (err: any) {
      console.error(err);
      if (err.code === "auth/email-already-in-use") {
        toast.error("Email sudah digunakan oleh akun lain! (F-04)");
      } else if (err.code === "permission-denied") {
        toast.error("Gagal menyimpan data. Periksa kembali Rules Firestore Anda!");
      } else {
        toast.error(err.message || "Terjadi kesalahan saat mendaftar.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0f19] flex items-center justify-center p-4 py-12">
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

        <h1 className="text-2xl font-bold text-white text-center mb-2">SIPMAS KELURAHAN NGEMPLAKREJO</h1>
        <p className="text-slate-400 text-center text-sm mb-8">Registrasi Akun Masyarakat Kelurahan Ngemplakrejo</p>

        <form onSubmit={handleRegister} className="space-y-4">
          
          {/* Input Nama Lengkap */}
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase mb-1.5 block">Nama Lengkap *</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
              <input
                type="text"
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
                className="w-full bg-slate-950/80 border border-slate-800 rounded-xl py-3 pl-11 pr-4 text-white text-sm focus:border-blue-500 outline-none transition-all"
                placeholder="Masukkan nama sesuai KTP"
              />
            </div>
          </div>

          {/* Input NIK (Opsional) */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase block">NIK</label>
              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Opsional</span>
            </div>
            <div className="relative">
              <FileText className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
              <input
                type="text"
                name="nik"
                value={formData.nik}
                onChange={handleChange}
                className="w-full bg-slate-950/80 border border-slate-800 rounded-xl py-3 pl-11 pr-4 text-white text-sm focus:border-blue-500 outline-none transition-all"
                placeholder="16 digit nomor NIK"
              />
            </div>
          </div>

          {/* Input Nomor HP / WhatsApp */}
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase mb-1.5 block">Nomor HP / WhatsApp *</label>
            <div className="relative">
              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
              <input
                type="tel"
                name="phone"
                required
                value={formData.phone}
                onChange={handleChange}
                className="w-full bg-slate-950/80 border border-slate-800 rounded-xl py-3 pl-11 pr-4 text-white text-sm focus:border-blue-500 outline-none transition-all"
                placeholder="Contoh: 08123456789"
              />
            </div>
          </div>

          {/* Input Email */}
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase mb-1.5 block">Email *</label>
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
            <label className="text-xs font-bold text-slate-400 uppercase mb-1.5 block">Kata Sandi *</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                required
                value={formData.password}
                onChange={handleChange}
                className="w-full bg-slate-950/80 border border-slate-800 rounded-xl py-3 pl-11 pr-11 text-white text-sm focus:border-blue-500 outline-none transition-all"
                placeholder="•••••••• (Min. 8 Karakter)"
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

          {/* Tombol Submit */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 mt-6 disabled:opacity-50"
          >
            {isLoading ? "Memproses..." : <><UserPlus className="w-4 h-4" /> Daftar Akun</>}
          </button>
        </form>

        {/* Link Kembali ke Login */}
        <div className="mt-6 text-center text-sm text-slate-500">
          Sudah punya akun?{" "}
          <a href="/login" className="text-blue-400 font-semibold hover:underline">Masuk di sini</a>
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