"use client";

import React, { useEffect, useState } from "react";
import { motion, Variants } from "framer-motion";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { signOut, onAuthStateChanged } from "firebase/auth";
import { collection, query, where, orderBy, onSnapshot, doc, getDoc } from "firebase/firestore";
import { 
  PlusCircle, 
  FileText, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  LogOut, 
  User, 
  ShieldCheck,
  ChevronRight,
  MapPin
} from "lucide-react";
import toast from "react-hot-toast";

interface Complaint {
  id: string;
  ticketId: string;
  title: string;
  category: string;
  location: string;
  status: string;
  createdAt: any;
}

export default function DashboardWarga() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);

  // Animasi yang diselaraskan dengan Halaman Landing
  const fadeIn: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
  };

  const staggerContainer: Variants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  useEffect(() => {
    // 1. Memantau Sesi Login Pengguna
    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        router.push("/login");
        return;
      }
      setUser(currentUser);

      // 2. Mengambil Detail Profil Nama Warga dari Firestore
      try {
        const docRef = doc(db, "users", currentUser.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setProfile(docSnap.data());
        }
      } catch (err) {
        console.error("Gagal mengambil data profil:", err);
      }

      // 3. Mengambil Data Riwayat Pengaduan Milik Warga Secara Real-time
      const q = query(
        collection(db, "complaints"),
        where("uid", "==", currentUser.uid),
        orderBy("createdAt", "desc")
      );

      const unsubscribeSnapshot = onSnapshot(q, (snapshot) => {
        const list: Complaint[] = [];
        snapshot.forEach((doc) => {
          list.push({ id: doc.id, ...doc.data() } as Complaint);
        });
        setComplaints(list);
        setLoading(false);
      }, (error) => {
        console.error("Error Firestore Snapshot:", error);
        setLoading(false);
      });

      return () => unsubscribeSnapshot();
    });

    return () => unsubscribeAuth();
  }, [router]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast.success("Berhasil keluar dari akun.");
      router.push("/login");
    } catch (error) {
      toast.error("Gagal melakukan keluar sistem.");
    }
  };

  // Fungsi pembantu untuk mewarnai badge status aduan
  const getStatusStyle = (status: string) => {
    switch (status) {
      case "Diselesaikan": // Diubah dari "Selesai" menjadi "Diselesaikan"
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "Sedang Diproses":
      case "Diproses": // Menangani jika di database hanya tertulis "Diproses"
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "Diverifikasi":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "Ditolak":
        return "bg-rose-50 text-rose-700 border-rose-200";
      default:
        return "bg-slate-100 text-slate-600 border-slate-200"; // Menunggu Verifikasi / Diterima
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800">
      
      {/* ---------------- NAVBAR DASHBOARD ---------------- */}
      <nav className="bg-white/80 backdrop-blur-md shadow-sm fixed w-full top-0 z-50 border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 p-1.5 rounded-lg shadow-md shadow-blue-200">
              <ShieldCheck className="h-5 w-5 text-white" />
            </div>
            <span className="font-bold text-base sm:text-lg text-slate-800 tracking-tight hidden sm:block">
              SIPMAS-KELURAHAN NGEMPLAKREJO
            </span>
            <span className="font-bold text-base text-slate-800 tracking-tight sm:hidden">
              SIPMAS NK
            </span>
          </div>
          
          <button 
            onClick={handleLogout}
            className="flex items-center gap-2 text-rose-600 hover:bg-rose-50 px-4 py-2 rounded-full text-sm font-semibold border border-transparent hover:border-rose-100 transition-all active:scale-95"
          >
            <LogOut className="w-4 h-4" />
            Keluar
          </button>
        </div>
      </nav>

      {/* ---------------- DEKORASI LATAR BELAKANG ---------------- */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-80 -z-10 pointer-events-none overflow-hidden">
        <div className="absolute top-[-30%] left-[-10%] w-[50%] h-[150%] rounded-full bg-blue-100/40 blur-3xl"></div>
        <div className="absolute top-[-20%] right-[-10%] w-[45%] h-[130%] rounded-full bg-indigo-100/30 blur-3xl"></div>
      </div>

      {/* ---------------- KONTEN UTAMA ---------------- */}
      <main className="max-w-7xl mx-auto pt-28 pb-20 px-4 sm:px-6 lg:px-8">
        
        {/* SALAM PEMBUKA / HEADER */}
        <div className="mb-10 text-center sm:text-left">
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Selamat Datang,{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
              {profile?.name || user?.email?.split("@")[0]}
            </span> 👋
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Pantau rincian tiket pengaduan atau ajukan aspirasi perbaikan fasilitas lingkungan Anda di sini.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8 items-start">
          
          {/* KOLOM KIRI: KARTU AJUKAN PENGADUAN BARU */}
          <div className="lg:col-span-1 space-y-6">
            <motion.div 
              initial="hidden"
              animate="visible"
              variants={fadeIn}
              onClick={() => router.push("/dashboard/pengaduan/baru")}
              className="bg-gradient-to-br from-blue-600 to-indigo-600 text-white p-8 rounded-3xl shadow-xl shadow-blue-600/20 cursor-pointer group hover:shadow-2xl hover:shadow-blue-600/30 transition-all duration-300 relative overflow-hidden transform hover:-translate-y-1"
            >
              {/* Efek Lingkaran Abstrak */}
              <div className="absolute -right-10 -bottom-10 w-32 h-32 bg-white/10 rounded-full blur-xl group-hover:scale-125 transition-all"></div>
              
              <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-all">
                <PlusCircle className="w-6 h-6 text-white" />
              </div>
              
              <h3 className="text-xl font-bold mb-2 flex items-center gap-2">
                Ajukan Pengaduan Baru 
                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-all" />
              </h3>
              <p className="text-blue-100 text-xs sm:text-sm leading-relaxed">
                Laporkan masalah kerusakan jalan, lampu mati, gangguan ketertiban, atau pelayanan umum warga sekarang untuk ditindaklanjuti.
              </p>
            </motion.div>

            {/* KARTU INFORMASI PROFIL RINGKAS */}
            <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm flex items-center gap-4">
              <div className="bg-slate-100 p-3 rounded-2xl text-slate-600">
                <User className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">ID Anggota Resmi</span>
                <span className="text-sm font-semibold text-slate-700 truncate block max-w-[200px]">{user?.email}</span>
              </div>
            </div>
          </div>

          {/* KOLOM KANAN: TABEL / DAFTAR RIWAYAT PENGADUAN */}
          <div className="lg:col-span-2">
            <div className="bg-white border border-slate-100 rounded-3xl p-6 sm:p-8 shadow-xl shadow-slate-200/40">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-600" /> Riwayat Laporan Anda
                </h3>
                <span className="bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-xs font-bold border border-blue-100">
                  {complaints.length} Total
                </span>
              </div>

              {/* JIKA BELUM ADA LAPORAN */}
              {complaints.length === 0 ? (
                <motion.div 
                  initial="hidden"
                  animate="visible"
                  variants={fadeIn}
                  className="text-center py-12 border-2 border-dashed border-slate-100 rounded-2xl"
                >
                  <AlertCircle className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500 font-medium text-sm">Belum ada riwayat pengaduan yang dikirim.</p>
                  <p className="text-slate-400 text-xs mt-1">Gunakan kartu di sebelah kiri untuk mengirim aduan pertama Anda.</p>
                </motion.div>
              ) : (
                // JIKA ADA LAPORAN (MENAMPILKAN DAFTAR CARD)
                <motion.div 
                  initial="hidden"
                  animate="visible"
                  variants={staggerContainer}
                  className="space-y-4"
                >
                  {complaints.map((item) => (
                    <motion.div
                      key={item.id}
                      variants={fadeIn}
                      onClick={() => router.push(`/dashboard/pengaduan/${item.id}`)}
                      className="p-5 border border-slate-100 hover:border-blue-200 rounded-2xl bg-slate-50/50 hover:bg-white transition-all duration-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 group cursor-pointer"
                    >
                      <div className="space-y-1.5 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-xs font-bold text-blue-600 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded">
                            {item.ticketId}
                          </span>
                          <span className="text-xs text-slate-400 font-medium">
                            {item.category}
                          </span>
                        </div>
                        <h4 className="font-bold text-slate-800 text-base group-hover:text-blue-600 transition-colors">
                          {item.title}
                        </h4>
                        <p className="text-xs text-slate-500 flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-rose-500" /> {item.location}
                        </p>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end border-t sm:border-t-0 border-slate-100 pt-3 sm:pt-0 gap-3 shrink-0">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusStyle(item.status)}`}>
                          {item.status}
                        </span>
                        {/* Menambahkan icon penunjuk agar pengguna tahu card ini bisa diklik */}
                        <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all hidden sm:block" />
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              )}

            </div>
          </div>

        </div>
      </main>
    </div>
  );
}