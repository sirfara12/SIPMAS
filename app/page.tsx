"use client";

import { motion, Variants } from "framer-motion";
import { ArrowRight, FileText, Search, ShieldCheck, Clock, CheckCircle } from "lucide-react";

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
            <Link href="/lacak" className="text-slate-600 hover:text-blue-600 font-medium transition">Lacak Tiket</Link>
            <Link href="/login" className="text-slate-600 hover:text-blue-600 font-medium transition">Masuk</Link>
            
            {/* SESUAI SKPL 6.1: Alamat href diubah dari "/daftar" menjadi "/register" */}
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
            Sistem Informasi Pengaduan Masyarakat (SIPMAS). Sampaikan aspirasi, laporan infrastruktur, dan keluhan layanan publik dengan transparan, mudah, dan cepat terhubung langsung ke admin kelurahan[cite: 31, 36, 38].
          </motion.p>
          
          <motion.div variants={fadeIn} className="flex flex-col sm:flex-row justify-center items-center gap-4">
            {/* SESUAI SKPL 6.1: Tombol diarahkan ke form multi-step /pengaduan/baru */}
            <Link href="/pengaduan/baru" className="w-full sm:w-auto flex items-center justify-center gap-2 bg-blue-600 text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-blue-700 hover:shadow-xl hover:shadow-blue-200 transition-all transform hover:-translate-y-1">
              <FileText className="w-5 h-5" />
              Ajukan Pengaduan
            </Link>
            {/* SESUAI SKPL 6.1: Fitur lacak publik tanpa login */}
            <Link href="/lacak" className="w-full sm:w-auto flex items-center justify-center gap-2 bg-white text-slate-700 border-2 border-slate-200 px-8 py-4 rounded-full font-bold text-lg hover:border-blue-600 hover:text-blue-600 transition-all">
              <Search className="w-5 h-5" />
              Lacak Status Tiket
            </Link>
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
              { icon: Clock, title: "Cepat & Responsif", desc: "Laporan langsung masuk ke dashboard admin Kelurahan tanpa perantara, memangkas waktu birokrasi[cite: 15, 38]." },
              { icon: Search, title: "Transparan & Terlacak", desc: "Dapatkan nomor tiket untuk memantau apakah laporan Anda sedang diverifikasi, diproses, atau selesai[cite: 20, 67]." },
              { icon: CheckCircle, title: "Tindak Lanjut Pasti", desc: "Setiap laporan mendapatkan prioritas penanganan dan riwayat penyelesaian yang bisa dinilai[cite: 69, 74]." }
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

      {/* ---------------- PANDUAN SINGKAT (FLOW UC-01 s/d UC-07) ---------------- */}
      <section className="py-24 bg-slate-900 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600 rounded-full blur-[100px] opacity-20 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-600 rounded-full blur-[100px] opacity-20 pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-20">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">4 Langkah Mudah Melapor</h2>
            <p className="text-slate-400 text-lg">Proses terstruktur sesuai diagram alur untuk memastikan laporan Anda terselesaikan[cite: 91].</p>
          </div>

          <div className="grid md:grid-cols-4 gap-12 md:gap-8">
            {[
              { step: "01", title: "Daftar / Masuk", desc: "Buat akun warga resmi menggunakan data diri Anda untuk mulai melaporkan[cite: 58, 91]." },
              { step: "02", title: "Tulis Laporan", desc: "Isi form dengan detail kejadian, lokasi, serta lampirkan bukti foto (maks 5 file)[cite: 65, 91]." },
              { step: "03", title: "Pantau Proses", desc: "Lacak perkembangan laporan Anda secara real-time dengan nomor tiket unik[cite: 65, 67, 91]." },
              { step: "04", title: "Selesai & Rating", desc: "Admin menindaklanjuti laporan hingga selesai, dan Anda dapat memberikan ulasan kepuasan[cite: 69, 93]." }
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
      <footer className="bg-slate-950 text-slate-500 py-8 text-center border-t border-slate-900">
        <p className="text-sm">
          &copy; {new Date().getFullYear()} Sistem Informasi Pengaduan Masyarakat (SIPMAS) <br />
          Kelurahan Ngemplakrejo. AzharArsa [cite: 6]
        </p>
      </footer>

    </div>
  );
}