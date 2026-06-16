"use client";

import React, { useState } from "react";
import { motion, Variants } from "framer-motion";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic"; // Digunakan untuk load komponen peta tanpa SSR
import { auth, db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { 
  ArrowLeft, 
  Send, 
  Camera, 
  MapPin, 
  FileText, 
  Layers, 
  X,
  ShieldCheck
} from "lucide-react";
import toast from "react-hot-toast";

// Load MapPicker secara dinamis agar aman dari error server-side window object
const MapPicker = dynamic(() => import("./MapPicker"), {
  ssr: false,
  loading: () => (
    <div className="h-64 w-full bg-slate-100 rounded-2xl border border-slate-200 flex items-center justify-center">
      <p className="text-slate-400 text-xs font-semibold animate-pulse">Menyiapkan peta interaktif...</p>
    </div>
  ),
});

export default function NewComplaintPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    category: "",
    location: "",
    description: "",
  });
  
  // State koordinat peta pendukung untuk dashboard petugas kelurahan nantinya
  const [coordinates, setCoordinates] = useState({ latitude: -7.6325, longitude: 112.9152 });
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const categories = [
    "Infrastruktur & Jalan",
    "Sanitasi & Kebersihan",
    "Layanan Publik & Administrasi",
    "Keamanan & Ketertiban",
    "Kesehatan & Sosial",
  ];

  const fadeIn: Variants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
  };

  const staggerContainer: Variants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.15 } }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  // Fungsi callback saat warga memilih/mengubah titik di peta
  const handleLocationFromMap = (lat: number, lng: number, address: string) => {
    setCoordinates({ latitude: lat, longitude: lng });
    setFormData((prev) => ({ ...prev, location: address }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error("Ukuran foto terlalu besar! Maksimal berkas adalah 2MB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const user = auth.currentUser;
    if (!user) {
      toast.error("Sesi Anda telah habis, silakan masuk kembali.");
      router.push("/login");
      return;
    }

    if (!formData.category) {
      toast.error("Silakan tentukan kategori pengaduan Anda!");
      return;
    }

    setIsLoading(true);

    try {
      const randomTicketId = `TKT-${Math.floor(1000 + Math.random() * 9000)}`;

      // Menyimpan data pengaduan lengkap ke Cloud Firestore
      await addDoc(collection(db, "complaints"), {
        ticketId: randomTicketId,
        uid: user.uid,
        reporterEmail: user.email,
        title: formData.title,
        category: formData.category,
        location: formData.location,
        latitude: coordinates.latitude,  // Koordinat Lat disimpan
        longitude: coordinates.longitude, // Koordinat Lng disimpan
        description: formData.description,
        imageUrl: imagePreview || "",
        status: "Belum Diproses",
        createdAt: serverTimestamp(),
      });

      toast.success(`Pengaduan berhasil dikirim! ID Tiket: ${randomTicketId}`);
      
      // DIARAHKAN KEMBALI KE DASHBOARD WARGA SESUAI ALUR KETENTUAN
      router.push("/dashboard"); 
      router.refresh();
    } catch (error: any) {
      console.error(error);
      toast.error("Gagal mengirimkan laporan. Silakan coba lagi.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 relative">
      
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-96 -z-10 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[150%] rounded-full bg-blue-100/40 blur-3xl"></div>
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[130%] rounded-full bg-indigo-100/30 blur-3xl"></div>
      </div>

      <div className="max-w-3xl mx-auto pt-10 pb-24 px-4 sm:px-6 lg:px-8">
        
        <button 
          onClick={() => router.push("/dashboard")}
          className="flex items-center gap-2 text-slate-500 hover:text-blue-600 mb-8 transition-all group text-sm font-semibold bg-white px-4 py-2 rounded-full border border-slate-100 shadow-sm"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-all" />
          Kembali ke Dashboard Warga
        </button>

        <motion.div initial="hidden" animate="visible" variants={staggerContainer} className="space-y-8">
          
          <motion.div variants={fadeIn} className="text-center sm:text-left flex flex-col sm:flex-row items-center gap-4 border-b border-slate-200/60 pb-6">
            <div className="bg-blue-600 p-3 rounded-2xl shadow-lg shadow-blue-200">
              <ShieldCheck className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight leading-tight">
                Buat <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Laporan Baru</span>
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                Gunakan peta interaktif di bawah untuk menentukan lokasi kerusakan fasilitas umum secara presisi.
              </p>
            </div>
          </motion.div>

          <motion.div variants={fadeIn} className="bg-white border border-slate-100 rounded-3xl p-6 sm:p-10 shadow-xl shadow-slate-200/50 backdrop-blur-md">
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* INPUT: JUDUL PENGADUAN */}
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase mb-2 block tracking-wider flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-600" /> Judul Pengaduan / Keluhan
                </label>
                <input
                  type="text"
                  name="title"
                  required
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="Contoh: Jalan Berlubang Parah Dekat Tikungan"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-slate-800 text-sm focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-100 outline-none transition-all font-medium"
                />
              </div>

              {/* INPUT: KATEGORI LAPORAN */}
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase mb-2 block tracking-wider flex items-center gap-2">
                  <Layers className="w-4 h-4 text-indigo-600" /> Kategori Masalah
                </label>
                <div className="relative">
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-slate-800 text-sm focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-100 outline-none transition-all cursor-pointer font-medium appearance-none"
                  >
                    <option value="" disabled>-- Pilih Kategori Masalah Fasilitas --</option>
                    {categories.map((cat, idx) => (
                      <option key={idx} value={cat}>{cat}</option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-slate-400 text-xs">▼</div>
                </div>
              </div>

              {/* INPUT: INTEGRASI PETA MAPS */}
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase mb-2 block tracking-wider flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-rose-600" /> Tentukan Lokasi di Peta
                </label>
                <p className="text-[11px] text-slate-400 mb-2 font-medium">
                  *Klik atau ketuk pada peta untuk menggeser pin ke titik lokasi kejadian yang tepat.
                </p>
                
                {/* PEMANGGILAN KOMPONEN PETA */}
                <MapPicker onLocationSelect={handleLocationFromMap} />
              </div>

              {/* INPUT: HASIL TEKS ALAMAT OTOMATIS */}
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase mb-2 block tracking-wider flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-slate-500" /> Deskripsi Alamat / Detail Tambahan
                </label>
                <input
                  type="text"
                  name="location"
                  required
                  value={formData.location}
                  onChange={handleChange}
                  placeholder="Nama jalan atau patokan tambahan (contoh: Depan Toko Berkah RT 02)"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-slate-800 text-sm focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-100 outline-none transition-all font-medium"
                />
              </div>

              {/* INPUT: DESKRIPSI KELUHAN */}
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase mb-2 block tracking-wider flex items-center gap-2">
                  <FileText className="w-4 h-4 text-amber-600" /> Deskripsi Kronologi Lengkap
                </label>
                <textarea
                  name="description"
                  required
                  rows={4}
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Ceritakan secara rinci mengenai kerusakan fasilitas umum yang terjadi..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-slate-800 text-sm focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-100 outline-none transition-all resize-none leading-relaxed font-medium"
                />
              </div>

              {/* INPUT: UNGGAH FOTO BUKTI */}
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase mb-2 block tracking-wider flex items-center gap-2">
                  <Camera className="w-4 h-4 text-emerald-600" /> Lampiran Dokumentasi Foto Bukti Fisik
                </label>
                
                {!imagePreview ? (
                  <div className="relative border-2 border-dashed border-slate-200 hover:border-blue-400 hover:bg-blue-50/10 rounded-2xl p-6 transition-all bg-slate-50/50 text-center flex flex-col items-center justify-center group cursor-pointer">
                    <input type="file" accept="image/*" onChange={handleImageChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                    <div className="bg-white border border-slate-200/80 p-2.5 rounded-xl text-slate-400 group-hover:text-blue-600 shadow-sm mb-2"><Camera className="w-5 h-5" /></div>
                    <span className="text-xs font-bold text-slate-700 block mb-0.5">Pilih File Berkas Gambar</span>
                    <span className="text-[11px] text-slate-400 font-medium">Format dokumen JPG, PNG maksimal 2MB</span>
                  </div>
                ) : (
                  <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 max-h-64 flex justify-center items-center shadow-inner">
                    <img src={imagePreview} alt="Preview" className="max-h-64 object-contain" />
                    <button type="button" onClick={() => setImagePreview(null)} className="absolute top-3 right-3 bg-red-600 text-white p-2 rounded-xl border border-red-500 hover:bg-red-500 shadow-lg"><X className="w-4 h-4" /></button>
                  </div>
                )}
              </div>

              {/* TOMBOL SUBMIT PENGADUAN */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-full transition-all flex items-center justify-center gap-2 mt-6 disabled:opacity-50 text-sm shadow-lg shadow-blue-200 active:scale-95"
              >
                {isLoading ? "Sedang Memproses Laporan Anda..." : <><Send className="w-4 h-4" /> Kirim Pengaduan Sekarang</>}
              </button>

            </form>
          </motion.div>
        </motion.div>

      </div>
    </div>
  );
}