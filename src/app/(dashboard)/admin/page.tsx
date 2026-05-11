"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import {
  BarChart3,
  Bell,
  ClipboardList,
  CreditCard,
  FileText,
  Home,
  LineChart,
  LogOut,
  Mail,
  Phone,
  RefreshCw,
  ShieldCheck,
  UserCog,
  UserPlus,
  Users,
  Wrench,
  X,
  type LucideIcon,
} from "lucide-react";
import { ResidenceLogo } from "@/components/brand/ResidenceLogo";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { NotificationsModal } from "@/components/notifications/NotificationsModal";

interface User {
  id: string;
  name: string | null;
  email: string;
  role: string;
  unitNumber?: string | null;
  phoneNumber?: string | null;
  avatarUrl?: string | null;
  isActive?: boolean;
  createdAt: string;
  paymentCount?: number;
  requestCount?: number;
  pendingPaymentAmount?: number;
  latestPayment?: { month: string; amount: number; status: string } | null;
}

interface Stats {
  residentCount: number;
  userCount?: number;
  sohCount?: number;
  adminCount?: number;
  totalIncome: string;
  pendingPaymentAmount?: string;
  pendingPayments?: number;
  overduePayments?: number;
  paidPayments?: number;
  totalPayments?: number;
  pendingRequests: number;
  openRequests?: number;
  inProgressRequests?: number;
  resolvedRequests?: number;
  totalRequests?: number;
  pendingRegistrationRequests?: number;
  incompleteProfiles?: number;
  inactiveUsers?: number;
  announcementsCount?: number;
  pollsCount?: number;
  emptyApartments: number;
}

type ActivityItem = {
  id: string;
  type: string;
  title: string;
  description: string;
  createdAt: string;
  tone: string;
};

type UserUpdatePayload = {
  name?: string | null;
  email?: string;
  role?: string;
  unitNumber?: string | null;
  phoneNumber?: string | null;
  avatarUrl?: string | null;
  isActive?: boolean;
  password?: string;
};

interface DashboardData {
  stats: Stats;
  latestResidents: User[];
  recentActivity?: ActivityItem[];
}

type Announcement = { id: string; title: string; content: string; type: string; imageUrl?: string | null; createdAt: string };
type Poll = {
  id: string;
  question: string;
  expiresAt: string | null;
  options: { id: string; text: string; votes: number }[];
};

const ADMIN_NOTIFICATION_READ_KEY = "smart-residence-admin-read-announcements";

interface RegistrationRequest {
  id: string;
  name: string;
  email: string;
  phoneNumber: string | null;
  unitNumber: string | null;
  note: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED";
  createdAt: string;
}

type AdminTab =
  | "overview"
  | "users"
  | "registration"
  | "soh"
  | "buildings"
  | "payments"
  | "requests"
  | "polls"
  | "news";

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
  { key: "registration", label: "Бүртгэлийн хүсэлт", Icon: UserPlus },
  { key: "soh", label: "СӨХ менежерүүд", Icon: UserCog },
  { key: "payments", label: "Төлбөрийн удирдлага", Icon: CreditCard },
  { key: "requests", label: "Засварын хүсэлт", Icon: Wrench },
  { key: "polls", label: "Санал асуулга", Icon: ClipboardList },
  { key: "news", label: "Зарлал, мэдээ", Icon: FileText },
];

function parseMoney(value?: string) {
  return Number(value?.replace(/[^\d.-]/g, "") || 0);
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <section className={`rounded-lg border border-slate-200/80 bg-white shadow-[0_10px_30px_rgba(15,23,42,0.06)] dark:border-slate-700 dark:bg-slate-900 dark:shadow-[0_10px_30px_rgba(0,0,0,0.32)] ${className}`}>
      {children}
    </section>
  );
}

