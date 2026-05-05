"use client";

import { AdminGuard } from "@/components/auth-guard";
import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import {
  BarChart3,
  Bell,
  Building2,
  ClipboardList,
  CreditCard,
  Database,
  FileText,
  Home,
  LineChart,
  RefreshCw,
  Settings,
  ShieldCheck,
  UserCog,
  Users,
  Wrench,
  type LucideIcon,
} from "lucide-react";

// Admin page wrapper with auth guard
export default function AdminPage() {
  return (
    <AdminGuard>
      <AdminDashboard />
    </AdminGuard>
  );
}

interface User {
  id: string;
  name: string | null;
  email: string;
  role: string;
  unitNumber?: string | null;
  createdAt: string;
}

interface Stats {
  residentCount: number;
  totalIncome: string;
  pendingRequests: number;
  emptyApartments: number;
}

interface DashboardData {
  stats: Stats;
  latestResidents: User[];
}

type AdminTab =
  | "overview"
  | "users"
  | "soh"
  | "buildings"
  | "payments"
  | "requests"
  | "polls"
  | "news"
  | "logs"
  | "settings";

const roleLabel: Record<string, string> = {
  RESIDENT: "Оршин суугч",
  SOH: "СӨХ менежер",
  ADMIN: "Админ",
};

const roleColor: Record<string, string> = {
  RESIDENT: "bg-emerald-50 text-emerald-700 border-emerald-200",
  SOH: "bg-violet-50 text-violet-700 border-violet-200",
  ADMIN: "bg-blue-50 text-blue-700 border-blue-200",
};

const navItems: { key: AdminTab; label: string; Icon: LucideIcon }[] = [
  { key: "overview", label: "Хяналтын самбар", Icon: Home },
  { key: "users", label: "Хэрэглэгчид", Icon: Users },
  { key: "soh", label: "СӨХ менежерүүд", Icon: UserCog },
  { key: "buildings", label: "Байрууд", Icon: Building2 },
  { key: "payments", label: "Төлбөрийн удирдлага", Icon: CreditCard },
  { key: "requests", label: "Засварын хүсэлт", Icon: Wrench },
  { key: "polls", label: "Санал асуулга", Icon: ClipboardList },
  { key: "news", label: "Зарлал, мэдээ", Icon: FileText },
  { key: "logs", label: "Системийн лог", Icon: Database },
  { key: "settings", label: "Тохиргоо", Icon: Settings },
];

function parseMoney(value?: string) {
  return Number(value?.replace(/[^\d.-]/g, "") || 0);
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <section className={`rounded-lg border border-slate-200/70 bg-white shadow-[0_16px_42px_rgba(15,23,42,0.06)] dark:border-slate-600 dark:bg-slate-900 dark:shadow-[0_16px_42px_rgba(0,0,0,0.35)] ${className}`}>
      {children}
    </section>
  );
}

function StatCard({
  title,
  value,
  sub,
  loading,
}: {
  title: string;
  value: string | number;
  sub: string;
  loading: boolean;
}) {
  return (
    <Card className="p-4">
      <p className="mb-2 text-[11px] font-bold text-slate-500 dark:text-slate-400">{title}</p>
      <p className="min-h-8 text-2xl font-black leading-tight text-slate-950 dark:text-slate-50">
        {loading ? <span className="inline-block h-7 w-20 animate-pulse rounded bg-slate-100 dark:bg-slate-700" /> : value}
      </p>
      <p className="mt-1 text-[11px] font-medium text-slate-400 dark:text-slate-500">{sub}</p>
    </Card>
  );
}

