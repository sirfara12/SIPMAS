"use client";

import { motion, Variants } from "framer-motion";
import { ArrowRight, Search, ShieldCheck, Clock, CheckCircle, Lock } from "lucide-react";

// Komponen Link kustom untuk menghindari kendala resolusi modul kompilasi
const Link = ({ href, children, className, ...props }: { href: string; children: React.ReactNode; className?: string; [key: string]: any }) => {
  return (
    <a href={href} className={className} {...props}>
      {children}
    </a>
  );
};

export default function LandingPage() {
  // Animasi untuk memunculkan elemen ke atas dengan transisi halus
  const fadeIn: Variants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
  };

  // Animasi beruntun (stagger) untuk elemen turunan
  const staggerContainer: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.2 }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-blue-200">
      
      {/* ---------------- NAVBAR ---------------- */}
      <nav className="bg-white/80 backdrop-blur-md shadow-sm fixed w-full top-0 z-50 border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer">
            <div className="bg-blue-600 p-1.5 rounded-lg">
              <ShieldCheck className="h-6 w-6 text-white" />
            </div>
            <span className="font-bold text-xl text-slate-800 tracking-tight">SIPMAS-KELURAHAN NGEMPLAKREJO</span>
          </div>
          <div className="hidden md:flex items-center gap-6">
            
            {/* Tombol Masuk Khusus Warga */}
            <Link href="/login" className="text-slate-600 hover:text-blue-600 font-medium transition">Masuk</Link>
            
            <Link href="/register" className="bg-blue-600 text-white px-5 py-2 rounded-full font-medium hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-200 transition-all active:scale-95">
              Daftar Sekarang
            </Link>
          </div>
        </div>
      </nav>

      {/* ---------------- HERO SECTION ---------------- */}
      <section className="relative pt-32 pb-20 lg:pt-40 lg:pb-28 overflow-hidden">
        {/* Dekorasi Background */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10 pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[50%] rounded-full bg-blue-100/50 blur-3xl"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[50%] rounded-full bg-indigo-100/50 blur-3xl"></div>
        </div>

        <motion.div 
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
          className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center"
        >
          <motion.div variants={fadeIn} className="inline-block mb-4 px-4 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-blue-600 font-semibold text-sm">
            🚀 Layanan Resmi Kelurahan Ngemplakrejo
          </motion.div>
          
          <motion.h1 variants={fadeIn} className="text-5xl md:text-6xl lg:text-7xl font-extrabold text-slate-900 tracking-tight mb-8 leading-tight">
            Suara Anda Membangun <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
              Lingkungan Kita
            </span>
          </motion.h1>
          
          <motion.p variants={fadeIn} className="text-lg md:text-xl text-slate-600 mb-12 max-w-2xl mx-auto leading-relaxed">
            Sistem Informasi Pengaduan Masyarakat (SIPMAS). Sampaikan aspirasi, laporan infrastruktur, dan keluhan layanan publik dengan transparan, mudah, dan cepat terhubung langsung ke admin kelurahan.
          </motion.p>
          
          {/* PENGGANTI TOMBOL: Panel Informasi Statistik Pengaduan (Bukan Tombol) */}
          <motion.div 
            variants={fadeIn} 
            className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-3xl mx-auto mt-6 bg-white p-6 rounded-2xl shadow-md border border-slate-100"
          >
            <div className="flex flex-col items-center p-2">
              <span className="text-3xl font-extrabold text-blue-600">24 Jam</span>
              <span className="text-sm font-semibold text-slate-500 mt-1">Sistem Siaga Menerima Laporan</span>
            </div>
            <div className="flex flex-col items-center p-2 border-y sm:border-y-0 sm:border-x border-slate-100">
              <span className="text-3xl font-extrabold text-indigo-600">&lt; 500ms</span>
              <span className="text-sm font-semibold text-slate-500 mt-1">Waktu Respons Akses Sistem</span>
            </div>
            <div className="flex flex-col items-center p-2">
              <span className="text-3xl font-extrabold text-emerald-600">100%</span>
              <span className="text-sm font-semibold text-slate-500 mt-1">Transparansi Alur Proses Tiket</span>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* ---------------- INFO LAYANAN ---------------- */}
      <section className="py-24 bg-white relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Mengapa Menggunakan SIPMAS?</h2>
            <div className="w-20 h-1.5 bg-blue-600 mx-auto rounded-full"></div>
          </div>
          
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="grid md:grid-cols-3 gap-8"
          >
            {[
              { icon: Clock, title: "Cepat & Responsif", desc: "Laporan langsung masuk ke dashboard admin Kelurahan tanpa perantara, memangkas waktu birokrasi." },
              { icon: Search, title: "Transparan & Terlacak", desc: "Dapatkan nomor tiket untuk memantau apakah laporan Anda sedang diverifikasi, diproses, atau selesai." },
              { icon: CheckCircle, title: "Tindak Lanjut Pasti", desc: "Setiap laporan mendapatkan prioritas penanganan dan riwayat penyelesaian yang bisa dinilai." }
            ].map((item, idx) => (
              <motion.div key={idx} variants={fadeIn} className="p-8 rounded-3xl bg-slate-50 border border-slate-100 hover:border-blue-100 hover:shadow-2xl hover:shadow-blue-50 transition-all duration-300 group">
                <div className="w-16 h-16 bg-white border border-slate-100 shadow-sm rounded-2xl flex items-center justify-center text-blue-600 mb-6 group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
                  <item.icon className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">{item.title}</h3>
                <p className="text-slate-600 leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ---------------- PANDUAN SINGKAT ---------------- */}
      <section className="py-24 bg-slate-900 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600 rounded-full blur-[100px] opacity-20 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-600 rounded-full blur-[100px] opacity-20 pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-20">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">4 Langkah Mudah Melapor</h2>
            <p className="text-slate-400 text-lg">Proses terstruktur sesuai diagram alur untuk memastikan laporan Anda terselesaikan.</p>
          </div>

          <div className="grid md:grid-cols-4 gap-12 md:gap-8">
            {[
              { step: "01", title: "Daftar / Masuk", desc: "Buat akun warga resmi menggunakan data diri Anda untuk mulai melaporkan." },
              { step: "02", title: "Tulis Laporan", desc: "Isi form dengan detail kejadian, lokasi, serta lampirkan bukti foto (maks 5 file)." },
              { step: "03", title: "Pantau Proses", desc: "Lacak perkembangan laporan Anda secara real-time dengan nomor tiket unik." },
              { step: "04", title: "Selesai", desc: "Admin menindaklanjuti laporan hingga selesai." }
            ].map((item, idx) => (
              <div key={idx} className="relative text-center group">
                {idx !== 3 && <div className="hidden md:block absolute top-10 left-[60%] w-[80%] h-[2px] bg-gradient-to-r from-blue-500/50 to-transparent"></div>}
                
                <div className="w-20 h-20 bg-slate-800 border-2 border-slate-700 group-hover:border-blue-500 rounded-2xl flex items-center justify-center text-3xl font-extrabold mx-auto mb-6 relative z-10 transition-all duration-300 group-hover:-translate-y-2 shadow-xl">
                  <span className="bg-clip-text text-transparent bg-gradient-to-br from-blue-400 to-indigo-400">
                    {item.step}
                  </span>
                </div>
                <h3 className="text-xl font-bold mb-3">{item.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------- FOOTER ---------------- */}
      <footer className="bg-slate-950 text-slate-500 py-10 text-center border-t border-slate-900">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4 mb-4">
          <p className="text-xs sm:text-sm text-left">
            &copy; {new Date().getFullYear()} Sistem Informasi Pengaduan Masyarakat (SIPMAS) <br />
            Kelurahan Ngemplakrejo. AzharArsa
          </p>
          
          {/* LINK DISKRIT LOGIN ADMIN (Sesuai Bab 6.2 SKPL) */}
          <Link 
            href="/admin/login" 
            className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-indigo-400 font-semibold bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800/60 transition"
          >
            <Lock className="w-3 h-3" /> Portal Internal Petugas
          </Link>
        </div>
      </footer>

    </div>
  );
}