function StatCard({
  Icon,
  title,
  value,
  sub,
  loading,
  tone = "blue",
}: {
  Icon: LucideIcon;
  title: string;
  value: string | number;
  sub: string;
  loading: boolean;
  tone?: "blue" | "emerald" | "amber" | "violet";
}) {
  const toneClass = {
    blue: "border-t-blue-500 bg-blue-50 text-blue-600",
    emerald: "border-t-emerald-500 bg-emerald-50 text-emerald-600",
    amber: "border-t-amber-500 bg-amber-50 text-amber-600",
    violet: "border-t-violet-500 bg-violet-50 text-violet-600",
  }[tone];
  const [borderClass, bgClass, textClass] = toneClass.split(" ");

  return (
    <Card className={`border-t-4 ${borderClass} p-5`}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="mb-2 text-[11px] font-black uppercase tracking-wide text-slate-500 dark:text-slate-400">{title}</p>
          <p className="min-h-9 text-3xl font-black leading-tight text-slate-950 dark:text-slate-50">
            {loading ? <span className="inline-block h-8 w-20 animate-pulse rounded bg-slate-100 dark:bg-slate-700" /> : value}
          </p>
          <p className="mt-2 text-xs font-semibold text-slate-400 dark:text-slate-500">{sub}</p>
        </div>
        <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-lg ${bgClass} ${textClass}`}>
          <Icon size={20} />
        </div>
      </div>
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

export default function AdminDashboard() {
  const [tab, setTab] = useState<AdminTab>("overview");
  const [data, setData] = useState<DashboardData | null>(null);
  const [registrationRequests, setRegistrationRequests] = useState<RegistrationRequest[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [polls, setPolls] = useState<Poll[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [readAnnouncementIds, setReadAnnouncementIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [mounted, setMounted] = useState(false);
  const [updatingRole, setUpdatingRole] = useState<string | null>(null);
  const [savingUserId, setSavingUserId] = useState<string | null>(null);
  const [successId, setSuccessId] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [createMessage, setCreateMessage] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  const [annForm, setAnnForm] = useState({ title: "", content: "", type: "INFO", imageUrl: "" });
  const [annLoading, setAnnLoading] = useState(false);
  const [annDeletingId, setAnnDeletingId] = useState<string | null>(null);
  const [pollForm, setPollForm] = useState({ question: "", options: ["", ""], expiresAt: "" });
  const [pollLoading, setPollLoading] = useState(false);
  const [pollDeletingId, setPollDeletingId] = useState<string | null>(null);
  const [createForm, setCreateForm] = useState({
    name: "",
    email: "",
    password: "",
    unitNumber: "",
    phoneNumber: "",
  });

  const fetchData = useCallback(async () => {
    try {
      const safeJson = async <T,>(url: string, fallback: T): Promise<T> => {
        try {
          const response = await fetch(url);
          if (!response.ok) return fallback;
          return await response.json();
        } catch {
          return fallback;
        }
      };

      const [dashboard, nextAnnouncements, nextPolls, nextRequests] = await Promise.all([
        safeJson<DashboardData | null>("/api/admin/dashboard", null),
        safeJson<Announcement[]>("/api/admin/announcements", []),
        safeJson<Poll[]>("/api/soh/polls", []),
        safeJson<RegistrationRequest[]>("/api/admin/registration-requests", []),
      ]);

      if (dashboard) {
        setData(dashboard);
        setLastUpdated(new Date());
      }
      setAnnouncements(nextAnnouncements);
      setPolls(nextPolls);
      setRegistrationRequests(nextRequests);
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

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(ADMIN_NOTIFICATION_READ_KEY);
      const parsed = stored ? JSON.parse(stored) : [];
      if (Array.isArray(parsed)) {
        setReadAnnouncementIds(parsed.filter((id): id is string => typeof id === "string"));
      }
    } catch {
      setReadAnnouncementIds([]);
    }
  }, []);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  };

  const patchUser = async (id: string, payload: UserUpdatePayload) => {
    setSavingUserId(id);
    try {
      const res = await fetch("/api/admin/resident", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...payload }),
      });
      const result = await res.json().catch(() => ({}));

      if (!res.ok) {
        window.alert(result?.message ?? "Хэрэглэгчийн мэдээлэл хадгалахад алдаа гарлаа.");
        return false;
      }

      setSelectedUser((current) => (current?.id === id ? { ...current, ...result } : current));
      setSuccessId(id);
      setTimeout(() => setSuccessId(null), 2000);
      await fetchData();
      return true;
    } finally {
      setSavingUserId(null);
    }
  };

  const updateRole = async (id: string, role: string) => {
    setUpdatingRole(id);
    try {
      await patchUser(id, { role });
    } finally {
      setUpdatingRole(null);
    }
  };

  const updateRegistrationRequest = async (id: string, status: RegistrationRequest["status"]) => {
    const res = await fetch("/api/admin/registration-requests", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    if (res.ok) {
      await fetchData();
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

  const deleteUser = async (user: User) => {
    const ok = window.confirm(`${user.name ?? user.email} хэрэглэгчийг устгах уу? Холбоотой төлбөр, засварын хүсэлтүүд хамт устах болно.`);
    if (!ok) return;

    setDeletingUserId(user.id);
    try {
      const res = await fetch("/api/admin/resident", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: user.id }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        window.alert(data?.message ?? "Хэрэглэгч устгаж чадсангүй.");
        return;
      }
      setSelectedUser(null);
      await fetchData();
    } finally {
      setDeletingUserId(null);
    }
  };

  const createAnnouncement = async () => {
    if (!annForm.title.trim() || !annForm.content.trim()) return;
    setAnnLoading(true);
    try {
      const res = await fetch("/api/admin/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(annForm),
      });
      if (res.ok) {
        setAnnForm({ title: "", content: "", type: "INFO", imageUrl: "" });
        await fetchData();
      }
    } finally {
      setAnnLoading(false);
    }
  };

  const deleteAnnouncement = async (announcementId: string) => {
    const ok = window.confirm("Энэ зарлалыг устгах уу?");
    if (!ok) return;

    setAnnDeletingId(announcementId);
    try {
      const res = await fetch("/api/admin/announcements", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: announcementId }),
      });
      if (res.ok) await fetchData();
    } finally {
      setAnnDeletingId(null);
    }
  };

  const createPoll = async () => {
    const options = pollForm.options.map((option) => option.trim()).filter(Boolean);
    if (!pollForm.question.trim() || options.length < 2) return;
    setPollLoading(true);
    try {
      const res = await fetch("/api/soh/polls", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: pollForm.question, options, expiresAt: pollForm.expiresAt }),
      });
      if (res.ok) {
        setPollForm({ question: "", options: ["", ""], expiresAt: "" });
        await fetchData();
      }
    } finally {
      setPollLoading(false);
    }
  };

  const deletePoll = async (pollId: string) => {
    setPollDeletingId(pollId);
    try {
      const res = await fetch("/api/soh/polls", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: pollId }),
      });
      if (res.ok) await fetchData();
    } finally {
      setPollDeletingId(null);
    }
  };

  const markAnnouncementsRead = useCallback(() => {
    const ids = announcements.map((announcement) => announcement.id);
    if (ids.length === 0) return;

    setReadAnnouncementIds((current) => {
      const next = Array.from(new Set([...current, ...ids]));
      window.localStorage.setItem(ADMIN_NOTIFICATION_READ_KEY, JSON.stringify(next));
      return next;
    });
  }, [announcements]);

  const users = data?.latestResidents ?? [];
  const residentCount = data?.stats.residentCount ?? 0;
  const sohCount = data?.stats.sohCount ?? users.filter((user) => user.role === "SOH").length;
  const income = parseMoney(data?.stats.totalIncome);
  const unreadAnnouncementCount = announcements.filter((announcement) => !readAnnouncementIds.includes(announcement.id)).length;
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
    registration: "Бүртгэлийн хүсэлт",
    soh: "СӨХ менежерүүд",
    buildings: "Байрууд",
    payments: "Төлбөрийн удирдлага",
    requests: "Засварын хүсэлт",
    polls: "Санал асуулга",
    news: "Зарлал, мэдээ",
  };

  return (
    <div className="min-h-screen bg-[#f4f7fb] p-2 text-slate-950 dark:bg-slate-950 dark:text-slate-100 sm:p-3">
      <div className="mx-auto flex h-[calc(100vh-16px)] max-w-[1540px] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_22px_70px_rgba(15,23,42,0.10)] dark:border-slate-700 dark:bg-slate-900 dark:shadow-[0_22px_70px_rgba(0,0,0,0.35)] sm:h-[calc(100vh-24px)]">
        <aside className="hidden w-[232px] shrink-0 flex-col bg-gradient-to-b from-[#172554] via-[#1e3a8a] to-[#312e81] md:flex">
          <div className="px-4 py-6">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-white/15 bg-white p-1.5 shadow-lg shadow-black/20">
                <ResidenceLogo className="h-full w-full" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-[12px] font-black uppercase text-white">Өндөр хотхон</p>
                <p className="truncate text-[10px] font-medium text-slate-300">Админ систем</p>
              </div>
            </div>
          </div>

          <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto px-3 pb-3 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {navItems.map(({ key, label, Icon }) => {
              const active = tab === key;
              return (
                <button
                  key={key}
                  onClick={() => setTab(key)}
                  className={`flex min-h-10 w-full items-center gap-2.5 rounded-md px-3 py-2 text-left text-[12px] font-bold transition ${
                    active ? "bg-white text-blue-950 shadow-[0_12px_26px_rgba(15,23,42,0.24)]" : "text-blue-100/80 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <Icon size={15} strokeWidth={active ? 2.4 : 1.8} className={active ? "text-blue-600" : "text-blue-100/70"} />
                  <span className="truncate">{label}</span>
                </button>
              );
            })}
          </nav>

          <div className="mt-auto shrink-0 border-t border-white/10 p-3">
            <div className="flex items-center gap-2.5 rounded-md px-2 py-2">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-xs font-black text-slate-950">A</div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-bold text-white">Admin</p>
                <p className="truncate text-[10px] text-slate-400">Систем админ</p>
              </div>
              <button
                onClick={handleLogout}
                title="Гарах"
                className="flex h-8 w-8 items-center justify-center rounded-md text-slate-400 transition hover:bg-white/10 hover:text-white"
              >
                <LogOut size={15} />
              </button>
            </div>
          </div>
        </aside>

        <main className="min-w-0 flex-1 overflow-y-auto bg-[#f8fafc] dark:bg-slate-950">
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
            <button
              onClick={handleLogout}
              className="flex shrink-0 items-center gap-2 rounded-full border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-600 transition hover:bg-red-100"
            >
              <LogOut size={14} />
              Гарах
            </button>
          </nav>
          <div className="relative px-4 pb-24 pt-4 sm:px-6 md:pb-6 lg:px-7">
            <div className="relative">
              <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_16px_52px_rgba(15,23,42,0.08)] dark:border-slate-700 dark:bg-slate-900 dark:shadow-[0_16px_52px_rgba(0,0,0,0.34)]">
                <header className="flex flex-col gap-3 border-b border-slate-100 bg-white px-5 py-5 dark:border-slate-800 dark:bg-slate-900 sm:px-6 sm:py-6 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <h1 className="text-2xl font-black text-slate-950 dark:text-slate-50 sm:text-3xl">{titleByTab[tab]}</h1>
                    <p className="mt-2 text-sm font-medium text-slate-500 dark:text-slate-400">
                      Сайн байна уу, Админ
                      {mounted && lastUpdated ? (
                        <span className="ml-2 inline-flex items-center gap-1 text-slate-400 dark:text-slate-500">
                          <RefreshCw size={12} /> {lastUpdated.toLocaleTimeString("mn-MN")}
                        </span>
                      ) : null}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <ThemeToggle
                      className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:border-violet-200 hover:text-[#4f3cc9] dark:border-slate-600 dark:bg-slate-800 dark:text-slate-400"
                      iconSize={17}
                    />
                    <button
                      onClick={() => {
                        setShowNotifications(true);
                        markAnnouncementsRead();
                      }}
                      className="relative flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:border-violet-200 hover:text-[#4f3cc9] dark:border-slate-600 dark:bg-slate-800 dark:text-slate-400"
                      title="Мэдэгдэл"
                    >
                      <Bell size={17} />
                      {unreadAnnouncementCount > 0 ? (
                        <span className="absolute right-1.5 top-1.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-red-500" />
                      ) : null}
                    </button>
                  </div>
                </header>

                <div className="space-y-5 p-4 sm:p-5">
                  {tab === "overview" ? (
                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                      <StatCard Icon={Users} title="Нийт хэрэглэгч" value={(data?.stats.userCount ?? residentCount).toLocaleString()} sub={`${residentCount.toLocaleString()} оршин суугч`} loading={loading} tone="blue" />
                      <StatCard Icon={UserPlus} title="Бүртгэлийн хүсэлт" value={(data?.stats.pendingRegistrationRequests ?? 0).toLocaleString()} sub="Шалгах шаардлагатай" loading={loading} tone="emerald" />
                      <StatCard Icon={UserCog} title="СӨХ менежер" value={sohCount.toLocaleString()} sub={`${data?.stats.adminCount ?? 1} admin`} loading={loading} tone="amber" />
                      <StatCard Icon={CreditCard} title="Нийт орлого" value={data?.stats.totalIncome ?? "0₮"} sub={`${data?.stats.pendingPaymentAmount ?? "0₮"} хүлээгдэж буй`} loading={loading} tone="violet" />
                    </div>
                  ) : null}

                  {tab === "overview" ? (
                    <>
                      <AdminCommandCenter
                        stats={data?.stats}
                        users={users}
                        registrationRequests={registrationRequests}
                        announcements={announcements}
                        polls={polls}
                        recentActivity={data?.recentActivity ?? []}
                        setTab={setTab}
                        loading={loading}
                      />

                      <div className="grid gap-5 xl:grid-cols-2">
                        <Card className="overflow-hidden">
                          <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4 dark:border-slate-800">
                            <span className="grid h-9 w-9 place-items-center rounded-lg bg-blue-50 text-blue-600">
                              <LineChart size={17} />
                            </span>
                            <h2 className="text-sm font-black text-slate-800 dark:text-slate-100">Төлбөрийн орлого (сүүлийн 6 сар)</h2>
                          </div>
                          <MiniLineChart values={lineValues} />
                        </Card>
                        <Card className="overflow-hidden">
                          <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4 dark:border-slate-800">
                            <span className="grid h-9 w-9 place-items-center rounded-lg bg-amber-50 text-amber-600">
                              <BarChart3 size={17} />
                            </span>
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
                        onSelectUser={setSelectedUser}
                      />
                    </>
                  ) : tab === "registration" ? (
                    <RegistrationRequestsTable
                      requests={registrationRequests}
                      loading={loading}
                      mounted={mounted}
                      updateRequest={updateRegistrationRequest}
                    />
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
                        onSelectUser={setSelectedUser}
                      />
                    </>
                  ) : tab === "polls" ? (
                    <AdminPollsPanel
                      polls={polls}
                      form={pollForm}
                      setForm={setPollForm}
                      loading={pollLoading}
                      deletingId={pollDeletingId}
                      onCreate={createPoll}
                      onDelete={deletePoll}
                      mounted={mounted}
                    />
                  ) : tab === "news" ? (
                    <AdminAnnouncementsPanel
                      announcements={announcements}
                      form={annForm}
                      setForm={setAnnForm}
                      loading={annLoading}
                      deletingId={annDeletingId}
                      onCreate={createAnnouncement}
                      onDelete={deleteAnnouncement}
                      mounted={mounted}
                    />
                  ) : (
                    <AdminInfoPanel tab={tab} stats={data?.stats} userCount={users.length} setTab={setTab} />
                  )}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      <NotificationsModal
        open={showNotifications}
        announcements={announcements}
        onClose={() => setShowNotifications(false)}
        title="Мэдэгдэл"
      />
      {selectedUser ? (
        <AdminUserProfileModal
          user={selectedUser}
          mounted={mounted}
          deleting={deletingUserId === selectedUser.id}
          saving={savingUserId === selectedUser.id}
          onSave={(payload) => patchUser(selectedUser.id, payload)}
          onResetPassword={(password) => patchUser(selectedUser.id, { password })}
          onToggleStatus={(isActive) => patchUser(selectedUser.id, { isActive })}
          onDelete={() => deleteUser(selectedUser)}
          onClose={() => setSelectedUser(null)}
        />
      ) : null}
    </div>
  );
}

