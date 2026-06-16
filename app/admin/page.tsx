"use client";

import React, { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { signOut, onAuthStateChanged } from "firebase/auth";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
  addDoc,
  getDocs,
  where,
  serverTimestamp,
} from "firebase/firestore";
import {
  ShieldCheck,
  LogOut,
  Clock,
  CheckCircle,
  AlertCircle,
  MapPin,
  ExternalLink,
  Layers,
  User,
  Search,
  Filter,
  XCircle,
  FileText,
  BarChart2,
  Download,
  MessageSquare,
  ArrowUpDown,
  Send,
  ChevronDown,
  ChevronUp,
  Paperclip,
  RotateCcw,
  Star,
  TrendingUp,
  Users,
} from "lucide-react";
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
  status: "Diterima" | "Diverifikasi" | "Diproses" | "Diselesaikan" | "Ditolak";
  priority: "normal" | "tinggi" | "urgent";
  rating?: number; // F-41
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
    case "Diterima":     return "bg-blue-50 text-blue-700 border-blue-200";
    case "Diverifikasi": return "bg-yellow-50 text-yellow-700 border-yellow-200";
    case "Diproses":     return "bg-orange-50 text-orange-700 border-orange-200";
    case "Diselesaikan": return "bg-green-50 text-green-700 border-green-200";
    case "Ditolak":      return "bg-red-50 text-red-700 border-red-200";
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

const getPriorityStyle = (priority: string) => {
  switch (priority) {
    case "urgent": return "text-red-600 bg-red-50 border-red-200";
    case "tinggi": return "text-yellow-700 bg-yellow-50 border-yellow-200";
    default:        return "text-slate-600 bg-slate-50 border-slate-200";
  }
};

const KATEGORI_LIST = [
  "Infrastruktur",
  "Kebersihan",
  "Keamanan",
  "Pelayanan Publik",
  "Sosial",
  "Lainnya",
];

const STATUS_LIST = [
  "Diterima",
  "Diverifikasi",
  "Diproses",
  "Diselesaikan",
  "Ditolak",
];