function MiniLineChart({ values }: { values: number[] }) {
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = Math.max(max - min, 1);
  const points = values
    .map((value, index) => {
      const x = 24 + index * 82;
      const y = 185 - ((value - min) / range) * 126;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <div className="px-5 pb-5">
      <svg viewBox="0 0 470 220" className="h-[220px] w-full">
        {[0, 1, 2, 3].map((line) => (
          <line key={line} x1="20" x2="450" y1={58 + line * 42} y2={58 + line * 42} stroke="#eef2f7" strokeWidth="1" />
        ))}
        {[0, 1, 2, 3, 4, 5].map((line) => (
          <line key={line} x1={24 + line * 82} x2={24 + line * 82} y1="48" y2="188" stroke="#f4f6fb" strokeWidth="1" />
        ))}
        <polyline points={points} fill="none" stroke="#5b46d6" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        {values.map((value, index) => {
          const x = 24 + index * 82;
          const y = 185 - ((value - min) / range) * 126;
          return <circle key={index} cx={x} cy={y} r="5" fill="#5b46d6" stroke="white" strokeWidth="2" />;
        })}
        <text x="16" y="62" className="fill-slate-400 text-[11px]">30M</text>
        <text x="16" y="104" className="fill-slate-400 text-[11px]">20M</text>
        <text x="16" y="146" className="fill-slate-400 text-[11px]">10M</text>
        <text x="16" y="190" className="fill-slate-400 text-[11px]">0</text>
        {["12-р сар", "1-р сар", "2-р сар", "3-р сар", "4-р сар", "5-р сар"].map((label, index) => (
          <text key={label} x={index === 0 ? 20 : 8 + index * 82} y="214" className="fill-slate-400 text-[11px]">{label}</text>
        ))}
      </svg>
    </div>
  );
}

function DonutChart({ values }: { values: { label: string; value: number; color: string }[] }) {
  const total = values.reduce((sum, item) => sum + item.value, 0) || 1;
  let current = 0;
  const gradient = values
    .map((item) => {
      const start = (current / total) * 360;
      current += item.value;
      const end = (current / total) * 360;
      return `${item.color} ${start}deg ${end}deg`;
    })
    .join(", ");

  return (
    <div className="grid gap-4 px-5 pb-5 pt-1 sm:grid-cols-[180px_1fr] sm:items-center">
      <div className="mx-auto grid h-40 w-40 place-items-center rounded-full" style={{ background: `conic-gradient(${gradient})` }}>
        <div className="grid h-24 w-24 place-items-center rounded-full bg-white shadow-inner">
          <span className="text-xl font-black text-slate-900">{total}</span>
        </div>
      </div>
      <div className="space-y-3">
        {values.map((item) => (
          <div key={item.label} className="flex items-center justify-between gap-3 text-sm">
            <span className="flex items-center gap-2 font-semibold text-slate-600 dark:text-slate-300">
              <span className="h-3 w-3 rounded-sm" style={{ backgroundColor: item.color }} />
              {item.label}
            </span>
            <span className="font-bold text-slate-500 dark:text-slate-400">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function AdminDashboard() {
  const [tab, setTab] = useState<AdminTab>("overview");
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [mounted, setMounted] = useState(false);
  const [updatingRole, setUpdatingRole] = useState<string | null>(null);
  const [successId, setSuccessId] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [createMessage, setCreateMessage] = useState("");
  const [createForm, setCreateForm] = useState({
    name: "",
    email: "",
    password: "",
    unitNumber: "",
    phoneNumber: "",
  });

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/dashboard");
      if (res.ok) {
        const result = await res.json();
        setData(result);
        setLastUpdated(new Date());
      }
    } catch (error) {
      console.error("Failed to fetch:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setMounted(true);
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const updateRole = async (id: string, role: string) => {
    setUpdatingRole(id);
    try {
      const res = await fetch("/api/admin/resident", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, role }),
      });
      if (res.ok) {
        setSuccessId(id);
        setTimeout(() => setSuccessId(null), 2000);
        await fetchData();
      }
    } finally {
      setUpdatingRole(null);
    }
  };

  const createResident = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setCreateLoading(true);
    setCreateMessage("");

    try {
      const res = await fetch("/api/admin/resident", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(createForm),
      });
      const result = await res.json();

      if (!res.ok) {
        setCreateMessage(result.message || "Бүртгэл үүсгэхэд алдаа гарлаа");
        return;
      }

      setCreateForm({ name: "", email: "", password: "", unitNumber: "", phoneNumber: "" });
      setCreateMessage("Оршин суугч амжилттай бүртгэгдлээ");
      setShowCreateForm(false);
      await fetchData();
      setTimeout(() => setCreateMessage(""), 3000);
    } catch {
      setCreateMessage("Сервертэй холбогдоход алдаа гарлаа");
    } finally {
      setCreateLoading(false);
    }
  };

  const users = data?.latestResidents ?? [];
  const residentCount = data?.stats.residentCount ?? 0;
  const sohCount = users.filter((user) => user.role === "SOH").length;
  const income = parseMoney(data?.stats.totalIncome);
  const lineValues = useMemo(() => {
    const base = income > 0 ? income / 1_000_000 : Math.max(residentCount, 4);
    return [base * 0.32, base * 0.58, base * 0.54, base * 0.76, base * 0.88, base].map((item) => Math.round(item));
  }, [income, residentCount]);
  const requestSegments = [
    { label: "Шинэ", value: data?.stats.pendingRequests ?? 0, color: "#3b82f6" },
    { label: "Хүлээгдэж буй", value: Math.max(data?.stats.emptyApartments ?? 0, 1), color: "#f59e0b" },
    { label: "Шийдэгдсэн", value: Math.max(residentCount - (data?.stats.pendingRequests ?? 0), 1), color: "#22c55e" },
    { label: "Цуцлагдсан", value: Math.max(Math.round(residentCount * 0.04), 1), color: "#ef4444" },
  ];

  const titleByTab: Record<AdminTab, string> = {
    overview: "Хяналтын самбар",
    users: "Хэрэглэгчид",
    soh: "СӨХ менежерүүд",
    buildings: "Байрууд",
    payments: "Төлбөрийн удирдлага",
    requests: "Засварын хүсэлт",
    polls: "Санал асуулга",
    news: "Зарлал, мэдээ",
    logs: "Системийн лог",
    settings: "Тохиргоо",
  };

  return (
    <div className="min-h-screen bg-[#eef1f7] p-2 text-slate-950 dark:bg-slate-950 dark:text-slate-100 sm:p-3">
      <div className="mx-auto flex min-h-[calc(100vh-16px)] max-w-[1480px] overflow-hidden rounded-lg border border-slate-200 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.12)] dark:border-slate-700 dark:bg-slate-900 dark:shadow-[0_24px_80px_rgba(0,0,0,0.35)]">
        <aside className="hidden w-[220px] shrink-0 flex-col bg-[#171c49] md:flex">
          <div className="px-4 py-6">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-white/15 bg-white/10">
                <Building2 size={24} className="text-white" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-[12px] font-black uppercase text-white">Өндөр хотхон</p>
                <p className="truncate text-[10px] font-medium text-indigo-100/70">Админ систем</p>
              </div>
            </div>
          </div>

          <nav className="flex-1 space-y-1 px-3">
            {navItems.map(({ key, label, Icon }) => {
              const active = tab === key;
              return (
                <button
                  key={key}
                  onClick={() => setTab(key)}
                  className={`flex min-h-10 w-full items-center gap-2.5 rounded-md px-3 py-2 text-left text-[12px] font-bold transition ${
                    active ? "bg-[#4f3cc9] text-white shadow-[0_10px_24px_rgba(44,31,124,0.36)]" : "text-indigo-100/78 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <Icon size={15} strokeWidth={active ? 2.25 : 1.8} />
                  <span className="truncate">{label}</span>
                </button>
              );
            })}
          </nav>

          <div className="border-t border-white/10 p-3">
            <div className="flex items-center gap-2.5 rounded-md px-2 py-2">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-amber-300 to-orange-400 text-xs font-black text-white">A</div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-bold text-white">Admin</p>
                <p className="truncate text-[10px] text-indigo-100/70">Систем админ</p>
              </div>
            </div>
          </div>
        </aside>

        <main className="min-w-0 flex-1 overflow-y-auto bg-[#fbfcff] dark:bg-slate-950">
          <nav
            className="flex gap-2 overflow-x-auto overscroll-x-contain border-b border-slate-200 bg-white px-3 py-2.5 dark:border-slate-800 dark:bg-slate-950 md:hidden [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            aria-label="Админ цэс"
          >
            {navItems.map(({ key, label, Icon }) => {
              const active = tab === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setTab(key)}
                  className={`flex shrink-0 items-center gap-2 rounded-full border px-3 py-2 text-left text-xs font-bold transition ${
                    active
                      ? "border-indigo-500 bg-indigo-50 text-indigo-900 dark:border-indigo-400/50 dark:bg-indigo-950/60 dark:text-indigo-100"
                      : "border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
                  }`}
                >
                  <Icon size={14} strokeWidth={active ? 2.25 : 1.8} className="shrink-0" />
                  <span className="max-w-[11rem] truncate">{label}</span>
                </button>
              );
            })}
          </nav>
          <div className="relative px-4 pb-24 pt-4 sm:px-6 md:pb-6 lg:px-7">
            <div className="relative">
              <div className="rounded-lg border border-slate-200 bg-white shadow-[0_18px_64px_rgba(15,23,42,0.08)] dark:border-slate-700 dark:bg-slate-900 dark:shadow-[0_18px_64px_rgba(0,0,0,0.35)]">
                <header className="flex flex-col gap-3 border-b border-slate-100 px-4 py-4 dark:border-slate-800 sm:px-5 sm:py-5 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <h1 className="text-lg font-black text-slate-950 dark:text-slate-50 sm:text-xl">{titleByTab[tab]}</h1>
                    <p className="mt-1 text-xs font-medium text-slate-400 dark:text-slate-500">
                      Сайн байна уу, Админ
                      {mounted && lastUpdated ? (
                        <span className="ml-2 inline-flex items-center gap-1 text-slate-300 dark:text-slate-600">
                          <RefreshCw size={10} /> {lastUpdated.toLocaleTimeString("mn-MN")}
                        </span>
                      ) : null}
                    </p>
                  </div>
                  <button
                    onClick={fetchData}
                    className="relative flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:border-violet-200 hover:text-[#4f3cc9] dark:border-slate-600 dark:bg-slate-800 dark:text-slate-400"
                    title="Шинэчлэх"
                  >
                    <Bell size={17} />
                    <span className="absolute right-1.5 top-1.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-red-500" />
                  </button>
                </header>

                <div className="space-y-5 p-4 sm:p-5">
                  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <StatCard title="Нийт хэрэглэгч" value={residentCount.toLocaleString()} sub="Бүртгэлтэй" loading={loading} />
                    <StatCard title="Нийт байр" value={(data?.stats.emptyApartments ?? 0).toLocaleString()} sub="Бүртгэлтэй" loading={loading} />
                    <StatCard title="СӨХ менежер" value={sohCount.toLocaleString()} sub="Идэвхтэй" loading={loading} />
                    <StatCard title="Нийт орлого (энэ сар)" value={data?.stats.totalIncome ?? "0₮"} sub="Нийт төлбөр" loading={loading} />
                  </div>

                  {tab === "overview" ? (
                    <>
                      <div className="grid gap-5 xl:grid-cols-2">
                        <Card className="overflow-hidden">
                          <div className="px-5 py-4">
                            <h2 className="text-sm font-black text-slate-800 dark:text-slate-100">Төлбөрийн орлого (сүүлийн 6 сар)</h2>
                          </div>
                          <MiniLineChart values={lineValues} />
                        </Card>
                        <Card className="overflow-hidden">
                          <div className="px-5 py-4">
                            <h2 className="text-sm font-black text-slate-800 dark:text-slate-100">Засварын хүсэлтийн төлөв</h2>
                          </div>
                          <DonutChart values={requestSegments} />
                        </Card>
                      </div>

                      <CreateResidentPanel
                        show={showCreateForm}
                        setShow={setShowCreateForm}
                        form={createForm}
                        setForm={setCreateForm}
                        onSubmit={createResident}
                        loading={createLoading}
                        message={createMessage}
                      />

                      <UsersTable
                        users={users}
                        loading={loading}
                        mounted={mounted}
                        updatingRole={updatingRole}
                        successId={successId}
                        updateRole={updateRole}
                      />
                    </>
                  ) : tab === "users" || tab === "soh" ? (
                    <>
                      {tab === "users" ? (
                        <CreateResidentPanel
                          show={showCreateForm}
                          setShow={setShowCreateForm}
                          form={createForm}
                          setForm={setCreateForm}
                          onSubmit={createResident}
                          loading={createLoading}
                          message={createMessage}
                        />
                      ) : null}
                      <UsersTable
                        users={tab === "soh" ? users.filter((user) => user.role === "SOH") : users}
                        loading={loading}
                        mounted={mounted}
                        updatingRole={updatingRole}
                        successId={successId}
                        updateRole={updateRole}
                      />
                    </>
                  ) : (
                    <AdminInfoPanel tab={tab} stats={data?.stats} userCount={users.length} />
                  )}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

function CreateResidentPanel({
  show,
  setShow,
  form,
  setForm,
  onSubmit,
  loading,
  message,
}: {
  show: boolean;
  setShow: (show: boolean) => void;
  form: {
    name: string;
    email: string;
    password: string;
    unitNumber: string;
    phoneNumber: string;
  };
  setForm: (form: {
    name: string;
    email: string;
    password: string;
    unitNumber: string;
    phoneNumber: string;
  }) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  loading: boolean;
  message: string;
}) {
  const inputClass =
    "h-11 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-violet-300 focus:ring-2 focus:ring-violet-100";

  return (
    <Card className="p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-sm font-black text-slate-800 dark:text-slate-100">Оршин суугч бүртгэх</h2>
          <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">Public бүртгэл хаалттай. Шинэ оршин суугчийг зөвхөн админ үүсгэнэ.</p>
        </div>
        <button
          type="button"
          onClick={() => setShow(!show)}
          className="rounded-md bg-[#4f3cc9] px-4 py-2.5 text-xs font-black text-white shadow-[0_10px_20px_rgba(79,60,201,0.2)] transition hover:bg-[#3f2faa]"
        >
          {show ? "Form хаах" : "Шинэ оршин суугч"}
        </button>
      </div>

      {message ? (
        <div className={`mt-4 rounded-md border px-4 py-3 text-sm font-bold ${message.includes("амжилттай") ? "border-emerald-100 bg-emerald-50 text-emerald-700" : "border-red-100 bg-red-50 text-red-700"}`}>
          {message}
        </div>
      ) : null}

      {show ? (
        <form onSubmit={onSubmit} className="mt-5 grid gap-3">
          <div className="grid gap-3 md:grid-cols-2">
            <input
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
              placeholder="Нэр"
              className={inputClass}
            />
            <input
              type="email"
              value={form.email}
              onChange={(event) => setForm({ ...form, email: event.target.value })}
              placeholder="Имэйл"
              className={inputClass}
              required
            />
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            <input
              type="password"
              value={form.password}
              onChange={(event) => setForm({ ...form, password: event.target.value })}
              placeholder="Нууц үг"
              className={inputClass}
              required
            />
            <input
              value={form.unitNumber}
              onChange={(event) => setForm({ ...form, unitNumber: event.target.value })}
              placeholder="Байр / тоот"
              className={inputClass}
            />
            <input
              value={form.phoneNumber}
              onChange={(event) => setForm({ ...form, phoneNumber: event.target.value })}
              placeholder="Утас"
              className={inputClass}
            />
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={loading}
              className="rounded-md bg-emerald-600 px-5 py-2.5 text-xs font-black text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Бүртгэж байна..." : "Бүртгэх"}
            </button>
            <button
              type="button"
              onClick={() => setForm({ name: "", email: "", password: "", unitNumber: "", phoneNumber: "" })}
              className="rounded-md border border-slate-200 px-5 py-2.5 text-xs font-bold text-slate-500 transition hover:bg-slate-50 dark:hover:bg-slate-800/80"
            >
              Цэвэрлэх
            </button>
          </div>
        </form>
      ) : null}
    </Card>
  );
}

function UsersTable({
  users,
  loading,
  mounted,
  updatingRole,
  successId,
  updateRole,
}: {
  users: User[];
  loading: boolean;
  mounted: boolean;
  updatingRole: string | null;
  successId: string | null;
  updateRole: (id: string, role: string) => void;
}) {
  return (
    <Card className="overflow-hidden">
      <div className="border-b border-slate-100 px-5 py-4">
        <h2 className="text-sm font-black text-slate-800 dark:text-slate-100">Сүүлд бүртгэгдсэн хэрэглэгчид</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-[11px] text-slate-400 dark:bg-slate-800/80 dark:text-slate-500">
            <tr>
              <th className="px-5 py-3 font-black">№</th>
              <th className="px-5 py-3 font-black">Нэр</th>
              <th className="px-5 py-3 font-black">И-мэйл</th>
              <th className="px-5 py-3 font-black">Роль</th>
              <th className="px-5 py-3 font-black">Байр</th>
              <th className="px-5 py-3 font-black">Огноо</th>
              <th className="px-5 py-3 font-black">Эрх</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
            {loading ? (
              [1, 2, 3].map((item) => (
                <tr key={item}>
                  <td colSpan={7} className="px-5 py-4">
                    <div className="h-4 animate-pulse rounded bg-slate-100 dark:bg-slate-700" />
                  </td>
                </tr>
              ))
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-5 py-10 text-center text-sm text-slate-400 dark:text-slate-500">
                  Хэрэглэгч бүртгэгдээгүй байна.
                </td>
              </tr>
            ) : (
              users.map((user, index) => (
                <tr key={user.id} className="transition hover:bg-slate-50 dark:hover:bg-slate-800/80/80">
                  <td className="px-5 py-3.5 font-bold text-slate-400 dark:text-slate-500">#{String(index + 1).padStart(3, "0")}</td>
                  <td className="px-5 py-3.5 font-bold text-slate-800 dark:text-slate-100">{user.name ?? "Нэргүй"}</td>
                  <td className="px-5 py-3.5 text-slate-500 dark:text-slate-400">{user.email}</td>
                  <td className="px-5 py-3.5">
                    <span className={`rounded-md border px-2.5 py-1 text-xs font-black ${roleColor[user.role] ?? "bg-slate-50 text-slate-600 border-slate-200"}`}>
                      {roleLabel[user.role] ?? user.role}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-slate-500 dark:text-slate-400">{user.unitNumber ?? "—"}</td>
                  <td className="px-5 py-3.5 text-slate-500 dark:text-slate-400">{mounted ? new Date(user.createdAt).toLocaleDateString("mn-MN") : "—"}</td>
                  <td className="px-5 py-3.5">
                    {updatingRole === user.id ? (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-400 dark:text-slate-500">
                        <RefreshCw size={12} className="animate-spin" /> Хадгалж байна
                      </span>
                    ) : successId === user.id ? (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600">
                        <ShieldCheck size={13} /> Хадгалагдлаа
                      </span>
                    ) : (
                      <select
                        key={user.role}
                        defaultValue={user.role}
                        onChange={(event) => updateRole(user.id, event.target.value)}
                        className="rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-600 outline-none transition focus:border-violet-300 focus:ring-2 focus:ring-violet-100"
                      >
                        <option value="RESIDENT">Оршин суугч</option>
                        <option value="SOH">СӨХ</option>
                        <option value="ADMIN">Админ</option>
                      </select>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function AdminInfoPanel({ tab, stats, userCount }: { tab: AdminTab; stats?: Stats; userCount: number }) {
  const items: Record<string, [string, string][]> = {
    buildings: [["Нийт байр", String(stats?.emptyApartments ?? 0)], ["Хэрэглэгч", String(userCount)], ["Төлөв", "Идэвхтэй"]],
    payments: [["Нийт орлого", stats?.totalIncome ?? "0₮"], ["Хүлээгдэж буй", String(stats?.pendingRequests ?? 0)], ["Төлөв", "Хянагдаж байна"]],
    requests: [["Нээлттэй хүсэлт", String(stats?.pendingRequests ?? 0)], ["Шийдэгдсэн", String(Math.max((stats?.residentCount ?? 0) - (stats?.pendingRequests ?? 0), 0))], ["Төлөв", "Идэвхтэй"]],
    polls: [["Санал асуулга", "Системтэй"], ["Оролцоо", "Идэвхтэй"], ["Төлөв", "Нээлттэй"]],
    news: [["Зарлал", "Удирдах"], ["Мэдээ", "Нийтлэх"], ["Төлөв", "Идэвхтэй"]],
    logs: [["Системийн лог", "Хэвийн"], ["Шинэчлэлт", "30 секунд"], ["Төлөв", "Онлайн"]],
    settings: [["Эрх", "Админ"], ["Dashboard", "Идэвхтэй"], ["Төлөв", "Тохируулагдсан"]],
  };

  return (
    <Card className="p-5">
      <div className="grid gap-3 sm:grid-cols-3">
        {(items[tab] ?? []).map(([label, value]) => (
          <div key={label} className="rounded-lg border border-violet-100 bg-violet-50/60 px-4 py-4">
            <p className="text-xs font-black text-violet-500">{label}</p>
            <p className="mt-2 text-2xl font-black text-slate-950 dark:text-slate-50">{value}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}