function AdminCommandCenter({
  stats,
  users,
  registrationRequests,
  announcements,
  polls,
  recentActivity,
  setTab,
  loading,
}: {
  stats?: Stats;
  users: User[];
  registrationRequests: RegistrationRequest[];
  announcements: Announcement[];
  polls: Poll[];
  recentActivity: ActivityItem[];
  setTab: (tab: AdminTab) => void;
  loading: boolean;
}) {
  const activeUsers = users.filter((user) => user.isActive !== false).length;
  const qualityItems = [
    {
      label: "Бүртгэлийн хүсэлт",
      value: stats?.pendingRegistrationRequests ?? registrationRequests.filter((request) => request.status === "PENDING").length,
      hint: "Approve / reject хийх",
      tone: "border-amber-100 bg-amber-50 text-amber-700",
      target: "registration" as AdminTab,
    },
    {
      label: "Profile дутуу",
      value: stats?.incompleteProfiles ?? users.filter((user) => !user.unitNumber || !user.phoneNumber).length,
      hint: "Тоот, утас дутуу хэрэглэгч",
      tone: "border-blue-100 bg-blue-50 text-blue-700",
      target: "users" as AdminTab,
    },
    {
      label: "Идэвхгүй account",
      value: stats?.inactiveUsers ?? users.filter((user) => user.isActive === false).length,
      hint: "Нэвтрэх эрх хаагдсан",
      tone: "border-red-100 bg-red-50 text-red-700",
      target: "users" as AdminTab,
    },
    {
      label: "Нээлттэй хүсэлт",
      value: stats?.openRequests ?? stats?.pendingRequests ?? 0,
      hint: "СӨХ шийдвэрлэх ажил",
      tone: "border-emerald-100 bg-emerald-50 text-emerald-700",
      target: "requests" as AdminTab,
    },
  ];
  const quickActions = [
    { label: "Хэрэглэгч нэмэх", desc: "Оршин суугчийг admin-аас шууд үүсгэнэ", target: "users" as AdminTab },
    { label: "Санал асуулга", desc: "СӨХ-тэй адил poll үүсгэж удирдана", target: "polls" as AdminTab },
    { label: "Зарлал нийтлэх", desc: "Зурагтай зарлал, мэдээ нийтэлнэ", target: "news" as AdminTab },
    { label: "СӨХ эрх", desc: "Менежерийн role болон account-г удирдана", target: "soh" as AdminTab },
  ];

  return (
    <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
      <Card className="overflow-hidden">
        <div className="border-b border-slate-100 bg-gradient-to-br from-slate-950 via-blue-950 to-violet-950 px-5 py-5 text-white">
          <p className="text-[11px] font-black uppercase tracking-wide text-blue-200">Admin command center</p>
          <h2 className="mt-1 text-xl font-black">Системийн хяналт ба шуурхай үйлдэл</h2>
          <p className="mt-1 text-sm font-medium text-slate-300">
            {activeUsers.toLocaleString()} идэвхтэй account · {announcements.length} зарлал · {polls.length} санал асуулга
          </p>
        </div>
        <div className="grid gap-3 p-5 sm:grid-cols-2 xl:grid-cols-4">
          {qualityItems.map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={() => setTab(item.target)}
              className={`rounded-xl border px-4 py-4 text-left transition hover:-translate-y-0.5 hover:shadow-[0_14px_34px_rgba(15,23,42,0.10)] ${item.tone}`}
            >
              <p className="text-xs font-black">{item.label}</p>
              <p className="mt-2 text-2xl font-black text-slate-950">{loading ? "..." : item.value.toLocaleString()}</p>
              <p className="mt-1 text-[11px] font-bold opacity-75">{item.hint}</p>
            </button>
          ))}
        </div>
        <div className="grid gap-3 border-t border-slate-100 p-5 sm:grid-cols-2 xl:grid-cols-4">
          {quickActions.map((action) => (
            <button
              key={action.label}
              type="button"
              onClick={() => setTab(action.target)}
              className="rounded-xl border border-slate-200 bg-white px-4 py-4 text-left transition hover:border-violet-200 hover:bg-violet-50/50 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800"
            >
              <p className="text-sm font-black text-slate-900 dark:text-slate-50">{action.label}</p>
              <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">{action.desc}</p>
            </button>
          ))}
        </div>
      </Card>

      <Card className="overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-slate-800">
          <div>
            <h2 className="text-sm font-black text-slate-900 dark:text-slate-50">Үйл ажиллагааны түүх</h2>
            <p className="mt-1 text-xs font-medium text-slate-400">Сүүлийн системийн хөдөлгөөнүүд</p>
          </div>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-black text-slate-500 dark:bg-slate-800">
            {recentActivity.length}
          </span>
        </div>
        <div className="max-h-[372px] overflow-y-auto divide-y divide-slate-50 dark:divide-slate-800">
          {recentActivity.length === 0 ? (
            <div className="px-5 py-10 text-center text-sm text-slate-400">Одоогоор activity алга.</div>
          ) : (
            recentActivity.map((activity) => (
              <div key={activity.id} className="flex gap-3 px-5 py-3.5">
                <span className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${
                  activity.tone === "amber" ? "bg-amber-500" : activity.tone === "violet" ? "bg-violet-500" : activity.tone === "emerald" ? "bg-emerald-500" : "bg-blue-500"
                }`} />
                <div className="min-w-0">
                  <p className="truncate text-sm font-black text-slate-900 dark:text-slate-50">{activity.title}</p>
                  <p className="mt-0.5 line-clamp-2 text-xs leading-5 text-slate-500 dark:text-slate-400">{activity.description}</p>
                  <p className="mt-1 text-[11px] font-semibold text-slate-400">
                    {new Date(activity.createdAt).toLocaleString("mn-MN", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
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
          <p className="text-[11px] font-black uppercase tracking-wide text-emerald-600">Quick action</p>
          <h2 className="mt-1 text-base font-black text-slate-900 dark:text-slate-50">Оршин суугч бүртгэх</h2>
          <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">Public бүртгэл хаалттай. Шинэ оршин суугчийг зөвхөн админ үүсгэнэ.</p>
        </div>
        <button
          type="button"
          onClick={() => setShow(!show)}
          className="rounded-md bg-slate-950 px-4 py-2.5 text-xs font-black text-white shadow-[0_10px_20px_rgba(15,23,42,0.18)] transition hover:bg-slate-800 dark:bg-white dark:text-slate-950"
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
        <form onSubmit={onSubmit} className="mt-5 grid gap-3 rounded-lg border border-slate-100 bg-slate-50/60 p-4 dark:border-slate-800 dark:bg-slate-950/40">
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

function RegistrationRequestsTable({
  requests,
  loading,
  mounted,
  updateRequest,
}: {
  requests: RegistrationRequest[];
  loading: boolean;
  mounted: boolean;
  updateRequest: (id: string, status: RegistrationRequest["status"]) => void;
}) {
  const statusClass: Record<RegistrationRequest["status"], string> = {
    PENDING: "border-amber-200 bg-amber-50 text-amber-700",
    APPROVED: "border-emerald-200 bg-emerald-50 text-emerald-700",
    REJECTED: "border-red-200 bg-red-50 text-red-700",
  };

  return (
    <Card className="overflow-hidden">
      <div className="border-b border-slate-100 px-5 py-4">
        <h2 className="text-sm font-black text-slate-800 dark:text-slate-100">Бүртгэлийн хүсэлтүүд</h2>
        <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
          Login хэсгээс илгээсэн хүсэлтүүд. Эндээс зөвшөөрөөд, дараа нь хэрэглэгчийн бүртгэлийг админ үүсгэнэ.
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-[11px] text-slate-400 dark:bg-slate-800/80 dark:text-slate-500">
            <tr>
              <th className="px-5 py-3 font-black">Нэр</th>
              <th className="px-5 py-3 font-black">Имэйл</th>
              <th className="px-5 py-3 font-black">Утас</th>
              <th className="px-5 py-3 font-black">Байр</th>
              <th className="px-5 py-3 font-black">Тайлбар</th>
              <th className="px-5 py-3 font-black">Огноо</th>
              <th className="px-5 py-3 font-black">Төлөв</th>
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
            ) : requests.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-5 py-10 text-center text-sm text-slate-400 dark:text-slate-500">
                  Бүртгэлийн хүсэлт алга байна.
                </td>
              </tr>
            ) : (
              requests.map((request) => (
                <tr key={request.id} className="transition hover:bg-slate-50 dark:hover:bg-slate-800/80">
                  <td className="px-5 py-3.5 font-bold text-slate-800 dark:text-slate-100">{request.name}</td>
                  <td className="px-5 py-3.5 text-slate-500 dark:text-slate-400">{request.email}</td>
                  <td className="px-5 py-3.5 text-slate-500 dark:text-slate-400">{request.phoneNumber ?? "—"}</td>
                  <td className="px-5 py-3.5 text-slate-500 dark:text-slate-400">{request.unitNumber ?? "—"}</td>
                  <td className="max-w-[280px] px-5 py-3.5 text-slate-500 dark:text-slate-400">
                    <span className="line-clamp-2">{request.note ?? "—"}</span>
                  </td>
                  <td className="px-5 py-3.5 text-slate-500 dark:text-slate-400">
                    {mounted ? new Date(request.createdAt).toLocaleDateString("mn-MN") : "—"}
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`rounded-md border px-2.5 py-1 text-xs font-black ${statusClass[request.status]}`}>
                        {request.status}
                      </span>
                      <select
                        value={request.status}
                        onChange={(event) => updateRequest(request.id, event.target.value as RegistrationRequest["status"])}
                        className="rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-600 outline-none transition focus:border-violet-300 focus:ring-2 focus:ring-violet-100"
                      >
                        <option value="PENDING">PENDING</option>
                        <option value="APPROVED">APPROVED</option>
                        <option value="REJECTED">REJECTED</option>
                      </select>
                    </div>
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

function AdminPollsPanel({
  polls,
  form,
  setForm,
  loading,
  deletingId,
  onCreate,
  onDelete,
  mounted,
}: {
  polls: Poll[];
  form: { question: string; options: string[]; expiresAt: string };
  setForm: (form: { question: string; options: string[]; expiresAt: string }) => void;
  loading: boolean;
  deletingId: string | null;
  onCreate: () => void;
  onDelete: (pollId: string) => void;
  mounted: boolean;
}) {
  const inputClass = "h-11 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-violet-300 focus:ring-2 focus:ring-violet-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100";

  return (
    <div className="grid gap-5 xl:grid-cols-[0.85fr_1.15fr]">
      <Card className="p-5">
        <h2 className="text-sm font-black text-slate-800 dark:text-slate-100">Санал асуулга үүсгэх</h2>
        <p className="mt-1 text-xs leading-5 text-slate-400">Admin эндээс СӨХ-тэй адил санал асуулга шууд үүсгэнэ.</p>
        <div className="mt-4 grid gap-3">
          <input value={form.question} onChange={(event) => setForm({ ...form, question: event.target.value })} placeholder="Асуулт" className={inputClass} />
          {form.options.map((option, index) => (
            <input
              key={index}
              value={option}
              onChange={(event) => {
                const options = [...form.options];
                options[index] = event.target.value;
                setForm({ ...form, options });
              }}
              placeholder={`Сонголт ${index + 1}`}
              className={inputClass}
            />
          ))}
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => setForm({ ...form, options: [...form.options, ""] })} className="rounded-md border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 transition hover:bg-slate-50">
              Сонголт нэмэх
            </button>
            {form.options.length > 2 ? (
              <button type="button" onClick={() => setForm({ ...form, options: form.options.slice(0, -1) })} className="rounded-md border border-red-200 px-3 py-2 text-xs font-bold text-red-600 transition hover:bg-red-50">
                Сүүлийн сонголт хасах
              </button>
            ) : null}
          </div>
          <input type="date" value={form.expiresAt} onChange={(event) => setForm({ ...form, expiresAt: event.target.value })} className={inputClass} />
          <button onClick={onCreate} disabled={loading || !form.question.trim() || form.options.filter((item) => item.trim()).length < 2} className="rounded-md bg-[#4f3cc9] px-5 py-2.5 text-xs font-black text-white transition hover:bg-[#3f2faa] disabled:opacity-50">
            {loading ? "Үүсгэж байна..." : "Санал асуулга үүсгэх"}
          </button>
        </div>
      </Card>

      <Card className="overflow-hidden">
        <div className="border-b border-slate-100 px-5 py-4 dark:border-slate-800">
          <h2 className="text-sm font-black text-slate-800 dark:text-slate-100">Идэвхтэй санал асуулгууд</h2>
        </div>
        <div className="divide-y divide-slate-50 dark:divide-slate-800">
          {polls.length === 0 ? (
            <div className="px-5 py-10 text-center text-sm text-slate-400">Санал асуулга алга байна.</div>
          ) : (
            polls.map((poll) => {
              const total = poll.options.reduce((sum, option) => sum + option.votes, 0);
              return (
                <div key={poll.id} className="px-5 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-black text-slate-900 dark:text-slate-50">{poll.question}</p>
                      <p className="mt-1 text-xs text-slate-400">Дуусах: {poll.expiresAt && mounted ? new Date(poll.expiresAt).toLocaleDateString("mn-MN") : "Нээлттэй"} · Нийт санал: {total}</p>
                    </div>
                    <button onClick={() => onDelete(poll.id)} disabled={deletingId === poll.id} className="rounded-md border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-bold text-red-700 transition hover:bg-red-100 disabled:opacity-50">
                      {deletingId === poll.id ? "Устгаж байна..." : "Устгах"}
                    </button>
                  </div>
                  <div className="mt-3 grid gap-2">
                    {poll.options.map((option) => {
                      const percent = total ? Math.round((option.votes / total) * 100) : 0;
                      return (
                        <div key={option.id}>
                          <div className="mb-1 flex justify-between text-xs font-bold text-slate-500">
                            <span>{option.text}</span>
                            <span>{option.votes} санал · {percent}%</span>
                          </div>
                          <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                            <div className="h-full rounded-full bg-violet-500" style={{ width: `${percent}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </Card>
    </div>
  );
}

function AdminAnnouncementsPanel({
  announcements,
  form,
  setForm,
  loading,
  deletingId,
  onCreate,
  onDelete,
  mounted,
}: {
  announcements: Announcement[];
  form: { title: string; content: string; type: string; imageUrl: string };
  setForm: (form: { title: string; content: string; type: string; imageUrl: string }) => void;
  loading: boolean;
  deletingId: string | null;
  onCreate: () => void;
  onDelete: (announcementId: string) => void;
  mounted: boolean;
}) {
  const inputClass = "w-full rounded-md border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-violet-300 focus:ring-2 focus:ring-violet-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100";
  const handleImage = (file?: File) => {
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") setForm({ ...form, imageUrl: reader.result });
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="grid gap-5 xl:grid-cols-[0.85fr_1.15fr]">
      <Card className="p-5">
        <h2 className="text-sm font-black text-slate-800 dark:text-slate-100">Зарлал, мэдээ нийтлэх</h2>
        <p className="mt-1 text-xs leading-5 text-slate-400">Admin эндээс оршин суугчдад харагдах мэдээ, зарлалыг шууд нийтэлнэ.</p>
        <div className="mt-4 grid gap-3">
          <input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="Гарчиг" className={inputClass} />
          <textarea value={form.content} onChange={(event) => setForm({ ...form, content: event.target.value })} placeholder="Агуулга" rows={4} className={`${inputClass} resize-none`} />
          <select value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value })} className={inputClass}>
            <option value="INFO">Мэдээлэл</option>
            <option value="WARNING">Анхааруулга</option>
            <option value="URGENT">Яаралтай</option>
          </select>
          {form.imageUrl ? (
            <div className="overflow-hidden rounded-xl border border-slate-200">
              <img src={form.imageUrl} alt="" className="h-40 w-full object-cover" />
              <button type="button" onClick={() => setForm({ ...form, imageUrl: "" })} className="w-full px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50">Зураг устгах</button>
            </div>
          ) : (
            <label className="flex cursor-pointer justify-center rounded-lg border border-dashed border-slate-300 px-4 py-3 text-sm font-bold text-slate-500 transition hover:bg-slate-50">
              Зураг оруулах
              <input type="file" accept="image/*" onChange={(event) => handleImage(event.target.files?.[0])} className="hidden" />
            </label>
          )}
          <button onClick={onCreate} disabled={loading || !form.title.trim() || !form.content.trim()} className="rounded-md bg-[#4f3cc9] px-5 py-2.5 text-xs font-black text-white transition hover:bg-[#3f2faa] disabled:opacity-50">
            {loading ? "Нийтэлж байна..." : "Нийтлэх"}
          </button>
        </div>
      </Card>

      <Card className="overflow-hidden">
        <div className="border-b border-slate-100 px-5 py-4 dark:border-slate-800">
          <h2 className="text-sm font-black text-slate-800 dark:text-slate-100">Сүүлийн зарлалууд</h2>
        </div>
        <div className="divide-y divide-slate-50 dark:divide-slate-800">
          {announcements.length === 0 ? (
            <div className="px-5 py-10 text-center text-sm text-slate-400">Зарлал алга байна.</div>
          ) : (
            announcements.map((announcement) => (
              <div key={announcement.id} className="grid gap-3 px-5 py-4 sm:grid-cols-[140px_1fr]">
                {announcement.imageUrl ? (
                  <img src={announcement.imageUrl} alt="" className="h-24 w-full rounded-lg object-cover" />
                ) : (
                  <div className="grid h-24 place-items-center rounded-lg bg-violet-50 text-xs font-black text-violet-500">Зураггүй</div>
                )}
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-black text-slate-900 dark:text-slate-50">{announcement.title}</p>
                    <span className="rounded-md bg-violet-50 px-2 py-0.5 text-[11px] font-black text-violet-600">{announcement.type}</span>
                  </div>
                  <p className="mt-1 line-clamp-2 text-sm leading-5 text-slate-500">{announcement.content}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-3">
                    <p className="text-xs text-slate-400">{mounted ? new Date(announcement.createdAt).toLocaleDateString("mn-MN") : "—"}</p>
                    <button
                      type="button"
                      onClick={() => onDelete(announcement.id)}
                      disabled={deletingId === announcement.id}
                      className="rounded-md border border-red-200 bg-red-50 px-2.5 py-1 text-[11px] font-black text-red-600 transition hover:bg-red-100 disabled:opacity-50"
                    >
                      {deletingId === announcement.id ? "Устгаж байна..." : "Устгах"}
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}

function UsersTable({
  users,
  loading,
  mounted,
  updatingRole,
  successId,
  updateRole,
  onSelectUser,
}: {
  users: User[];
  loading: boolean;
  mounted: boolean;
  updatingRole: string | null;
  successId: string | null;
  updateRole: (id: string, role: string) => void;
  onSelectUser: (user: User) => void;
}) {
  return (
    <Card className="overflow-hidden">
      <div className="flex flex-col gap-2 border-b border-slate-100 bg-slate-50/60 px-5 py-4 dark:border-slate-800 dark:bg-slate-800/30 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-sm font-black text-slate-800 dark:text-slate-100">Сүүлд бүртгэгдсэн хэрэглэгчид</h2>
          <p className="mt-1 text-xs font-medium text-slate-400">Мөр дээр дарж profile, төлбөр, хүсэлтийн товч мэдээллийг харна.</p>
        </div>
        <span className="w-fit rounded-full bg-white px-3 py-1 text-xs font-black text-slate-500 ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-700">{users.length} хэрэглэгч</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-white text-[11px] uppercase tracking-wide text-slate-400 dark:bg-slate-900 dark:text-slate-500">
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
                <tr
                  key={user.id}
                  onClick={() => onSelectUser(user)}
                  className="cursor-pointer transition hover:bg-blue-50/50 dark:hover:bg-slate-800/80"
                >
                  <td className="px-5 py-3.5 font-bold text-slate-400 dark:text-slate-500">#{String(index + 1).padStart(3, "0")}</td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      {user.avatarUrl ? (
                        <img src={user.avatarUrl} alt="" className="h-9 w-9 rounded-full object-cover ring-1 ring-slate-200" />
                      ) : (
                        <div className="grid h-9 w-9 place-items-center rounded-full bg-violet-50 text-xs font-black text-violet-700 ring-1 ring-violet-100">
                          {(user.name ?? user.email ?? "?").slice(0, 1).toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="truncate font-bold text-slate-800 dark:text-slate-100">{user.name ?? "Нэргүй"}</p>
                        <p className="text-[11px] font-semibold text-slate-400">Дэлгэрэнгүй харах</p>
                      </div>
                    </div>
                  </td>
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
                        onClick={(event) => event.stopPropagation()}
                        onChange={(event) => {
                          event.stopPropagation();
                          updateRole(user.id, event.target.value);
                        }}
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

function AdminUserProfileModal({
  user,
  mounted,
  deleting,
  saving,
  onSave,
  onResetPassword,
  onToggleStatus,
  onDelete,
  onClose,
}: {
  user: User;
  mounted: boolean;
  deleting: boolean;
  saving: boolean;
  onSave: (payload: UserUpdatePayload) => Promise<boolean>;
  onResetPassword: (password: string) => Promise<boolean>;
  onToggleStatus: (isActive: boolean) => Promise<boolean>;
  onDelete: () => void;
  onClose: () => void;
}) {
  const pendingAmount = user.pendingPaymentAmount ?? 0;
  const [form, setForm] = useState({
    name: user.name ?? "",
    email: user.email,
    phoneNumber: user.phoneNumber ?? "",
    unitNumber: user.unitNumber ?? "",
    avatarUrl: user.avatarUrl ?? "",
    role: user.role,
  });
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    setForm({
      name: user.name ?? "",
      email: user.email,
      phoneNumber: user.phoneNumber ?? "",
      unitNumber: user.unitNumber ?? "",
      avatarUrl: user.avatarUrl ?? "",
      role: user.role,
    });
    setNewPassword("");
    setMessage("");
  }, [user]);

  const inputClass = "h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-violet-300 focus:ring-2 focus:ring-violet-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100";
  const saveProfile = async () => {
    const ok = await onSave({
      name: form.name,
      email: form.email,
      phoneNumber: form.phoneNumber,
      unitNumber: form.unitNumber,
      avatarUrl: form.avatarUrl,
      role: form.role,
    });
    setMessage(ok ? "Мэдээлэл хадгалагдлаа." : "Хадгалахад алдаа гарлаа.");
  };
  const resetPassword = async () => {
    if (newPassword.trim().length < 6) {
      setMessage("Нууц үг хамгийн багадаа 6 тэмдэгт байна.");
      return;
    }
    const ok = await onResetPassword(newPassword.trim());
    if (ok) setNewPassword("");
    setMessage(ok ? "Нууц үг шинэчлэгдлээ." : "Нууц үг шинэчлэхэд алдаа гарлаа.");
  };
  const detailRows = [
    ["Имэйл", user.email],
    ["Утас", user.phoneNumber ?? "—"],
    ["Байр / тоот", user.unitNumber ?? "—"],
    ["Эрх", roleLabel[user.role] ?? user.role],
    ["Account", user.isActive === false ? "Идэвхгүй" : "Идэвхтэй"],
    ["Бүртгэсэн огноо", mounted ? new Date(user.createdAt).toLocaleDateString("mn-MN") : "—"],
  ];

  return (
    <div className="fixed inset-0 z-[85] grid place-items-end bg-slate-950/45 p-0 backdrop-blur-sm sm:place-items-center sm:p-4" onClick={onClose}>
      <div className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-t-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900 sm:rounded-2xl" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-slate-800">
          <div className="flex items-center gap-3">
            {user.avatarUrl ? (
              <img src={user.avatarUrl} alt="" className="h-14 w-14 rounded-2xl object-cover ring-1 ring-slate-200" />
            ) : (
              <div className="grid h-14 w-14 place-items-center rounded-2xl bg-violet-50 text-xl font-black text-violet-700 ring-1 ring-violet-100">
                {(user.name ?? user.email ?? "?").slice(0, 1).toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <h2 className="truncate text-lg font-black text-slate-950 dark:text-slate-50">{user.name ?? "Нэргүй хэрэглэгч"}</h2>
              <p className="mt-0.5 text-xs font-semibold text-slate-400">{roleLabel[user.role] ?? user.role}</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800" aria-label="Хаах">
            <X size={18} />
          </button>
        </div>

        <div className="min-h-0 overflow-y-auto p-5">
          <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
            <Card className="overflow-hidden shadow-none">
              <div className="border-b border-slate-100 px-5 py-4 dark:border-slate-800">
                <h3 className="text-sm font-black text-slate-800 dark:text-slate-100">Хэрэглэгчийн мэдээлэл</h3>
              </div>
              <div className="divide-y divide-slate-50 dark:divide-slate-800">
                {detailRows.map(([label, value]) => (
                  <div key={label} className="flex items-center justify-between gap-4 px-5 py-3 text-sm">
                    <span className="font-semibold text-slate-400">{label}</span>
                    <span className="text-right font-bold text-slate-800 dark:text-slate-100">{value}</span>
                  </div>
                ))}
              </div>
            </Card>

            <div className="grid gap-3">
              <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-4 dark:border-emerald-900/50 dark:bg-emerald-950/30">
                <p className="text-xs font-black text-emerald-700 dark:text-emerald-300">Төлбөрийн үлдэгдэл</p>
                <p className="mt-2 text-2xl font-black text-emerald-950 dark:text-emerald-100">{pendingAmount.toLocaleString()}₮</p>
                <p className="mt-1 text-[11px] font-semibold text-emerald-700/70">{user.paymentCount ?? 0} төлбөрийн бүртгэл</p>
              </div>
              <div className="rounded-xl border border-amber-100 bg-amber-50 px-4 py-4 dark:border-amber-900/50 dark:bg-amber-950/25">
                <p className="text-xs font-black text-amber-700 dark:text-amber-300">Засварын хүсэлт</p>
                <p className="mt-2 text-2xl font-black text-amber-950 dark:text-amber-100">{user.requestCount ?? 0}</p>
                <p className="mt-1 text-[11px] font-semibold text-amber-700/70">Нийт бүртгэгдсэн хүсэлт</p>
              </div>
              <div className="rounded-xl border border-violet-100 bg-violet-50 px-4 py-4 dark:border-violet-900/50 dark:bg-violet-950/25">
                <p className="text-xs font-black text-violet-700 dark:text-violet-300">Сүүлийн төлбөр</p>
                <p className="mt-2 text-sm font-black text-slate-950 dark:text-slate-50">
                  {user.latestPayment ? `${user.latestPayment.month} · ${user.latestPayment.amount.toLocaleString()}₮` : "Мэдээлэл алга"}
                </p>
                <p className="mt-1 text-[11px] font-semibold text-violet-700/70">{user.latestPayment?.status ?? "—"}</p>
              </div>
            </div>
          </div>

          <Card className="mt-4 overflow-hidden shadow-none">
            <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-sm font-black text-slate-800 dark:text-slate-100">Admin edit</h3>
                <p className="mt-1 text-xs font-medium text-slate-400">Profile, role, avatar болон account төлөвийг нэг дор засна.</p>
              </div>
              <button
                type="button"
                onClick={() => onToggleStatus(user.isActive === false)}
                className={`rounded-lg px-4 py-2 text-xs font-black text-white transition ${user.isActive === false ? "bg-emerald-600 hover:bg-emerald-700" : "bg-slate-900 hover:bg-slate-800"}`}
              >
                {user.isActive === false ? "Account идэвхжүүлэх" : "Account хаах"}
              </button>
            </div>
            <div className="grid gap-3 p-5 md:grid-cols-2">
              <input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Нэр" className={inputClass} />
              <input value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} placeholder="И-мэйл" className={inputClass} />
              <input value={form.phoneNumber} onChange={(event) => setForm({ ...form, phoneNumber: event.target.value })} placeholder="Утас" className={inputClass} />
              <input value={form.unitNumber} onChange={(event) => setForm({ ...form, unitNumber: event.target.value })} placeholder="Байр / тоот" className={inputClass} />
              <input value={form.avatarUrl} onChange={(event) => setForm({ ...form, avatarUrl: event.target.value })} placeholder="Profile зураг URL эсвэл data URL" className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-violet-300 focus:ring-2 focus:ring-violet-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 md:col-span-2" />
              <select value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value })} className={inputClass}>
                <option value="RESIDENT">Оршин суугч</option>
                <option value="SOH">СӨХ</option>
                <option value="ADMIN">Админ</option>
              </select>
              <button
                type="button"
                onClick={saveProfile}
                disabled={saving}
                className="h-10 rounded-lg bg-violet-600 px-4 text-xs font-black text-white transition hover:bg-violet-700 disabled:opacity-60"
              >
                {saving ? "Хадгалж байна..." : "Мэдээлэл хадгалах"}
              </button>
              <div className="grid gap-2 md:col-span-2 sm:grid-cols-[1fr_auto]">
                <input type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} placeholder="Шинэ нууц үг" className={inputClass} />
                <button type="button" onClick={resetPassword} className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-black text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">
                  Password reset
                </button>
              </div>
              {message ? <p className="text-xs font-bold text-emerald-600 md:col-span-2">{message}</p> : null}
            </div>
          </Card>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <a href={`mailto:${user.email}`} className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">
              <Mail size={16} />
              Имэйл илгээх
            </a>
          <a href={user.phoneNumber ? `tel:${user.phoneNumber}` : undefined} className={`inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-black transition ${user.phoneNumber ? "border-slate-200 text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800" : "pointer-events-none border-slate-100 text-slate-300 dark:border-slate-800 dark:text-slate-600"}`}>
              <Phone size={16} />
              Утас руу залгах
            </a>
          </div>
          <div className="mt-4 rounded-xl border border-red-100 bg-red-50 p-4 dark:border-red-900/50 dark:bg-red-950/20">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-black text-red-700 dark:text-red-300">Хэрэглэгч устгах</p>
                <p className="mt-1 text-xs leading-5 text-red-600/75 dark:text-red-200/70">
                  Устгавал хэрэглэгчийн төлбөр болон засварын хүсэлтийн бүртгэлүүд хамт цэвэрлэгдэнэ.
                </p>
              </div>
              <button
                type="button"
                onClick={onDelete}
                disabled={deleting}
                className="shrink-0 rounded-lg bg-red-600 px-4 py-2.5 text-xs font-black text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {deleting ? "Устгаж байна..." : "Устгах"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function AdminInfoPanel({ tab, stats, userCount, setTab }: { tab: AdminTab; stats?: Stats; userCount: number; setTab: (tab: AdminTab) => void }) {
  const meta: Record<string, { title: string; description: string; tone: string; statTone: string }> = {
    buildings: {
      title: "Байруудын бүртгэл",
      description: "Байр, тоот болон оршин суугчийн хамрагдалтын ерөнхий төлөв.",
      tone: "from-sky-50 to-white border-sky-100 text-sky-700",
      statTone: "border-sky-100 bg-sky-50/70 text-sky-600",
    },
    payments: {
      title: "Төлбөрийн удирдлага",
      description: "Орлого, хүлээгдэж буй төлбөр болон төлбөрийн хяналтын товч мэдээлэл.",
      tone: "from-emerald-50 to-white border-emerald-100 text-emerald-700",
      statTone: "border-emerald-100 bg-emerald-50/70 text-emerald-600",
    },
    requests: {
      title: "Засварын хүсэлтийн хяналт",
      description: "Нээлттэй болон шийдэгдсэн хүсэлтүүдийн одоогийн төлөв.",
      tone: "from-amber-50 to-white border-amber-100 text-amber-700",
      statTone: "border-amber-100 bg-amber-50/70 text-amber-600",
    },
    polls: {
      title: "Санал асуулгын төв",
      description: "Санал асуулга, оролцоо болон нээлттэй төлөвийн ерөнхий мэдээлэл.",
      tone: "from-orange-50 to-white border-orange-100 text-orange-700",
      statTone: "border-orange-100 bg-orange-50/70 text-orange-600",
    },
    news: {
      title: "Зарлал, мэдээ",
      description: "Оршин суугчдад хүргэх зарлал, мэдээний удирдлагын хэсэг.",
      tone: "from-violet-50 to-white border-violet-100 text-violet-700",
      statTone: "border-violet-100 bg-violet-50/70 text-violet-600",
    },
  };
  const items: Record<string, [string, string][]> = {
    buildings: [["Нийт байр", String(stats?.emptyApartments ?? 0)], ["Хэрэглэгч", String(userCount)], ["Төлөв", "Идэвхтэй"]],
    payments: [["Нийт орлого", stats?.totalIncome ?? "0₮"], ["Хүлээгдэж буй", String(stats?.pendingRequests ?? 0)], ["Төлөв", "Хянагдаж байна"]],
    requests: [["Нээлттэй хүсэлт", String(stats?.pendingRequests ?? 0)], ["Шийдэгдсэн", String(Math.max((stats?.residentCount ?? 0) - (stats?.pendingRequests ?? 0), 0))], ["Төлөв", "Идэвхтэй"]],
    polls: [["Санал асуулга", "Системтэй"], ["Оролцоо", "Идэвхтэй"], ["Төлөв", "Нээлттэй"]],
    news: [["Зарлал", "Удирдах"], ["Мэдээ", "Нийтлэх"], ["Төлөв", "Идэвхтэй"]],
  };
  const actions: Record<string, { label: string; desc: string; target?: AdminTab }[]> = {
    buildings: [
      { label: "Хэрэглэгчийн жагсаалт", desc: "Байр/тоот бүртгэлтэй хэрэглэгчдийг шалгах", target: "users" },
      { label: "СӨХ менежерүүд", desc: "Байр хариуцах менежерийн эрхийг харах", target: "soh" },
      { label: "Бүртгэлийн хүсэлт", desc: "Шинэ оршин суугчийн хүсэлтийг батлах", target: "registration" },
    ],
    payments: [
      { label: "Хяналтын самбар", desc: "Орлого болон төлбөрийн график харах", target: "overview" },
      { label: "Хэрэглэгч сонгох", desc: "Хэрэглэгчийн profile дээр төлбөрийн summary харах", target: "users" },
      { label: "AI туслах", desc: "Төлбөрийн дата асууж хурдан дүгнэлт авах" },
    ],
    requests: [
      { label: "Хяналтын самбар", desc: "Засварын хүсэлтийн donut төлөв харах", target: "overview" },
      { label: "Оршин суугчид", desc: "Хүсэлт гаргасан хэрэглэгчийн дэлгэрэнгүйг харах", target: "users" },
      { label: "СӨХ менежерүүд", desc: "Хүсэлт хариуцах эрхтэй хэрэглэгчдийг шалгах", target: "soh" },
    ],
    polls: [
      { label: "Шууд үүсгэх", desc: "Энэ tab дээрээс admin санал асуулга үүсгэж удирдана", target: "polls" },
      { label: "Зарлалтай холбох", desc: "Санал асуулгын дүнг зарлалаар мэдээлэх", target: "news" },
      { label: "AI дүгнэлт", desc: "Оролцоо, саналын үр дүнг AI-аас асуух" },
    ],
    news: [
      { label: "Шууд нийтлэх", desc: "Энэ tab дээрээс зурагтай зарлал, мэдээ нийтэлнэ", target: "news" },
      { label: "Оршин суугчид", desc: "Зарлал хүрэх хэрэглэгчдийн жагсаалтыг харах", target: "users" },
      { label: "Хяналтын самбар", desc: "Ерөнхий идэвхийн summary руу буцах", target: "overview" },
    ],
  };
  const current = meta[tab] ?? {
    title: "Админ хэсэг",
    description: "Энэ хэсгийн удирдлагын товч мэдээлэл.",
    tone: "from-violet-50 to-white border-violet-100 text-violet-700",
    statTone: "border-violet-100 bg-violet-50/70 text-violet-600",
  };

  return (
    <Card className="overflow-hidden">
      <div className={`border-b bg-gradient-to-br px-5 py-5 ${current.tone}`}>
        <p className="text-[11px] font-black uppercase tracking-wide opacity-80">Admin module</p>
        <h2 className="mt-1 text-lg font-black text-slate-950">{current.title}</h2>
        <p className="mt-1 max-w-2xl text-sm font-medium text-slate-500">{current.description}</p>
      </div>
      <div className="p-5">
        <div className="grid gap-3 sm:grid-cols-3">
          {(items[tab] ?? []).map(([label, value]) => (
            <div key={label} className={`rounded-lg border px-4 py-4 ${current.statTone}`}>
              <p className="text-xs font-black opacity-85">{label}</p>
              <p className="mt-2 text-2xl font-black text-slate-950 dark:text-slate-50">{value}</p>
            </div>
          ))}
        </div>

        <div className="mt-5 grid gap-3 lg:grid-cols-3">
          {(actions[tab] ?? []).map((action) => (
            <button
              key={action.label}
              type="button"
              onClick={() => action.target ? setTab(action.target) : undefined}
              className={`rounded-xl border border-slate-200 bg-white px-4 py-4 text-left transition dark:border-slate-700 dark:bg-slate-900 ${
                action.target ? "hover:-translate-y-0.5 hover:border-violet-200 hover:shadow-[0_14px_34px_rgba(79,60,201,0.12)]" : "cursor-default"
              }`}
            >
              <p className="text-sm font-black text-slate-900 dark:text-slate-50">{action.label}</p>
              <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">{action.desc}</p>
            </button>
          ))}
        </div>
      </div>
    </Card>
  );
}
