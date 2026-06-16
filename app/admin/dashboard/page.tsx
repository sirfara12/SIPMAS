"use client";

import {
    collection,
    getDocs,
    orderBy,
    query,
} from "firebase/firestore";
import { useEffect, useMemo, useState } from "react";

import { db } from "@/lib/firebase";

import {
    AlertTriangle,
    CheckCircle,
    Clock,
    Download,
    FileText,
    Search,
    ShieldCheck,
    TrendingUp,
} from "lucide-react";

interface Complaint {
  id: string;
  ticketId?: string;
  title?: string;
  status?: string;
  category?: string;
  reporterName?: string;
  createdAt?: any;
}

interface DashboardStats {
  total: number;
  diproses: number;
  selesai: number;
  ditolak: number;
}

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);

  const [complaints, setComplaints] = useState<Complaint[]>([]);

  const [stats, setStats] = useState<DashboardStats>({
    total: 0,
    diproses: 0,
    selesai: 0,
    ditolak: 0,
  });

  const [search, setSearch] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [filterMonth, setFilterMonth] = useState("");
  const [filterYear, setFilterYear] = useState("");

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const q = query(
        collection(db, "complaints"),
        orderBy("createdAt", "desc")
      );

      const snapshot = await getDocs(q);

      let total = 0;
      let diproses = 0;
      let selesai = 0;
      let ditolak = 0;

      const dataList: Complaint[] = [];

      snapshot.forEach((doc) => {
        const data = doc.data();

        total++;

        if (data.status === "Diproses") diproses++;
        if (data.status === "Diselesaikan") selesai++;
        if (data.status === "Ditolak") ditolak++;

        dataList.push({
          id: doc.id,
          ...data,
        });
      });

      setComplaints(dataList);

      setStats({
        total,
        diproses,
        selesai,
        ditolak,
      });
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const filteredComplaints = useMemo(() => {
    return complaints.filter((item) => {
      const title = item.title?.toLowerCase() || "";
      const ticket = item.ticketId?.toLowerCase() || "";
      const reporter =
        item.reporterName?.toLowerCase() || "";

      const keyword = search.toLowerCase();

      const matchSearch =
        title.includes(keyword) ||
        ticket.includes(keyword) ||
        reporter.includes(keyword);

      const created =
        item.createdAt?.toDate?.() || new Date();

      const matchDate =
        !filterDate ||
        created.toISOString().slice(0, 10) === filterDate;

      const matchMonth =
        !filterMonth ||
        created.getMonth() + 1 === Number(filterMonth);

      const matchYear =
        !filterYear ||
        created.getFullYear() === Number(filterYear);

      return (
        matchSearch &&
        matchDate &&
        matchMonth &&
        matchYear
      );
    });
  }, [
    complaints,
    search,
    filterDate,
    filterMonth,
    filterYear,
  ]);

  const exportCSV = () => {
    if (filteredComplaints.length === 0) return;

    const headers = [
      "No Tiket",
      "Judul",
      "Status",
      "Kategori",
      "Pelapor",
      "Tanggal",
    ];

    const rows = filteredComplaints.map((item) => [
      item.ticketId || "-",
      item.title || "-",
      item.status || "-",
      item.category || "-",
      item.reporterName || "-",
      item.createdAt?.toDate?.()
        ?.toLocaleDateString("id-ID") || "-",
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.join(",")),
    ].join("\n");

    const blob = new Blob(
      ["\uFEFF" + csvContent],
      {
        type: "text/csv;charset=utf-8;",
      }
    );

    const url =
      window.URL.createObjectURL(blob);

    const link =
      document.createElement("a");

    link.href = url;

    link.setAttribute(
      "download",
      `laporan-pengaduan-${new Date().toISOString().slice(0,10)}.csv`
    );

    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>

          <p className="mt-4 text-slate-500">
            Memuat Dashboard...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 bg-slate-50 p-0 md:p-2">

      {/* HERO */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-600 p-8 text-white shadow-xl shadow-blue-100">

        <div className="absolute right-0 top-0 h-72 w-72 rounded-full bg-white/10 blur-3xl"></div>
        <div className="absolute -left-10 bottom-0 h-44 w-44 rounded-full bg-white/10 blur-3xl"></div>

        <div className="flex items-center gap-4 relative z-10">

          <div className="rounded-2xl bg-white/20 p-3 backdrop-blur-sm">
            <ShieldCheck className="w-8 h-8" />
          </div>

          <div>
            <h1 className="text-4xl font-black">
              Dashboard SIPMAS
            </h1>

            <p className="text-blue-100">
              Sistem Informasi Pengaduan Masyarakat
            </p>
          </div>

        </div>
      </div>

      {/* KARTU STATISTIK */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">

        <Card
          icon={<FileText />}
          title="Total Pengaduan"
          value={stats.total}
          color="blue"
        />

        <Card
          icon={<Clock />}
          title="Diproses"
          value={stats.diproses}
          color="yellow"
        />

        <Card
          icon={<CheckCircle />}
          title="Diselesaikan"
          value={stats.selesai}
          color="green"
        />

        <Card
          icon={<AlertTriangle />}
          title="Ditolak"
          value={stats.ditolak}
          color="red"
        />

      </div>

      {/* RINGKASAN
      <div className="rounded-3xl bg-white/90 p-6 shadow-lg shadow-slate-200/60 backdrop-blur">

        <div className="flex items-center gap-3 mb-5">
          <TrendingUp className="w-5 h-5 text-blue-600" />
          <h2 className="font-bold text-xl">
            Ringkasan Sistem
          </h2>
        </div>

        <p className="text-slate-600">
          Saat ini terdapat{" "}
          <strong>{stats.total}</strong>{" "}
          pengaduan yang tersimpan di sistem.
        </p>

      </div> */}

      

      {/* FILTER */}
      <div className="rounded-3xl bg-white/90 p-6 shadow-lg shadow-slate-200/60 backdrop-blur">

        <div className="flex justify-between items-center mb-5">

          <h2 className="font-bold text-xl">
            Pengaduan Terbaru
          </h2>

          <button
            onClick={exportCSV}
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-white shadow-sm transition hover:bg-blue-700 hover:shadow-md"
          >
            <Download size={18} />
            Export CSV
          </button>

        </div>

        <div className="grid md:grid-cols-4 gap-3 mb-5">

          <div className="relative">

            <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />

            <input
              type="text"
              placeholder="Cari pengaduan..."
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
              className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 py-2 shadow-sm outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
            />
          </div>

          <input
            type="date"
            value={filterDate}
            onChange={(e) =>
              setFilterDate(e.target.value)
            }
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 shadow-sm outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
          />

          <select
            value={filterMonth}
            onChange={(e) =>
              setFilterMonth(e.target.value)
            }
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 shadow-sm outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
          >
            <option value="">Semua Bulan</option>

            {Array.from({ length: 12 }).map(
              (_, i) => (
                <option
                  key={i + 1}
                  value={i + 1}
                >
                  Bulan {i + 1}
                </option>
              )
            )}
          </select>

          <input
            type="number"
            placeholder="Tahun"
            value={filterYear}
            onChange={(e) =>
              setFilterYear(e.target.value)
            }
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 shadow-sm outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
          />

        </div>

        {/* TABEL */}

        <div className="overflow-x-auto rounded-2xl border border-slate-100 bg-white shadow-sm">

          <table className="w-full">

            <thead>

              <tr className="bg-slate-50/80 text-slate-600">

                <th className="text-left p-4">
                  No Tiket
                </th>

                <th className="text-left p-4">
                  Judul
                </th>

                <th className="text-left p-4">
                  Kategori
                </th>

                <th className="text-left p-4">
                  Status
                </th>

                <th className="text-left p-4">
                  Tanggal
                </th>

              </tr>

            </thead>

            <tbody>

              {filteredComplaints
                .slice(0, 10)
                .map((item) => (
                  <tr
                    key={item.id}
                    className="border-b border-slate-100 hover:bg-blue-50/40"
                  >
                    <td className="p-4 font-medium">
                      {item.ticketId}
                    </td>

                    <td className="p-4">
                      {item.title}
                    </td>

                    <td className="p-4">
                      {item.category}
                    </td>

                    <td className="p-4">
                      {item.status}
                    </td>

                    <td className="p-4">
                      {item.createdAt
                        ?.toDate?.()
                        ?.toLocaleDateString(
                          "id-ID"
                        )}
                    </td>
                  </tr>
                ))}

            </tbody>

          </table>

        </div>

      </div>

    </div>
  );
}

function Card({
  icon,
  title,
  value,
}: {
  icon: React.ReactNode;
  title: string;
  value: number;
  color: string;
}) {
  return (
    <div className="rounded-3xl bg-white/90 p-6 shadow-lg shadow-slate-200/60 transition-all hover:-translate-y-1 hover:shadow-xl backdrop-blur">
      <div className="mb-4 text-blue-600">
        {icon}
      </div>

      <p className="text-slate-500 text-sm">
        {title}
      </p>

      <h2 className="text-4xl font-black mt-2">
        {value}
      </h2>
    </div>
  );
}