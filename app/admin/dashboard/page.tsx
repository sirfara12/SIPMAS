"use client";

export const dynamic = "force-dynamic";

import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import {
  addDoc,
  collection,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { AnimatePresence, motion, Variants } from "framer-motion";
import {
  AlertCircle,
  ArrowUpDown,
  Calendar,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Clock,
  Download,
  ExternalLink,
  Eye,
  FileText,
  Filter,
  Layers,
  LogOut,
  Mail,
  MapPin,
  MessageSquare,
  Paperclip,
  RotateCcw,
  Search,
  Send,
  Sparkles,
  Star,
  User,
  XCircle
} from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";


interface Complaint {
  id: string;
  ticketId: string;
  userId: string;
  reporterName?: string;
  reporterEmail: string;
  title: string;
  category: string;
  location: string;
  latitude?: number;
  longitude?: number;
  description: string;
  attachments?: string[];
  imageUrl?: string;
  attachmentUrl?: string;
  status: "Diterima" | "Diverifikasi" | "Diproses" | "Diselesaikan" | "Ditolak";
  rating?: number;
  createdAt: any;
  updatedAt?: any;
}

interface ComplaintLog {
  complaintId: string;
  changedBy: string;
  oldStatus: string;
  newStatus: string;
  note: string;
  timestamp: any;
}

interface Comment {
  id: string;
  complaintId: string;
  userId: string;
  role: "masyarakat" | "admin";
  message: string;
  createdAt: any;
}

interface AdminUser {
  uid: string;
  email: string;
  name?: string;
  role?: string;
}

// ─────────────────────────────────────────────
// HELPER — Badge warna sesuai Bab 6.3 SKPL
// ─────────────────────────────────────────────

const getStatusBadgeStyle = (status: string) => {
  switch (status) {
    case "Diterima":     return "bg-blue-50/80 text-blue-700 border-blue-200/60 shadow-sm shadow-blue-50";
    case "Diverifikasi": return "bg-amber-50/80 text-amber-700 border-amber-200/60 shadow-sm shadow-amber-50";
    case "Diproses":     return "bg-orange-50/80 text-orange-700 border-orange-200/60 shadow-sm shadow-orange-50";
    case "Diselesaikan": return "bg-emerald-50/80 text-emerald-700 border-emerald-200/60 shadow-sm shadow-emerald-50";
    case "Ditolak":      return "bg-rose-50/80 text-rose-700 border-rose-200/60 shadow-sm shadow-rose-50";
    default:             return "bg-slate-50 text-slate-700 border-slate-200";
  }
};

const getStatusDot = (status: string) => {
  switch (status) {
    case "Diterima":     return "🔵";
    case "Diverifikasi": return "🟡";
    case "Diproses":     return "🟠";
    case "Diselesaikan": return "🟢";
    case "Ditolak":      return "🔴";
    default:             return "⚪";
  }
};

const getComplaintImages = (complaint: Complaint) => {
  if (complaint.attachments?.length) return complaint.attachments;
  if (complaint.imageUrl) return [complaint.imageUrl];
  if (complaint.attachmentUrl) return [complaint.attachmentUrl];
  return [];
};

const KATEGORI_LIST = [
  "Infrastruktur & Jalan",
  "Keamanan & Ketertiban",
  "Kebersihan & Lingkungan",
  "Kesehatan & Layanan Sosial",
  "Administrasi & Kependudukan",
  "Lainnya",
];

const STATUS_LIST = [
  "Diterima",
  "Diverifikasi",
  "Diproses",
  "Diselesaikan",
  "Ditolak",
];

// Animation presets
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } }
};

const cardHoverEffect: Variants = {
  hover: { y: -6, scale: 1.01, transition: { type: "spring" as const, stiffness: 300, damping: 20 } }
};