const fadeIn: Variants = {
  hidden:  { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

const modalAnim: Variants = {
  hidden:  { scale: 0.95, opacity: 0 },
  visible: { scale: 1, opacity: 1, transition: { duration: 0.2 } },
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
  const [dateFrom, setDateFrom]                   = useState("");
  const [dateTo, setDateTo]                       = useState("");
  const [sortField, setSortField]                 = useState<"createdAt" | "priority" | "status">("createdAt");
  const [sortDir, setSortDir]                     = useState<"asc" | "desc">("desc");

  // ── Tab aktif ──
  const [activeTab, setActiveTab]                 = useState<"pengaduan" | "laporan">("pengaduan");

  // ── Modal Tindak Lanjut (F-31, F-32, F-34, F-35, F-36) ──
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [newStatusTarget, setNewStatusTarget]     = useState("");
  const [statusNote, setStatusNote]               = useState("");
  const [disposisiTarget, setDisposisiTarget]     = useState("");
  const [modalTab, setModalTab]                   = useState<"status" | "komentar" | "dokumen">("status");

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
      // Ambil role dari koleksi users
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

    // Real-time complaints listener
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

    // Ambil daftar admin untuk disposisi (F-34)
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

  // ─────────────────────────────────────────
  // EFFECT: Load komentar saat modal dibuka (F-35)
  // ─────────────────────────────────────────

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
  // COMPUTED: Filter + Sort
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
    if (dateFrom) result = result.filter((c) => c.createdAt?.toDate?.() >= new Date(dateFrom));
    if (dateTo)   result = result.filter((c) => c.createdAt?.toDate?.() <= new Date(dateTo + "T23:59:59"));

    // Sort (F-29)
    const priorityOrder: Record<string, number> = { urgent: 0, tinggi: 1, normal: 2 };
    const statusOrder:   Record<string, number>  = { Diterima: 0, Diverifikasi: 1, Diproses: 2, Diselesaikan: 3, Ditolak: 4 };
    result.sort((a, b) => {
      let diff = 0;
      if (sortField === "createdAt") {
        diff = (a.createdAt?.toDate?.()?.getTime?.() ?? 0) - (b.createdAt?.toDate?.()?.getTime?.() ?? 0);
      } else if (sortField === "priority") {
        diff = (priorityOrder[a.priority] ?? 2) - (priorityOrder[b.priority] ?? 2);
      } else if (sortField === "status") {
        diff = (statusOrder[a.status] ?? 0) - (statusOrder[b.status] ?? 0);
      }
      return sortDir === "desc" ? -diff : diff;
    });

    return result;
  }, [complaints, searchQuery, statusFilter, categoryFilter, dateFrom, dateTo, sortField, sortDir]);

  // Per-kategori untuk KPI (F-27)
  const perKategori = useMemo(() => {
    const map: Record<string, number> = {};
    complaints.forEach((c) => { map[c.category] = (map[c.category] ?? 0) + 1; });
    return map;
  }, [complaints]);

  // Data tren bulanan untuk grafik ASCII (F-37)
  const trendData = useMemo(() => {
    const map: Record<string, number> = {};
    complaints.forEach((c) => {
      const d = c.createdAt?.toDate?.();
      if (!d) return;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      map[key] = (map[key] ?? 0) + 1;
    });
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b)).slice(-6);
  }, [complaints]);

  // ─────────────────────────────────────────
  // ACTIONS
  // ─────────────────────────────────────────

  // F-31, F-32 — Ubah status + log
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

  // F-33 — Ubah prioritas
  const handleUpdatePriority = async (id: string, newPriority: string) => {
    try {
      await updateDoc(doc(db, "complaints", id), { priority: newPriority });
      toast.success(`Prioritas diubah: ${newPriority.toUpperCase()}`);
    } catch {
      toast.error("Gagal memperbarui prioritas.");
    }
  };

  // F-35 — Balas komentar
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

  // F-36 — Upload dokumentasi penyelesaian
  // Catatan: implementasi upload ke Cloud Storage membutuhkan konfigurasi
  // Firebase Storage di proyek Anda (import getStorage, ref, uploadBytes, getDownloadURL)
  const handleUploadDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docFile || !selectedComplaint) return;
    setUploadingDoc(true);
    try {
      // PLACEHOLDER — ganti dengan logika upload Cloud Storage Anda:
      // const storage = getStorage();
      // const storageRef = ref(storage, `docs/${selectedComplaint.id}/${docFile.name}`);
      // await uploadBytes(storageRef, docFile);
      // const url = await getDownloadURL(storageRef);
      // await updateDoc(doc(db, "complaints", selectedComplaint.id), {
      //   attachments: arrayUnion(url),
      // });
      toast.success("Dokumentasi berhasil diunggah. (Hubungkan Cloud Storage)");
      setDocFile(null);
    } catch {
      toast.error("Gagal mengunggah dokumentasi.");
    } finally {
      setUploadingDoc(false);
    }
  };

  // F-39 — Ekspor CSV
  const handleExportCSV = () => {
    const headers = [
      "No. Tiket", "Judul", "Kategori", "Status", "Prioritas",
      "Pelapor", "Lokasi", "Tanggal Masuk", "Rating",
    ];
    const rows = filteredComplaints.map((c) => [
      c.ticketId,
      `"${c.title.replace(/"/g, '""')}"`,
      c.category,
      c.status,
      c.priority,
      c.reporterEmail,
      `"${c.location.replace(/"/g, '""')}"`,
      c.createdAt?.toDate?.()?.toLocaleDateString("id-ID") ?? "-",
      c.rating ?? "-",
    ]);
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = `laporan-sipmas-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Laporan CSV berhasil diunduh.");
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast.success("Berhasil keluar dari panel admin.");
      router.push("/admin/login");
    } catch {
      toast.error("Gagal keluar sistem.");
    }
  };

  const toggleSort = (field: typeof sortField) => {
    if (sortField === field) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortField(field); setSortDir("desc"); }
  };

  const resetFilter = () => {
    setSearchQuery(""); setStatusFilter("Semua"); setCategoryFilter("Semua");
    setDateFrom(""); setDateTo(""); setSortField("createdAt"); setSortDir("desc");
  };

  // ─────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-3">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600" />
        <p className="text-sm text-slate-400 font-medium">Memuat data pengaduan…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans">

      {/* ══════════ NAVBAR (Bab 6.3) ══════════ */}
      <nav className="bg-white shadow-sm fixed w-full top-0 z-50 border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600 p-1.5 rounded-lg shadow-md shadow-indigo-200">
              <ShieldCheck className="h-5 w-5 text-white" />
            </div>
            <span className="font-bold text-base sm:text-lg text-slate-800 tracking-tight">
              PANEL PETUGAS{" "}
              <span className="text-indigo-600 hidden sm:inline">| SIPMAS NGEMPLAKREJO</span>
            </span>
          </div>

          <div className="flex items-center gap-3">
            {adminUser && (
              <span className="hidden md:flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                <User className="w-3.5 h-3.5" />
                {adminUser.name ?? adminUser.email}
                {adminRole === "superadmin" && (
                  <span className="bg-indigo-100 text-indigo-700 text-[10px] font-bold px-1.5 py-0.5 rounded ml-1">
                    SUPER ADMIN
                  </span>
                )}
              </span>
            )}
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 text-rose-600 hover:bg-rose-50 px-4 py-2 rounded-full text-sm font-semibold transition-all"
            >
              <LogOut className="w-4 h-4" /> Keluar
            </button>
          </div>
        </div>
      </nav>

      {/* ══════════ MAIN CONTENT ══════════ */}
      <main className="max-w-7xl mx-auto pt-24 pb-20 px-4 sm:px-6 lg:px-8">

        {/* ── HEADER ── */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Dashboard Analitik & Tindak Lanjut 📋
            </h2>
            <p className="text-sm text-slate-500 mt-0.5">
              Kelola data pengaduan masuk warga Kelurahan Ngemplakrejo secara transparan dan real-time.
            </p>
          </div>
          {/* TAB navigasi */}
          <div className="flex bg-slate-100 rounded-xl p-1 gap-1 self-start sm:self-auto">
            <button
              onClick={() => setActiveTab("pengaduan")}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                activeTab === "pengaduan"
                  ? "bg-white text-indigo-700 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <FileText className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" />
              Pengaduan
            </button>
            <button
              onClick={() => setActiveTab("laporan")}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                activeTab === "laporan"
                  ? "bg-white text-indigo-700 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <BarChart2 className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" />
              Laporan & Analitik
            </button>
          </div>
        </div>

        {/* ══════════════════════════════════
            TAB: PENGADUAN
        ══════════════════════════════════ */}
        {activeTab === "pengaduan" && (
          <>
            {/* ── KPI STATISTIK (F-27) ── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm col-span-2 lg:col-span-1">
                <div className="text-slate-400 font-bold text-xs uppercase tracking-wider mb-1">Total Laporan</div>
                <div className="text-3xl font-black text-slate-900">
                  {stats.total}
                  <span className="text-xs text-slate-400 font-medium ml-1">Berkas</span>
                </div>
                {/* Per-kategori mini (F-27) */}
                <div className="mt-3 space-y-1">
                  {KATEGORI_LIST.filter((k) => perKategori[k] > 0).map((k) => (
                    <div key={k} className="flex items-center gap-2">
                      <div
                        className="h-1.5 bg-indigo-500 rounded-full"
                        style={{ width: `${Math.round((perKategori[k] / stats.total) * 100)}%`, minWidth: 4 }}
                      />
                      <span className="text-[10px] text-slate-500 whitespace-nowrap">{k} ({perKategori[k]})</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm border-l-4 border-l-blue-500">
                <div className="text-blue-600 font-bold text-xs uppercase tracking-wider mb-1 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" /> Baru Masuk
                </div>
                <div className="text-3xl font-black text-blue-600">{stats.diterima}</div>
                <div className="text-[10px] text-slate-400 mt-1">Diverifikasi: {stats.diverifikasi}</div>
              </div>

              <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm border-l-4 border-l-orange-500">
                <div className="text-orange-600 font-bold text-xs uppercase tracking-wider mb-1 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" /> Sedang Diproses
                </div>
                <div className="text-3xl font-black text-orange-600">{stats.diproses}</div>
                <div className="text-[10px] text-slate-400 mt-1">Rata-rata selesai: {stats.avgSelesaiHari} hari</div>
              </div>

              <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm border-l-4 border-l-green-500">
                <div className="text-green-600 font-bold text-xs uppercase tracking-wider mb-1 flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5" /> Diselesaikan
                </div>
                <div className="text-3xl font-black text-green-600">{stats.selesai}</div>
                <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                  <Star className="w-3 h-3 text-yellow-400" /> Rating rata-rata: {stats.avgRating || "-"}
                </div>
              </div>
            </div>

            {/* ── FILTER & SEARCH (F-28, F-29, F-30) ── */}
            <div className="bg-white border border-slate-100 rounded-2xl p-4 mb-6 shadow-sm">
              <div className="flex flex-col lg:flex-row gap-3 items-start lg:items-center justify-between">
                {/* Search */}
                <div className="relative w-full lg:w-72">
                  <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Cari No. Tiket / Judul / Nama / Email…"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-sm outline-none focus:border-indigo-600 transition-all text-slate-700"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
                  {/* Filter Status */}
                  <div className="flex items-center gap-1.5">
                    <Filter className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="bg-slate-50 border border-slate-200 rounded-xl px-2 py-2 text-xs font-semibold text-slate-700 outline-none"
                    >
                      <option value="Semua">Semua Status</option>
                      {STATUS_LIST.map((s) => (
                        <option key={s} value={s}>{getStatusDot(s)} {s}</option>
                      ))}
                    </select>
                  </div>

                  {/* Filter Kategori (F-15) */}
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="bg-slate-50 border border-slate-200 rounded-xl px-2 py-2 text-xs font-semibold text-slate-700 outline-none"
                  >
                    <option value="Semua">Semua Kategori</option>
                    {KATEGORI_LIST.map((k) => (
                      <option key={k} value={k}>{k}</option>
                    ))}
                  </select>

                  {/* Filter Tanggal (F-28) */}
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="bg-slate-50 border border-slate-200 rounded-xl px-2 py-2 text-xs font-semibold text-slate-700 outline-none"
                    title="Dari tanggal"
                  />
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="bg-slate-50 border border-slate-200 rounded-xl px-2 py-2 text-xs font-semibold text-slate-700 outline-none"
                    title="Sampai tanggal"
                  />

                  {/* Sort (F-29) */}
                  <div className="flex items-center gap-1">
                    <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                    <select
                      value={sortField}
                      onChange={(e) => setSortField(e.target.value as any)}
                      className="bg-slate-50 border border-slate-200 rounded-xl px-2 py-2 text-xs font-semibold text-slate-700 outline-none"
                    >
                      <option value="createdAt">Tanggal</option>
                      <option value="priority">Prioritas</option>
                      <option value="status">Status</option>
                    </select>
                    <button
                      onClick={() => setSortDir((d) => (d === "asc" ? "desc" : "asc"))}
                      className="bg-slate-50 border border-slate-200 rounded-xl p-2 text-slate-600 hover:bg-slate-100 transition-all"
                      title={sortDir === "asc" ? "Urutan Naik" : "Urutan Turun"}
                    >
                      {sortDir === "asc" ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                  {/* Reset */}
                  <button
                    onClick={resetFilter}
                    className="flex items-center gap-1 text-slate-500 hover:text-indigo-600 text-xs font-semibold transition-all"
                    title="Reset filter"
                  >
                    <RotateCcw className="w-3.5 h-3.5" /> Reset
                  </button>
                </div>
              </div>

              <div className="mt-2 text-xs text-slate-400 font-medium">
                Menampilkan <span className="text-slate-700 font-bold">{filteredComplaints.length}</span> dari{" "}
                <span className="text-slate-700 font-bold">{complaints.length}</span> pengaduan
              </div>
            </div>

            {/* ── DAFTAR PENGADUAN ── */}
            <div className="space-y-5">
              {filteredComplaints.length === 0 ? (
                <div className="bg-white border border-slate-100 rounded-3xl p-12 text-center shadow-sm">
                  <Search className="w-8 h-8 text-slate-200 mx-auto mb-3" />
                  <p className="text-slate-400 font-medium">Tidak ada pengaduan yang cocok dengan filter.</p>
                </div>
              ) : (
                filteredComplaints.map((item) => (
                  <motion.div
                    key={item.id}
                    initial="hidden"
                    animate="visible"
                    variants={fadeIn}
                    className="bg-white border border-slate-100 rounded-3xl p-6 sm:p-8 shadow-sm hover:shadow-md transition-all flex flex-col lg:flex-row gap-6 items-start"
                  >
                    {/* Thumbnail lampiran */}
                    <div className="w-full lg:w-44 h-44 lg:h-32 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200/60 flex-shrink-0 flex items-center justify-center">
                      {item.attachments && item.attachments.length > 0 ? (
                        <img
                          src={item.attachments[0]}
                          alt="Bukti Fisik"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="text-center p-4">
                          <FileText className="w-6 h-6 mx-auto text-slate-300 mb-1" />
                          <span className="text-[10px] text-slate-400 font-medium block">Tanpa Lampiran</span>
                        </div>
                      )}
                    </div>

                    {/* Detail */}
                    <div className="flex-1 space-y-2.5 w-full min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded">
                          {item.ticketId}
                        </span>
                        <span className="text-xs text-slate-500 font-bold flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded">
                          <Layers className="w-3.5 h-3.5 text-slate-400" /> {item.category}
                        </span>
                        <span
                          className={`text-xs font-bold border px-2 py-0.5 rounded capitalize ${getPriorityStyle(item.priority)}`}
                        >
                          {item.priority === "urgent" ? "🔴" : item.priority === "tinggi" ? "🟡" : "⚪"} {item.priority}
                        </span>
                        <span className="text-xs text-slate-400 font-medium flex items-center gap-1 ml-auto">
                          <User className="w-3.5 h-3.5" />
                          {item.reporterName ?? item.reporterEmail}
                        </span>
                      </div>

                      <h3 className="font-black text-slate-800 text-base sm:text-lg tracking-tight line-clamp-2">
                        {item.title}
                      </h3>
                      <p className="text-slate-600 text-sm leading-relaxed line-clamp-3">{item.description}</p>

                      <div className="pt-2 flex flex-col sm:flex-row sm:items-center gap-2 border-t border-slate-100 text-xs font-semibold text-slate-500">
                        <span className="flex items-center gap-1 text-slate-700">
                          <MapPin className="w-4 h-4 text-rose-500 flex-shrink-0" /> {item.location}
                        </span>
                        {item.latitude && item.longitude && (
                          <a
                            href={`https://www.google.com/maps/search/?api=1&query=${item.latitude},${item.longitude}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-indigo-600 hover:text-indigo-800 flex items-center gap-1 bg-indigo-50 px-2.5 py-1 rounded-md hover:bg-indigo-100/70 w-fit transition-all"
                          >
                            Buka Google Maps <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                        <span className="text-slate-400 sm:ml-auto">
                          {item.createdAt?.toDate?.()?.toLocaleDateString("id-ID", {
                            day: "numeric", month: "short", year: "numeric",
                          }) ?? "-"}
                        </span>
                      </div>
                    </div>

                    {/* Panel Kontrol */}
                    <div className="w-full lg:w-52 border-t lg:border-t-0 lg:border-l border-slate-100 pt-4 lg:pt-0 lg:pl-6 flex flex-col gap-3">
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                          Status
                        </label>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold border inline-block ${getStatusBadgeStyle(item.status)}`}>
                          {getStatusDot(item.status)} {item.status}
                        </span>
                      </div>

                      {/* Prioritas (F-33) */}
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                          Prioritas
                        </label>
                        <select
                          value={item.priority || "normal"}
                          onChange={(e) => handleUpdatePriority(item.id, e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 text-xs font-bold rounded-xl p-2 outline-none text-slate-700 cursor-pointer"
                        >
                          <option value="normal">⚪ Normal</option>
                          <option value="tinggi">🟡 Tinggi</option>
                          <option value="urgent">🔴 Urgent</option>
                        </select>
                      </div>

                      {/* Tombol buka modal */}
                      <button
                        onClick={() => {
                          setSelectedComplaint(item);
                          setNewStatusTarget(item.status);
                          setModalTab("status");
                        }}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-2.5 px-4 rounded-xl shadow-sm transition-all"
                      >
                        Tindak Lanjut & Log
                      </button>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </>
        )}

        {/* ══════════════════════════════════
            TAB: LAPORAN & ANALITIK (F-37, F-38, F-39, F-40, F-41)
        ══════════════════════════════════ */}
        {activeTab === "laporan" && (
          <div className="space-y-6">

            {/* Tombol Ekspor (F-39) */}
            <div className="flex justify-end">
              <button
                onClick={handleExportCSV}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm px-5 py-2.5 rounded-xl shadow-sm transition-all"
              >
                <Download className="w-4 h-4" /> Ekspor CSV
              </button>
            </div>

            {/* Kartu Ringkasan Lengkap */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {[
                { label: "Total",       value: stats.total,       color: "text-slate-700" },
                { label: "Diterima",    value: stats.diterima,    color: "text-blue-600"  },
                { label: "Diverifikasi",value: stats.diverifikasi,color: "text-yellow-600"},
                { label: "Diproses",    value: stats.diproses,    color: "text-orange-600"},
                { label: "Selesai",     value: stats.selesai,     color: "text-green-600" },
                { label: "Ditolak",     value: stats.ditolak,     color: "text-red-600"   },
              ].map(({ label, value, color }) => (
                <div key={label} className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm text-center">
                  <div className={`text-2xl font-black ${color}`}>{value}</div>
                  <div className="text-[11px] text-slate-400 font-semibold mt-0.5">{label}</div>
                </div>
              ))}
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Grafik Tren Bulanan (F-37) */}
              <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-5">
                  <TrendingUp className="w-4 h-4 text-indigo-600" />
                  <h3 className="font-black text-slate-800 text-sm">Tren Pengaduan per Bulan</h3>
                </div>
                {trendData.length === 0 ? (
                  <p className="text-slate-400 text-xs text-center py-8">Belum ada data tren.</p>
                ) : (
                  <div className="space-y-2.5">
                    {trendData.map(([month, count]) => {
                      const max = Math.max(...trendData.map(([, c]) => c), 1);
                      return (
                        <div key={month} className="flex items-center gap-3">
                          <span className="text-xs font-bold text-slate-500 w-16 flex-shrink-0">{month}</span>
                          <div className="flex-1 bg-slate-100 rounded-full h-5 overflow-hidden">
                            <div
                              className="h-full bg-indigo-500 rounded-full flex items-center justify-end pr-2 transition-all duration-700"
                              style={{ width: `${(count / max) * 100}%` }}
                            >
                              <span className="text-[10px] text-white font-bold">{count}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Distribusi per Kategori (F-38) */}
              <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-5">
                  <BarChart2 className="w-4 h-4 text-indigo-600" />
                  <h3 className="font-black text-slate-800 text-sm">Distribusi Kategori</h3>
                </div>
                {stats.total === 0 ? (
                  <p className="text-slate-400 text-xs text-center py-8">Belum ada data.</p>
                ) : (
                  <div className="space-y-2.5">
                    {KATEGORI_LIST.map((k) => {
                      const count = perKategori[k] ?? 0;
                      const pct   = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0;
                      return (
                        <div key={k} className="flex items-center gap-3">
                          <span className="text-xs font-bold text-slate-500 w-28 flex-shrink-0 truncate">{k}</span>
                          <div className="flex-1 bg-slate-100 rounded-full h-5 overflow-hidden">
                            <div
                              className="h-full bg-indigo-400 rounded-full flex items-center justify-end pr-2 transition-all duration-700"
                              style={{ width: `${pct}%` }}
                            >
                              {pct > 8 && <span className="text-[10px] text-white font-bold">{count}</span>}
                            </div>
                          </div>
                          <span className="text-xs text-slate-400 font-semibold w-10 text-right">{pct}%</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Metrik Layanan (F-40, F-41) */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm flex items-center gap-5">
                <div className="bg-indigo-50 p-3 rounded-xl">
                  <Clock className="w-6 h-6 text-indigo-600" />
                </div>
                <div>
                  <div className="text-2xl font-black text-slate-900">
                    {stats.avgSelesaiHari > 0 ? `${stats.avgSelesaiHari} hari` : "—"}
                  </div>
                  <div className="text-xs text-slate-500 font-semibold mt-0.5">
                    Rata-rata waktu penyelesaian (F-40)
                  </div>
                </div>
              </div>
              <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm flex items-center gap-5">
                <div className="bg-yellow-50 p-3 rounded-xl">
                  <Star className="w-6 h-6 text-yellow-500" />
                </div>
                <div>
                  <div className="text-2xl font-black text-slate-900 flex items-baseline gap-1">
                    {stats.avgRating > 0 ? stats.avgRating : "—"}
                    <span className="text-sm text-slate-400 font-medium">/ 5</span>
                  </div>
                  <div className="text-xs text-slate-500 font-semibold mt-0.5">
                    Tingkat kepuasan masyarakat (F-41)
                  </div>
                </div>
              </div>
            </div>

            {/* Tabel Export Preview */}
            <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <h3 className="font-black text-slate-800 text-sm">Preview Data Ekspor</h3>
                <span className="text-xs text-slate-400">{filteredComplaints.length} baris</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-wide">
                      <th className="px-4 py-3 text-left">Tiket</th>
                      <th className="px-4 py-3 text-left">Judul</th>
                      <th className="px-4 py-3 text-left">Kategori</th>
                      <th className="px-4 py-3 text-left">Status</th>
                      <th className="px-4 py-3 text-left">Prioritas</th>
                      <th className="px-4 py-3 text-left">Tanggal</th>
                      <th className="px-4 py-3 text-left">Rating</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {filteredComplaints.slice(0, 10).map((c) => (
                      <tr key={c.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="px-4 py-3 font-mono font-bold text-indigo-600">{c.ticketId}</td>
                        <td className="px-4 py-3 font-medium text-slate-700 max-w-[160px] truncate">{c.title}</td>
                        <td className="px-4 py-3 text-slate-500">{c.category}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadgeStyle(c.status)}`}>
                            {c.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 capitalize text-slate-500">{c.priority}</td>
                        <td className="px-4 py-3 text-slate-400">
                          {c.createdAt?.toDate?.()?.toLocaleDateString("id-ID") ?? "-"}
                        </td>
                        <td className="px-4 py-3 text-slate-500">{c.rating ? `${c.rating}★` : "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filteredComplaints.length > 10 && (
                  <div className="px-6 py-3 text-center text-xs text-slate-400 border-t border-slate-50">
                    + {filteredComplaints.length - 10} baris lainnya — klik Ekspor CSV untuk data lengkap
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ══════════════════════════════════
          MODAL TINDAK LANJUT (F-31, F-32, F-34, F-35, F-36)
      ══════════════════════════════════ */}
      <AnimatePresence>
        {selectedComplaint && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial="hidden"
              animate="visible"
              exit="hidden"
              variants={modalAnim}
              className="bg-white rounded-3xl w-full max-w-lg shadow-xl border border-slate-100 overflow-hidden max-h-[90vh] flex flex-col"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                <div>
                  <h3 className="font-black text-slate-900 text-base">Tindak Lanjut Pengaduan</h3>
                  <p className="text-xs text-slate-400 mt-0.5 font-mono font-bold text-indigo-600">
                    {selectedComplaint.ticketId}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedComplaint(null)}
                  className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-all"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Tabs */}
              <div className="flex border-b border-slate-100 px-6">
                {(
                  [
                    { key: "status",   icon: <RotateCcw className="w-3.5 h-3.5" />,     label: "Status & Log" },
                    { key: "komentar", icon: <MessageSquare className="w-3.5 h-3.5" />, label: "Komentar" },
                    { key: "dokumen",  icon: <Paperclip className="w-3.5 h-3.5" />,     label: "Dokumentasi" },
                  ] as const
                ).map(({ key, icon, label }) => (
                  <button
                    key={key}
                    onClick={() => setModalTab(key)}
                    className={`flex items-center gap-1.5 text-xs font-bold py-3 mr-4 border-b-2 transition-all ${
                      modalTab === key
                        ? "border-indigo-600 text-indigo-700"
                        : "border-transparent text-slate-400 hover:text-slate-600"
                    }`}
                  >
                    {icon} {label}
                  </button>
                ))}
              </div>

              {/* Modal Content */}
              <div className="overflow-y-auto flex-1 px-6 py-5">

                {/* ── TAB: Status & Log (F-31, F-32, F-34) ── */}
                {modalTab === "status" && (
                  <form onSubmit={submitStatusUpdate} className="space-y-4">
                    {/* Info ringkas */}
                    <div className="bg-slate-50 rounded-xl p-3 text-xs space-y-1">
                      <p className="font-bold text-slate-700 truncate">{selectedComplaint.title}</p>
                      <p className="text-slate-500">{selectedComplaint.category} · {selectedComplaint.location}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-slate-400">Status saat ini:</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadgeStyle(selectedComplaint.status)}`}>
                          {selectedComplaint.status}
                        </span>
                      </div>
                    </div>

                    {/* Pilih Status Baru (F-31, F-32) */}
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1.5">Pilih Status Baru</label>
                      <select
                        value={newStatusTarget}
                        onChange={(e) => setNewStatusTarget(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 text-sm rounded-xl p-3 outline-none font-medium text-slate-700 focus:border-indigo-600 transition-all"
                        required
                      >
                        <option value="Diterima">🔵 Diterima — Antrean Baru</option>
                        <option value="Diverifikasi">🟡 Diverifikasi — Lolos Verifikasi</option>
                        <option value="Diproses">🟠 Diproses — Pekerjaan Lapangan</option>
                        <option value="Diselesaikan">🟢 Diselesaikan — Selesai Tuntas</option>
                        <option value="Ditolak">🔴 Ditolak — Laporan Tidak Valid</option>
                      </select>
                    </div>

                    {/* Disposisi (F-34) */}
                    {adminList.length > 0 && (
                      <div>
                        <label className="text-xs font-bold text-slate-700 block mb-1.5">
                          <Users className="w-3.5 h-3.5 inline mr-1 -mt-0.5" />
                          Disposisi ke Petugas Lain (opsional)
                        </label>
                        <select
                          value={disposisiTarget}
                          onChange={(e) => setDisposisiTarget(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 text-sm rounded-xl p-3 outline-none font-medium text-slate-700 focus:border-indigo-600 transition-all"
                        >
                          <option value="">— Tidak didisposisi —</option>
                          {adminList
                            .filter((a) => a.uid !== adminUser?.uid)
                            .map((a) => (
                              <option key={a.uid} value={a.email}>
                                {a.name ?? a.email} ({a.role})
                              </option>
                            ))}
                        </select>
                      </div>
                    )}

                    {/* Catatan (F-31 & F-32) */}
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1.5">
                        Catatan Petugas / Alasan Penolakan
                        {newStatusTarget === "Ditolak" && (
                          <span className="text-red-500 ml-1">*</span>
                        )}
                      </label>
                      <textarea
                        rows={3}
                        placeholder={
                          newStatusTarget === "Ditolak"
                            ? "Wajib: tuliskan alasan penolakan yang jelas untuk dicatat dalam sistem…"
                            : "Detail tindakan koordinasi lapangan, progres penanganan, atau catatan tambahan…"
                        }
                        value={statusNote}
                        onChange={(e) => setStatusNote(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 text-sm rounded-xl p-3 outline-none text-slate-700 focus:border-indigo-600 transition-all resize-none"
                        required={newStatusTarget === "Ditolak"}
                      />
                    </div>

                    <div className="flex items-center gap-3 pt-1">
                      <button
                        type="button"
                        onClick={() => setSelectedComplaint(null)}
                        className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs py-3 rounded-xl transition-all"
                      >
                        Batal
                      </button>
                      <button
                        type="submit"
                        className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-3 rounded-xl shadow-md shadow-indigo-100 transition-all"
                      >
                        Simpan Perubahan
                      </button>
                    </div>
                  </form>
                )}

                {/* ── TAB: Komentar / Thread (F-35) ── */}
                {modalTab === "komentar" && (
                  <div className="flex flex-col gap-4 h-full">
                    {/* Thread komentar */}
                    <div className="space-y-3 min-h-[200px]">
                      {loadingComments ? (
                        <div className="flex justify-center py-8">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600" />
                        </div>
                      ) : comments.length === 0 ? (
                        <div className="text-center py-10">
                          <MessageSquare className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                          <p className="text-slate-400 text-xs font-medium">Belum ada komentar.</p>
                        </div>
                      ) : (
                        comments.map((c) => (
                          <div
                            key={c.id}
                            className={`flex gap-2.5 ${c.role === "admin" ? "flex-row-reverse" : "flex-row"}`}
                          >
                            <div
                              className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
                                c.role === "admin"
                                  ? "bg-indigo-100 text-indigo-700"
                                  : "bg-slate-100 text-slate-600"
                              }`}
                            >
                              <User className="w-3.5 h-3.5" />
                            </div>
                            <div
                              className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed ${
                                c.role === "admin"
                                  ? "bg-indigo-600 text-white rounded-tr-sm"
                                  : "bg-slate-100 text-slate-700 rounded-tl-sm"
                              }`}
                            >
                              <p className="font-bold mb-0.5 opacity-70">
                                {c.role === "admin" ? "Admin Kelurahan" : "Masyarakat"}
                              </p>
                              {c.message}
                              <p className={`text-[10px] mt-1 ${c.role === "admin" ? "text-indigo-200" : "text-slate-400"}`}>
                                {c.createdAt?.toDate?.()?.toLocaleString("id-ID") ?? ""}
                              </p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Input balas */}
                    <form onSubmit={submitComment} className="flex items-center gap-2 border-t border-slate-100 pt-3 mt-auto">
                      <input
                        type="text"
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Tulis balasan sebagai admin…"
                        className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs outline-none focus:border-indigo-600 transition-all"
                      />
                      <button
                        type="submit"
                        disabled={!newComment.trim()}
                        className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white p-2.5 rounded-xl transition-all"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    </form>
                  </div>
                )}

                {/* ── TAB: Upload Dokumentasi (F-36) ── */}
                {modalTab === "dokumen" && (
                  <div className="space-y-4">
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Unggah foto bukti penyelesaian atau laporan tertulis sebagai dokumentasi tindak lanjut
                      pengaduan ini ke sistem.
                    </p>

                    {/* Lampiran yang sudah ada */}
                    {selectedComplaint.attachments && selectedComplaint.attachments.length > 0 && (
                      <div>
                        <p className="text-xs font-bold text-slate-600 mb-2">Lampiran Tersimpan</p>
                        <div className="flex flex-wrap gap-2">
                          {selectedComplaint.attachments.map((url, i) => (
                            <a
                              key={i}
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="w-16 h-16 rounded-xl overflow-hidden border border-slate-200 block hover:opacity-80 transition-all"
                            >
                              <img src={url} alt={`Lampiran ${i + 1}`} className="w-full h-full object-cover" />
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Upload baru (F-36) */}
                    <form onSubmit={handleUploadDoc} className="space-y-3">
                      <label className="text-xs font-bold text-slate-700 block">Unggah Dokumentasi Baru</label>
                      <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center hover:border-indigo-400 transition-all">
                        <Paperclip className="w-6 h-6 text-slate-300 mx-auto mb-2" />
                        <input
                          type="file"
                          accept="image/*,.pdf,.doc,.docx"
                          onChange={(e) => setDocFile(e.target.files?.[0] ?? null)}
                          className="text-xs text-slate-500 w-full"
                        />
                        <p className="text-[10px] text-slate-400 mt-2">JPG, PNG, PDF, DOC — maks. 10 MB</p>
                      </div>
                      {docFile && (
                        <p className="text-xs text-indigo-700 bg-indigo-50 px-3 py-2 rounded-xl font-medium">
                          📎 {docFile.name} ({(docFile.size / 1024).toFixed(1)} KB)
                        </p>
                      )}
                      <button
                        type="submit"
                        disabled={!docFile || uploadingDoc}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white font-bold text-xs py-3 rounded-xl transition-all"
                      >
                        {uploadingDoc ? "Mengunggah…" : "Unggah ke Sistem"}
                      </button>
                    </form>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
