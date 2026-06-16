"use client";

import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { motion, Variants } from "framer-motion";
import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  CheckCircle,
  Clock,
  FileText,
  MapPin,
  ShieldCheck,
  Tag
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

interface ComplaintDetail {
  id: string;
  ticketId: string;
  title: string;
  description: string;
  category: string;
  location: string;
  status: string;
  createdAt: any;
  attachmentUrl?: string;
  adminNotes?: string;
}

export default function DetailPengaduanWarga() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [complaint, setComplaint] = useState<ComplaintDetail | null>(null);

  const fadeIn: Variants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
  };

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        router.push("/login");
        return;
      }

      if (!id) return;

      try {
        // Ambil dokumen spesifik berdasarkan ID aduan dari parameter URL
        const docRef = doc(db, "complaints", id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          // Proteksi Keamanan: Warga hanya bisa melihat laporan miliknya sendiri
          if (data.uid !== currentUser.uid) {
            toast.error("Anda tidak memiliki hak akses ke laporan ini.");
            router.push("/dashboard");
            return;
          }
          setComplaint({ id: docSnap.id, ...data } as ComplaintDetail);
        } else {
          toast.error("Data laporan tidak ditemukan.");
          router.push("/dashboard");
        }
      } catch (error) {
        console.error("Gagal memuat rincian laporan:", error);
        toast.error("Terjadi kesalahan sistem saat memuat data.");
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, [id, router]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Selesai":         // Menangani jika di database tertulis "Selesai"
      case "Diselesaikan":    // Menangani jika di database tertulis "Diselesaikan" 
        return (
          <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-4 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5">
            <CheckCircle className="w-4 h-4" /> Selesai
          </span>
        );
      case "Sedang Diproses":
      case "Diproses":        // Menangani jika di database tertulis "Diproses" [cite: 93]
        return (
          <span className="bg-amber-50 text-amber-700 border border-amber-200 px-4 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5">
            <Clock className="w-4 h-4" /> Sedang Diproses
          </span>
        );
      case "Diverifikasi":
        return (
          <span className="bg-blue-50 text-blue-700 border border-blue-200 px-4 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5">
            <Clock className="w-4 h-4" /> Terverifikasi
          </span>
         );
      case "Ditolak":
        return (
          <span className="bg-rose-50 text-rose-700 border border-rose-200 px-4 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5">
            <AlertCircle className="w-4 h-4" /> Laporan Ditolak
          </span>
        );
      default:
        return (
          <span className="bg-slate-100 text-slate-600 border border-slate-200 px-4 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5">
            <AlertCircle className="w-4 h-4" /> Menunggu Verifikasi
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!complaint) return null;

  // Format Tanggal Firebase Timestamp ke format lokal Indonesia
  const formattedDate = complaint.createdAt?.seconds 
    ? new Date(complaint.createdAt.seconds * 1000).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      })
    : "-";

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 pt-24 pb-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        
        {/* Tombol Kembali ke Halaman Utama Dashboard */}
        <button 
          onClick={() => router.push("/dashboard")}
          className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-blue-600 transition-colors mb-6 group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          Kembali ke Dashboard
        </button>

        <motion.div 
          initial="hidden" 
          animate="visible" 
          variants={fadeIn}
          className="space-y-6"
        >
          {/* BAGIAN UTAMA CARD DETAIL */}
          <div className="bg-white border border-slate-100 rounded-3xl p-6 sm:p-8 shadow-xl shadow-slate-200/40">
            
            {/* Header Tiket Laporan */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-6">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-blue-600 bg-blue-50 border border-blue-100 px-2.5 py-0.5 rounded">
                    {complaint.ticketId}
                  </span>
                  {getStatusBadge(complaint.status)}
                </div>
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-2">
                  {complaint.title}
                </h1>
              </div>
            </div>

            {/* Grid Informasi Atribut Metadata */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50/50 p-4 rounded-2xl border border-slate-100 mt-6 text-sm">
              <div className="flex items-center gap-2.5 text-slate-600">
                <Tag className="w-4 h-4 text-blue-500 shrink-0" />
                <span>Kategori: <strong className="text-slate-800">{complaint.category}</strong></span>
              </div>
              <div className="flex items-center gap-2.5 text-slate-600">
                <Calendar className="w-4 h-4 text-blue-500 shrink-0" />
                <span>Waktu Kirim: <strong className="text-slate-800">{formattedDate}</strong></span>
              </div>
              <div className="flex items-center gap-2.5 text-slate-600 sm:col-span-2">
                <MapPin className="w-4 h-4 text-rose-500 shrink-0" />
                <span>Lokasi Kejadian: <strong className="text-slate-800">{complaint.location}</strong></span>
              </div>
            </div>

            {/* Isi Deskripsi Pengaduan */}
            <div className="mt-8 space-y-3">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <FileText className="w-4 h-4" /> Isi Laporan Kronologi Masalah
              </h3>
              <p className="text-slate-700 leading-relaxed text-base whitespace-pre-line bg-white border border-slate-100 p-5 rounded-2xl shadow-sm">
                {complaint.description || "Tidak ada deskripsi rincian masalah."}
              </p>
            </div>

            {/* Lampiran Lampiran Berkas Foto Bukti (Jika Ada) */}
            {complaint.attachmentUrl && (
              <div className="mt-8 space-y-3">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Foto Bukti Pendukung</h3>
                <div className="relative rounded-2xl overflow-hidden border border-slate-200 max-w-md bg-slate-100">
                  <img 
                    src={complaint.attachmentUrl} 
                    alt="Bukti Lampiran Pengaduan Kelurahan Ngemplakrejo" 
                    className="w-full h-auto object-cover max-h-72 hover:scale-105 transition-transform duration-300"
                  />
                </div>
              </div>
            )}
          </div>

          {/* BAGIAN TANGGAPAN / CATATAN PETUGAS KELURAHAN */}
          <div className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl">
            <h3 className="text-base font-bold flex items-center gap-2 border-b border-white/10 pb-4">
              <ShieldCheck className="w-5 h-5 text-blue-400" /> Tanggapan & Pemrosesan Kelurahan
            </h3>
            <div className="mt-4 space-y-2">
              {complaint.adminNotes ? (
                <div className="space-y-1">
                  <span className="text-xs text-indigo-300 font-semibold block">Catatan Resmi Petugas:</span>
                  <p className="text-slate-200 text-sm leading-relaxed whitespace-pre-line bg-white/5 p-4 rounded-xl border border-white/5">
                    {complaint.adminNotes}
                  </p>
                </div>
              ) : (
                <p className="text-sm text-slate-400 italic">
                  Laporan Anda telah sukses terekam dalam sistem kelurahan. Saat ini petugas administrasi sedang menguji dan memvalidasi laporan sebelum dilakukan tindakan fisik lapangan. Terima kasih atas partisipasi Anda.
                </p>
              )}
            </div>
          </div>

        </motion.div>
      </div>
    </div>
  );
}