const fadeIn: Variants = {
  hidden:  { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
};

const modalAnim: Variants = {
  hidden:  { scale: 0.9, opacity: 0, y: 30 },
  visible: { scale: 1, opacity: 1, y: 0, transition: { type: "spring", duration: 0.4 } },
};

// ─────────────────────────────────────────────
// KOMPONEN UTAMA
// ─────────────────────────────────────────────

export default function DashboardAdmin() {
  const router = useRouter();

  // ── Auth ──
  const [adminUser, setAdminUser]   = useState<AdminUser | null>(null);
  const [adminRole, setAdminRole]   = useState<string>("admin");

  // ── Data ──
  const [complaints, setComplaints]               = useState<Complaint[]>([]);
  const [adminList, setAdminList]                 = useState<AdminUser[]>([]);
  const [loading, setLoading]                     = useState(true);

  // ── Filter & Sort (F-28, F-29, F-30) ──
  const [searchQuery, setSearchQuery]             = useState("");
  const [statusFilter, setStatusFilter]           = useState("Semua");
  const [categoryFilter, setCategoryFilter]       = useState("Semua");
  const [sortField, setSortField]                 = useState<"createdAt" | "status">("createdAt");
  const [sortDir, setSortDir]                     = useState<"asc" | "desc">("desc");

  // ── Modal Detail & Tindak Lanjut ──
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [detailedComplaint, setDetailedComplaint] = useState<Complaint | null>(null); // State Baru untuk Aksi Detail
  const [newStatusTarget, setNewStatusTarget]     = useState("");
  const [statusNote, setStatusNote]               = useState("");
  const [disposisiTarget, setDisposisiTarget]     = useState("");
  const [modalTab, setModalTab]                   = useState<"status" | "dokumen">("status");

  // ── Komentar (F-35) ──
  const [comments, setComments]                   = useState<Comment[]>([]);
  const [newComment, setNewComment]               = useState("");
  const [loadingComments, setLoadingComments]     = useState(false);

  // ── Upload Dokumentasi (F-36) ──
  const [docFile, setDocFile]                     = useState<File | null>(null);
  const [uploadingDoc, setUploadingDoc]           = useState(false);

  // ── Statistik (F-27, F-40, F-41) ──
  const [stats, setStats] = useState({
    total: 0,
    diterima: 0,
    diverifikasi: 0,
    diproses: 0,
    selesai: 0,
    ditolak: 0,
    avgRating: 0,
    avgSelesaiHari: 0,
  });

  // ─────────────────────────────────────────
  // EFFECT: Auth + Data Real-time
  // ─────────────────────────────────────────

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push("/admin/login");
        return;
      }
      try {
        const snap = await getDocs(
          query(collection(db, "users"), where("uid", "==", user.uid))
        );
        if (!snap.empty) {
          const data = snap.docs[0].data();
          setAdminRole(data.role || "admin");
          setAdminUser({ uid: user.uid, email: user.email || "", name: data.name, role: data.role });
        } else {
          setAdminUser({ uid: user.uid, email: user.email || "" });
        }
      } catch {
        setAdminUser({ uid: user.uid, email: user.email || "" });
      }
    });

    const q = query(collection(db, "complaints"), orderBy("createdAt", "desc"));
    const unsubSnap = onSnapshot(
      q,
      (snapshot) => {
        const list: Complaint[] = [];
        let diterima = 0, diverifikasi = 0, diproses = 0, selesai = 0, ditolak = 0;
        let totalRating = 0, ratingCount = 0;
        let totalSelesaiMs = 0, selesaiCount = 0;

        snapshot.forEach((docSnap) => {
          const data = docSnap.data() as Omit<Complaint, "id">;
          list.push({ ...data, id: docSnap.id });

          switch (data.status) {
            case "Diterima":     diterima++;     break;
            case "Diverifikasi": diverifikasi++; break;
            case "Diproses":     diproses++;     break;
            case "Diselesaikan":
              selesai++;
              if (data.rating) { totalRating += data.rating; ratingCount++; }
              if (data.createdAt?.toDate && data.updatedAt?.toDate) {
                totalSelesaiMs += data.updatedAt.toDate() - data.createdAt.toDate();
                selesaiCount++;
              }
              break;
            case "Ditolak": ditolak++; break;
          }
        });

        setComplaints(list);
        setStats({
          total:         list.length,
          diterima,
          diverifikasi,
          diproses,
          selesai,
          ditolak,
          avgRating:     ratingCount > 0 ? Math.round((totalRating / ratingCount) * 10) / 10 : 0,
          avgSelesaiHari: selesaiCount > 0
            ? Math.round(totalSelesaiMs / selesaiCount / 86400000 * 10) / 10
            : 0,
        });
        setLoading(false);
      },
      (err) => {
        console.error(err);
        toast.error("Gagal memuat data dari server.");
        setLoading(false);
      }
    );

    const fetchAdmins = async () => {
      try {
        const snap = await getDocs(
          query(collection(db, "users"), where("role", "in", ["admin", "superadmin"]))
        );
        setAdminList(snap.docs.map((d) => ({ uid: d.data().uid, email: d.data().email, name: d.data().name, role: d.data().role })));
      } catch { /* optional */ }
    };
    fetchAdmins();

    return () => { unsubAuth(); unsubSnap(); };
  }, [router]);

  useEffect(() => {
    if (!selectedComplaint) { setComments([]); return; }
    setLoadingComments(true);
    const q = query(
      collection(db, "comments"),
      where("complaintId", "==", selectedComplaint.id),
      orderBy("createdAt", "asc")
    );
    const unsub = onSnapshot(q, (snap) => {
      setComments(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Comment)));
      setLoadingComments(false);
    });
    return () => unsub();
  }, [selectedComplaint]);

  // ─────────────────────────────────────────
  // COMPUTED: Filter + Sort (Tanpa Filter Tanggal)
  // ─────────────────────────────────────────

  const filteredComplaints = useMemo(() => {
    let result = [...complaints];

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (c) =>
          c.ticketId?.toLowerCase().includes(q) ||
          c.title?.toLowerCase().includes(q) ||
          c.reporterName?.toLowerCase().includes(q) ||
          c.reporterEmail?.toLowerCase().includes(q)
      );
    }
    if (statusFilter !== "Semua")   result = result.filter((c) => c.status === statusFilter);
    if (categoryFilter !== "Semua") result = result.filter((c) => c.category === categoryFilter);

    const statusOrder:   Record<string, number>  = { Diterima: 0, Diverifikasi: 1, Diproses: 2, Diselesaikan: 3, Ditolak: 4 };
    result.sort((a, b) => {
      let diff = 0;
      if (sortField === "createdAt") {
        diff = (a.createdAt?.toDate?.()?.getTime?.() ?? 0) - (b.createdAt?.toDate?.()?.getTime?.() ?? 0);
      } else if (sortField === "status") {
        diff = (statusOrder[a.status] ?? 0) - (statusOrder[b.status] ?? 0);
      }
      return sortDir === "desc" ? -diff : diff;
    });

    return result;
  }, [complaints, searchQuery, statusFilter, categoryFilter, sortField, sortDir]);

  const perKategori = useMemo(() => {
    const map: Record<string, number> = {};
    complaints.forEach((c) => { map[c.category] = (map[c.category] ?? 0) + 1; });
    return map;
  }, [complaints]);

  // ─────────────────────────────────────────
  // ACTIONS
  // ─────────────────────────────────────────

  const submitStatusUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedComplaint || !newStatusTarget || !adminUser) return;

    try {
      const docRef = doc(db, "complaints", selectedComplaint.id);
      await updateDoc(docRef, {
        status:    newStatusTarget,
        updatedAt: serverTimestamp(),
        ...(disposisiTarget ? { assignedTo: disposisiTarget } : {}),
      });

      const logData: Omit<ComplaintLog, "id"> = {
        complaintId: selectedComplaint.id,
        changedBy:   adminUser.email,
        oldStatus:   selectedComplaint.status,
        newStatus:   newStatusTarget,
        note:        statusNote || "Perubahan status oleh petugas kelurahan.",
        timestamp:   serverTimestamp(),
      };
      await addDoc(collection(db, "complaint_logs"), logData);

      toast.success(`Tiket ${selectedComplaint.ticketId} → ${newStatusTarget}`);
      setSelectedComplaint(null);
      setNewStatusTarget("");
      setStatusNote("");
      setDisposisiTarget("");
    } catch (err) {
      console.error(err);
      toast.error("Gagal memperbarui status laporan.");
    }
  };

  const submitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !selectedComplaint || !adminUser) return;
    try {
      await addDoc(collection(db, "comments"), {
        complaintId: selectedComplaint.id,
        userId:      adminUser.uid,
        role:        "admin",
        message:     newComment.trim(),
        createdAt:   serverTimestamp(),
      });
      setNewComment("");
      toast.success("Balasan terkirim.");
    } catch {
      toast.error("Gagal mengirim komentar.");
    }
  };

  const handleUploadDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docFile || !selectedComplaint) return;
    setUploadingDoc(true);
    try {
      toast.success("Dokumentasi berhasil diunggah. (Hubungkan Cloud Storage)");
      setDocFile(null);
    } catch {
      toast.error("Gagal mengunggah dokumentasi.");
    } finally {
      setUploadingDoc(false);
    }
  };

  const resetFilter = () => {
    setSearchQuery(""); 
    setStatusFilter("Semua"); 
    setCategoryFilter("Semua");
    setSortField("createdAt"); 
    setSortDir("desc");
  };

  const exportToCSV = () => {
    const headers = ["Tiket ID", "Judul", "Kategori", "Lokasi", "Status", "Pelapor", "Email", "Tanggal"];
    const rows = filteredComplaints.map((item) => [
      item.ticketId,
      item.title,
      item.category,
      item.location,
      item.status,
      item.reporterName || "Anonim",
      item.reporterEmail,
      item.createdAt?.toDate?.()?.toLocaleDateString("id-ID") ?? "-"
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
      )
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `laporan_pengaduan_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    toast.success("File CSV berhasil diunduh");
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push("/admin/login");
      toast.success("Anda telah keluar dari sistem");
    } catch (err) {
      console.error(err);
      toast.error("Gagal keluar dari sistem");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-slate-900 to-black flex flex-col items-center justify-center gap-4">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 rounded-full border-4 border-indigo-500/20 animate-ping" />
          <div className="rounded-full h-16 w-16 border-t-4 border-b-4 border-indigo-400 animate-spin" />
        </div>
        <p className="text-sm text-indigo-200 font-semibold tracking-widest animate-pulse uppercase">Memproses Sistem Analitik…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-50/40 via-slate-50 to-blue-50/50 text-slate-800 font-sans antialiased selection:bg-indigo-500 selection:text-white">

      {/* ══════════ NAVBAR ══════════ */}
      <nav className="bg-white/80 backdrop-blur-xl fixed w-full top-0 z-50 border-b border-slate-100 shadow-sm transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div></div>
          <div className="flex items-center gap-4">
            {adminUser && (
              <>
                <div className="flex items-center gap-2 bg-slate-50 border border-slate-100 rounded-full py-1.5 px-3.5 text-xs text-slate-600 font-semibold">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  {adminUser.name ?? adminUser.email}
                  {adminRole === "superadmin" && (
                    <span className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-[9px] font-black px-2 py-0.5 rounded-full ml-1 uppercase shadow-sm">
                      Super
                    </span>
                  )}
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1.5 bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 hover:text-red-700 font-semibold text-xs py-2 px-3.5 rounded-full transition-all"
                  title="Logout"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Keluar
                </button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* ══════════ MAIN CONTENT ══════════ */}
      <main className="max-w-7xl mx-auto pt-24 pb-20 px-4 sm:px-6 lg:px-8">

        {/* ── HEADER ── */}
        <div className="mb-8 flex flex-col md:flex-row md:items-end md:justify-between gap-6 bg-gradient-to-r from-indigo-900 to-slate-900 p-6 sm:p-8 rounded-3xl text-white shadow-xl shadow-slate-900/10 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-2xl -mr-20 -mt-20 pointer-events-none" />
          <div className="absolute bottom-0 left-1/3 w-48 h-48 bg-violet-500/10 rounded-full blur-2xl pointer-events-none" />
          
          <div className="relative z-10">
            <div className="flex items-center gap-2 bg-white/10 w-fit px-3 py-1 rounded-full text-[11px] font-bold text-indigo-200 backdrop-blur-md mb-2 border border-white/5">
              <Sparkles className="w-3 h-3 text-yellow-400 animate-spin" /> Live Monitoring System
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Dashboard Operasional Pengaduan 📊
            </h2>
            <p className="text-xs text-indigo-200/70 mt-1 max-w-xl font-medium">
              Pantau laporan warga, status penanganan, dan respons petugas secara real-time dalam satu pusat kendali.
            </p>
          </div>

        </div>

        {/* ══════════════════════════════════
            PENGADUAN
        ══════════════════════════════════ */}
        <section className="space-y-8">
            {/* ── KPI STATISTIK ── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <motion.div whileHover={{ y: -4 }} className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm border-l-4 border-l-indigo-500 col-span-2 lg:col-span-1 flex flex-col justify-between">
                <div>
                  <div className="text-indigo-600 font-black text-[11px] uppercase tracking-wider mb-1 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5" /> Total Laporan
                  </div>
                  <div className="text-4xl font-black text-indigo-600 tracking-tight">
                    {stats.total}
                    <span className="text-xs text-slate-400 font-medium ml-1.5">Berkas</span>
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-indigo-50 space-y-1.5 bg-indigo-50/30 rounded-2xl p-3">
                  {KATEGORI_LIST.filter((k) => perKategori[k] > 0).slice(0, 3).map((k) => (
                    <div key={k} className="flex items-center justify-between text-[10px]">
                      <span className="text-slate-500 font-medium truncate max-w-[100px]">{k}</span>
                      <span className="font-bold text-indigo-700 bg-white px-1.5 py-0.2 rounded border border-indigo-100">{perKategori[k]}</span>
                    </div>
                  ))}
                </div>
              </motion.div>

              <motion.div whileHover={{ y: -4 }} className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm border-l-4 border-l-blue-500 flex flex-col justify-between">
                <div>
                  <div className="text-blue-600 font-black text-[11px] uppercase tracking-wider mb-1 flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5" /> Antrean Baru
                  </div>
                  <div className="text-4xl font-black text-blue-600 tracking-tight">{stats.diterima}</div>
                </div>
                <div className="text-[11px] text-slate-400 font-medium mt-2 bg-blue-50/50 p-1.5 rounded-lg border border-blue-100/30">
                  ⚡ Lolos Verifikasi: <span className="font-bold text-slate-700">{stats.diverifikasi}</span>
                </div>
              </motion.div>

              <motion.div whileHover={{ y: -4 }} className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm border-l-4 border-l-orange-500 flex flex-col justify-between">
                <div>
                  <div className="text-orange-600 font-black text-[11px] uppercase tracking-wider mb-1 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" /> Sedang Diproses
                  </div>
                  <div className="text-4xl font-black text-orange-600 tracking-tight">{stats.diproses}</div>
                </div>
                <div className="text-[11px] text-slate-400 font-medium mt-2 bg-orange-50/50 p-1.5 rounded-lg border border-orange-100/30">
                  ⏱️ Durasi Kerja: <span className="font-bold text-slate-700">{stats.avgSelesaiHari} hari</span>
                </div>
              </motion.div>

              <motion.div whileHover={{ y: -4 }} className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm border-l-4 border-l-emerald-500 flex flex-col justify-between">
                <div>
                  <div className="text-emerald-600 font-black text-[11px] uppercase tracking-wider mb-1 flex items-center gap-1.5">
                    <CheckCircle className="w-3.5 h-3.5" /> Diselesaikan
                  </div>
                  <div className="text-4xl font-black text-emerald-600 tracking-tight">{stats.selesai}</div>
                </div>
                <div className="text-[11px] text-amber-600 font-black mt-2 bg-amber-50/70 p-1.5 rounded-lg border border-amber-100/30 flex items-center gap-1">
                  <Star className="w-3 h-3 fill-amber-400 text-amber-400" /> Rating Warga: {stats.avgRating || "-"} / 5
                </div>
              </motion.div>
            </div>

            {/* ── FILTER & SEARCH (Filter Tanggal Dihapus) ── */}
            <div className="bg-white/80 backdrop-blur-md border border-slate-100 rounded-3xl p-4 mb-6 shadow-sm">
              <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
                {/* Search */}
                <div className="relative w-full lg:w-96">
                  <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Cari Tiket, Judul, Pelapor atau Email…"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-50/80 border border-slate-200 rounded-2xl pl-10 pr-4 py-2.5 text-sm outline-none focus:border-indigo-500 focus:bg-white transition-all text-slate-700 font-medium"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
                  {/* Filter Status */}
                  <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-2xl px-3 py-1.5">
                    <Filter className="w-3.5 h-3.5 text-slate-400" />
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="bg-transparent text-xs font-bold text-slate-700 outline-none cursor-pointer"
                    >
                      <option value="Semua">Semua Status</option>
                      {STATUS_LIST.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>

                  {/* Filter Kategori */}
                  <div className="flex items-center bg-slate-50 border border-slate-200 rounded-2xl px-3 py-1.5">
                    <select
                      value={categoryFilter}
                      onChange={(e) => setCategoryFilter(e.target.value)}
                      className="bg-transparent text-xs font-bold text-slate-700 outline-none cursor-pointer"
                    >
                      <option value="Semua">Semua Kategori</option>
                      {KATEGORI_LIST.map((k) => (
                        <option key={k} value={k}>{k}</option>
                      ))}
                    </select>
                  </div>

                  {/* Sort */}
                  <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-2xl px-2 py-1">
                    <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                    <select
                      value={sortField}
                      onChange={(e) => setSortField(e.target.value as any)}
                      className="bg-transparent text-xs font-bold text-slate-700 outline-none cursor-pointer py-1"
                    >
                      <option value="createdAt">Urut: Tanggal</option>
                      <option value="status">Urut: Status</option>
                    </select>
                    <button
                      onClick={() => setSortDir((d) => (d === "asc" ? "desc" : "asc"))}
                      className="bg-white border border-slate-200 rounded-xl p-1.5 text-slate-600 hover:text-indigo-600 hover:shadow-sm transition-all"
                    >
                      {sortDir === "asc" ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                  {/* Reset */}
                  {/* <button
                    onClick={resetFilter}
                    className="ml-auto lg:ml-0 flex items-center gap-1.5 text-slate-400 hover:text-indigo-600 text-xs font-bold transition-all px-3 py-2 rounded-xl hover:bg-indigo-50/50"
                  >
                  </button> */}

                  {/* Export CSV */}
                  <button
                    onClick={exportToCSV}
                    className="flex items-center gap-1.5 text-slate-600 hover:text-emerald-600 text-xs font-bold transition-all px-3 py-2 rounded-xl hover:bg-emerald-50/50 bg-emerald-50/30 border border-emerald-200/50"
                  >
                    <Download className="w-3.5 h-3.5" /> Export CSV
                  </button>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400 font-semibold">
                <span>Hasil filter: <span className="text-indigo-600 font-black">{filteredComplaints.length}</span> pengaduan ditemukan</span>
              </div>
            </div>

            {/* ── DAFTAR PENGADUAN ── */}
            <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-4">
              {filteredComplaints.length === 0 ? (
                <div className="bg-white border border-slate-100 rounded-3xl p-16 text-center shadow-sm">
                  <Search className="w-12 h-12 text-slate-200 mx-auto mb-4 animate-bounce" />
                  <p className="text-slate-400 font-bold text-sm">Tidak ada berkas pengaduan yang cocok.</p>
                </div>
              ) : (
                filteredComplaints.map((item) => (
                  <motion.div
                    key={item.id}
                    variants={{ ...fadeIn, ...cardHoverEffect }}
                    whileHover="hover"
                    className="bg-white border border-slate-100/80 rounded-3xl p-5 sm:p-6 shadow-sm hover:shadow-xl hover:shadow-indigo-900/5 transition-all duration-300 flex flex-col lg:flex-row gap-6 items-start relative overflow-hidden"
                  >
                    {/* Accent garis kartu */}
                    <div className="absolute top-0 left-0 w-1.5 h-full bg-indigo-500" />

                    {/* Thumbnail lampiran */}
                    <div className="w-full lg:w-40 h-36 rounded-2xl overflow-hidden bg-slate-50 border border-slate-100 flex-shrink-0 flex items-center justify-center relative group">
                      {getComplaintImages(item).length > 0 ? (
                        <>
                          <img src={getComplaintImages(item)[0]} alt="Bukti" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                          <div className="absolute inset-0 bg-indigo-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <Eye className="w-5 h-5 text-white" />
                          </div>
                        </>
                      ) : (
                        <div className="text-center p-4">
                          <FileText className="w-8 h-8 mx-auto text-slate-200 mb-1" />
                          <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">No Image</span>
                        </div>
                      )}
                    </div>

                    {/* Detail */}
                    <div className="flex-1 space-y-3 w-full min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-[11px] font-black text-indigo-600 bg-indigo-50/80 border border-indigo-100 px-2.5 py-0.5 rounded-lg shadow-sm">
                          {item.ticketId}
                        </span>
                        <span className="text-[11px] text-slate-600 font-extrabold flex items-center gap-1 bg-slate-100/80 px-2.5 py-0.5 rounded-lg border border-slate-200/40">
                          <Layers className="w-3 h-3 text-slate-400" /> {item.category}
                       
                        </span>
                        <span className="text-[11px] text-slate-400 font-bold flex items-center gap-1.5 ml-auto bg-slate-50 px-2.5 py-1 rounded-full border border-slate-100">
                          <User className="w-3 h-3 text-slate-400" />
                          {item.reporterName ?? item.reporterEmail?.split("@")[0] ?? "Anonim"}
                        </span>
                      </div>

                      <h3 className="font-black text-slate-800 text-base sm:text-lg tracking-tight line-clamp-1 hover:text-indigo-600 transition-colors cursor-pointer" onClick={() => setDetailedComplaint(item)}>
                        {item.title}
                      </h3>
                      <p className="text-slate-500 text-xs sm:text-sm leading-relaxed line-clamp-2 font-medium">{item.description}</p>

                      <div className="pt-2 flex flex-col sm:flex-row sm:items-center gap-3 border-t border-slate-50 text-xs font-bold text-slate-500">
                        <span className="flex items-center gap-1 text-slate-700 bg-slate-50 px-2.5 py-1 rounded-xl border border-slate-100">
                          <MapPin className="w-3.5 h-3.5 text-rose-500 flex-shrink-0" /> {item.location}
                        </span>
                        {item.latitude && item.longitude && (
                          <a
                            href={`https://www.google.com/maps/search/?api=1&query=${item.latitude},${item.longitude}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-indigo-600 hover:text-indigo-800 flex items-center gap-1 bg-indigo-50 px-2.5 py-1 rounded-xl border border-indigo-100/50 hover:bg-indigo-100 transition-all w-fit"
                          >
                            Maps Link <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                        <span className="text-slate-400 font-medium sm:ml-auto flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {item.createdAt?.toDate?.()?.toLocaleDateString("id-ID", {
                            day: "numeric", month: "short", year: "numeric",
                          }) ?? "-"}
                        </span>
                      </div>
                    </div>

                    {/* Panel Kontrol & Aksi Dinamis */}
                    <div className="w-full lg:w-48 border-t lg:border-t-0 lg:border-l border-slate-100 pt-4 lg:pt-0 lg:pl-4 flex flex-col justify-between h-full self-stretch gap-4">
                      <div>
                        <span className={`px-3 py-1 rounded-full text-[11px] font-black border flex items-center justify-center w-full shadow-sm ${getStatusBadgeStyle(item.status)}`}>
                          <span className="mr-1.5 text-xs">{getStatusDot(item.status)}</span> {item.status}
                        </span>
                        
                        
                      </div>

                      {/* Grup Tombol Aksi Baru */}
                      <div className="grid grid-cols-2 lg:grid-cols-1 gap-2 mt-auto">
                        <button
                          onClick={() => setDetailedComplaint(item)}
                          className="flex items-center justify-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-[11px] py-2 px-3 rounded-xl transition-all shadow-sm border border-slate-200/30"
                        >
                          <Eye className="w-3.5 h-3.5 text-slate-500" /> Detail
                        </button>
                        <button
                          onClick={() => {
                            setSelectedComplaint(item);
                            setNewStatusTarget(item.status);
                            setModalTab("status");
                          }}
                          className="flex items-center justify-center gap-1.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-extrabold text-[11px] py-2 px-3 rounded-xl shadow-md shadow-indigo-200 transition-all"
                        >
                          Tindak Lanjut
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </motion.div>
        </section>

      </main>

      {/* ══════════════════════════════════
          MODAL TINDAK LANJUT
      ══════════════════════════════════ */}
      <AnimatePresence>
        {selectedComplaint && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <motion.div
              initial="hidden"
              animate="visible"
              exit="hidden"
              variants={modalAnim}
              className="bg-white rounded-3xl w-full max-w-lg shadow-2xl border border-slate-100 overflow-hidden max-h-[90vh] flex flex-col"
            >
              <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
                <div>
                  <h3 className="font-black text-slate-900 text-base">Alur Kerja & Respon</h3>
                  <p className="text-xs font-mono font-bold text-indigo-600 mt-0.5">{selectedComplaint.ticketId}</p>
                </div>
                <button onClick={() => setSelectedComplaint(null)} className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 transition-all">
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              <div className="flex border-b border-slate-100 px-6 bg-slate-50/50">
                {(
                  [
                    { key: "status",   icon: <RotateCcw className="w-3.5 h-3.5" />,     label: "Status & Log" },
                    { key: "dokumen",  icon: <Paperclip className="w-3.5 h-3.5" />,     label: "Dokumentasi" },
                  ] as const
                ).map(({ key, icon, label }) => (
                  <button
                    key={key}
                    onClick={() => setModalTab(key)}
                    className={`flex items-center gap-1.5 text-xs font-black py-3.5 mr-5 border-b-2 transition-all ${
                      modalTab === key
                        ? "border-indigo-600 text-indigo-700"
                        : "border-transparent text-slate-400 hover:text-slate-600"
                    }`}
                  >
                    {icon} {label}
                  </button>
                ))}
              </div>

              <div className="overflow-y-auto flex-1 px-6 py-5">
                {modalTab === "status" && (
                  <form onSubmit={submitStatusUpdate} className="space-y-4">
                    <div className="bg-slate-50 rounded-2xl p-4 text-xs border border-slate-100 space-y-1">
                      <p className="font-black text-slate-800 text-sm truncate">{selectedComplaint.title}</p>
                      <p className="text-slate-500 font-medium">{selectedComplaint.category} · {selectedComplaint.location}</p>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1.5">Ubah Status Operasional</label>
                      <select
                        value={newStatusTarget}
                        onChange={(e) => setNewStatusTarget(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 text-xs sm:text-sm font-semibold rounded-xl p-3 outline-none text-slate-700 focus:border-indigo-500 transition-all"
                        required
                      >
                        <option value="Diterima">🔵 Diterima — Antrean Baru</option>
                        <option value="Diverifikasi">🟡 Diverifikasi — Lolos Verifikasi</option>
                        <option value="Diproses">🟠 Diproses — Penanganan Lapangan</option>
                        <option value="Diselesaikan">🟢 Diselesaikan — Selesai Tuntas</option>
                        <option value="Ditolak">🔴 Ditolak — Batalkan Laporan</option>
                      </select>
                    </div>

                    {adminList.length > 0 && (
                      <div>
                        <label className="text-xs font-bold text-slate-700 block mb-1.5">Delegasikan Petugas</label>
                        <select
                          value={disposisiTarget}
                          onChange={(e) => setDisposisiTarget(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 text-xs sm:text-sm font-semibold rounded-xl p-3 outline-none text-slate-700 focus:border-indigo-500 transition-all"
                        >
                          <option value="">— Biarkan pada Instansi Utama —</option>
                          {adminList.filter((a) => a.uid !== adminUser?.uid).map((a) => (
                            <option key={a.uid} value={a.email}>{a.name ?? a.email} ({a.role})</option>
                          ))}
                        </select>
                      </div>
                    )}

                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1.5">Catatan Official / Alasan Penolakan</label>
                      <textarea
                        rows={3}
                        value={statusNote}
                        onChange={(e) => setStatusNote(e.target.value)}
                        placeholder="Tulis kronologi singkat tindakan pemulihan atau alasan ketidakvalidan dokumen pelapor…"
                        className="w-full bg-slate-50 border border-slate-200 text-sm rounded-xl p-3 outline-none text-slate-700 focus:border-indigo-500 transition-all resize-none font-medium"
                        required={newStatusTarget === "Ditolak"}
                      />
                    </div>

                    <div className="flex items-center gap-3 pt-2">
                      <button type="button" onClick={() => setSelectedComplaint(null)} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs py-3 rounded-xl transition-all">
                        Kembali
                      </button>
                      <button type="submit" className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-3 rounded-xl shadow-md shadow-indigo-100 transition-all">
                        Simpan Riwayat
                      </button>
                    </div>
                  </form>
                )}

                {modalTab === "dokumen" && (
                  <div className="space-y-4">
                    {getComplaintImages(selectedComplaint).length > 0 && (
                      <div>
                        <p className="text-xs font-black text-slate-700 mb-2">Lampiran Tersedia</p>
                        <div className="flex flex-wrap gap-2">
                          {getComplaintImages(selectedComplaint).map((url, i) => (
                            <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="w-20 h-20 rounded-xl overflow-hidden border border-slate-200 hover:scale-95 transition-all">
                              <img src={url} alt="Lampiran" className="w-full h-full object-cover" />
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                    <form onSubmit={handleUploadDoc} className="space-y-3">
                      <label className="text-xs font-black text-slate-700 block">Kirim Berkas Penyelesaian Tambahan</label>
                      <div className="border-2 border-dashed border-slate-200 rounded-2xl p-6 text-center hover:border-indigo-400 transition-all bg-slate-50/50">
                        <Paperclip className="w-6 h-6 text-slate-300 mx-auto mb-2" />
                        <input type="file" accept="image/*,.pdf" onChange={(e) => setDocFile(e.target.files?.[0] ?? null)} className="text-xs text-slate-500 w-full" />
                      </div>
                      <button type="submit" disabled={!docFile || uploadingDoc} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-3 rounded-xl transition-all shadow-sm">
                        {uploadingDoc ? "Mengunggah…" : "Simpan Arsip Foto"}
                      </button>
                    </form>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ══════════════════════════════════
          MODAL DETAIL BARU (AKSI DETAIL BARIS)
      ══════════════════════════════════ */}
      <AnimatePresence>
        {detailedComplaint && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <motion.div
              initial="hidden"
              animate="visible"
              exit="hidden"
              variants={modalAnim}
              className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl border border-slate-100 overflow-hidden max-h-[85vh] flex flex-col"
            >
              {/* Header */}
              <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-indigo-50/30 to-slate-50 flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="font-mono text-xs font-black text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded">
                      {detailedComplaint.ticketId}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase border ${getStatusBadgeStyle(detailedComplaint.status)}`}>
                      {detailedComplaint.status}
                    </span>
                  </div>
                  <h3 className="text-lg font-black text-slate-900 tracking-tight">{detailedComplaint.title}</h3>
                </div>
                <button onClick={() => setDetailedComplaint(null)} className="text-slate-400 hover:text-slate-600 bg-white shadow-sm p-1.5 rounded-xl border border-slate-100 transition-all">
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              {/* Body Konten */}
              <div className="p-6 overflow-y-auto space-y-5 text-sm text-slate-600 font-medium">
                
                {/* Info Utama Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-400 font-black uppercase block">Klaster Kategori</span>
                    <p className="text-slate-800 font-bold flex items-center gap-1.5"><Layers className="w-4 h-4 text-indigo-500" /> {detailedComplaint.category}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-400 font-black uppercase block">Nama Pelapor / Warga</span>
                    <p className="text-slate-800 font-bold flex items-center gap-1.5"><User className="w-4 h-4 text-slate-400" /> {detailedComplaint.reporterName || "Anonim"}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-400 font-black uppercase block">Email Terdaftar</span>
                    <p className="text-slate-800 font-bold flex items-center gap-1.5"><Mail className="w-4 h-4 text-slate-400" /> {detailedComplaint.reporterEmail}</p>
                  </div>
                </div>

                {/* Deskripsi */}
                <div className="space-y-1.5">
                  <span className="text-[10px] text-slate-400 font-black uppercase block">Uraian Masalah Lengkap</span>
                  <div className="bg-white border border-slate-100 p-4 rounded-2xl text-slate-700 leading-relaxed text-xs sm:text-sm shadow-inner whitespace-pre-wrap font-normal">
                    {detailedComplaint.description}
                  </div>
                </div>

                {/* Lokasi Spasial */}
                <div className="space-y-2">
                  <span className="text-[10px] text-slate-400 font-black uppercase block">Titik Geografis & Alamat Kejadian</span>
                  <div className="flex items-center gap-2 bg-rose-50/40 border border-rose-100/60 p-3 rounded-2xl text-xs text-slate-700">
                    <MapPin className="w-4 h-4 text-rose-500 flex-shrink-0" />
                    <span className="font-bold">{detailedComplaint.location}</span>
                  </div>
                </div>

                {/* Galeri Gambar */}
                {getComplaintImages(detailedComplaint).length > 0 && (
                  <div className="space-y-2">
                    <span className="text-[10px] text-slate-400 font-black uppercase block">Bukti Foto / Lampiran Lapangan</span>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {getComplaintImages(detailedComplaint).map((img, idx) => (
                        <a key={idx} href={img} target="_blank" rel="noreferrer" className="rounded-xl overflow-hidden border border-slate-200 h-28 group relative block">
                          <img src={img} alt="Bukti Lampiran" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                          <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <ExternalLink className="w-4 h-4 text-white" />
                          </div>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Footer Modal */}
              <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-2">
                <button
                  onClick={() => setDetailedComplaint(null)}
                  className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-black text-xs py-2.5 px-4 rounded-xl transition-all"
                >
                  Tutup
                </button>
                <button
                  onClick={() => {
                    setDetailedComplaint(null);
                    setSelectedComplaint(detailedComplaint);
                    setNewStatusTarget(detailedComplaint.status);
                    setModalTab("status");
                  }}
                  className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-black text-xs py-2.5 px-4 rounded-xl shadow-md transition-all"
                >
                  Proses Tindak Lanjut
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}