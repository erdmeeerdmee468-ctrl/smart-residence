"use client";

import { useCallback, useEffect, useState } from "react";
import {
  BarChart2,
  Bell,
  Building2,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ClipboardCheck,
  CreditCard,
  Droplets,
  FileText,
  Home,
  ImageIcon,
  LogOut,
  MessageSquare,
  Plus,
  RefreshCw,
  Settings,
  Users,
  Users2,
  Wrench,
  Zap,
  Trash2,
  X,
  type LucideIcon,
} from "lucide-react";
import { ResidenceLogo } from "@/components/brand/ResidenceLogo";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { NotificationsModal } from "@/components/notifications/NotificationsModal";

type Resident = { id: string; name: string | null; email: string; unitNumber: string | null; phoneNumber?: string | null; avatarUrl?: string | null };
type Payment = {
  id: string;
  residentId: string;
  amount: number;
  month: string;
  description: string | null;
  status: string;
  resident: { name: string | null; unitNumber: string | null; email: string };
  createdAt: string;
};
type Request = {
  id: string;
  title: string;
  description: string;
  status: string;
  createdAt: string;
  resident: { name: string | null; unitNumber: string | null; email: string };
};
type Announcement = { id: string; title: string; content: string; type: string; imageUrl?: string | null; createdAt: string };
type Poll = {
  id: string;
  question: string;
  options: { id: string; text: string; votes: number }[];
  expiresAt: string | null;
};

type Tab = "overview" | "requests" | "polls" | "payments" | "residents" | "announcements" | "building" | "reports" | "alerts" | "settings";

const SOH_NOTIFICATION_READ_KEY = "smart-residence-soh-read-announcements";

const statusMap: Record<string, { label: string; cls: string; action: string }> = {
  PENDING: { label: "Хүлээгдэж буй", cls: "bg-yellow-100/80 text-yellow-700 border-yellow-200/80", action: "bg-yellow-600 text-white border-yellow-600 hover:bg-yellow-700 shadow-sm" },
  PAID: { label: "Төлөгдсөн", cls: "bg-teal-100/80 text-teal-700 border-teal-200/80", action: "bg-teal-600 text-white border-teal-600 hover:bg-teal-700 shadow-sm" },
  OVERDUE: { label: "Хоцорсон", cls: "bg-rose-100/80 text-rose-700 border-rose-200/80", action: "bg-rose-600 text-white border-rose-600 hover:bg-rose-700 shadow-sm" },
  OPEN: { label: "Шинэ", cls: "bg-blue-100/80 text-blue-700 border-blue-200/80", action: "bg-blue-600 text-white border-blue-600 hover:bg-blue-700 shadow-sm" },
  IN_PROGRESS: { label: "Явцад", cls: "bg-orange-100/80 text-orange-700 border-orange-200/80", action: "bg-orange-600 text-white border-orange-600 hover:bg-orange-700 shadow-sm" },
  RESOLVED: { label: "Дууссан", cls: "bg-emerald-100/80 text-emerald-700 border-emerald-200/80", action: "bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700 shadow-sm" },
};

const typeMap: Record<string, { bg: string; text: string; Icon: LucideIcon; label: string }> = {
  INFO: { bg: "bg-amber-50", text: "text-amber-500", Icon: Zap, label: "Мэдээлэл" },
  WARNING: { bg: "bg-blue-50", text: "text-blue-500", Icon: Droplets, label: "Анхааруулга" },
  URGENT: { bg: "bg-purple-50", text: "text-purple-500", Icon: Users2, label: "Яаралтай" },
};

const navItems: { key: Tab; label: string; Icon: LucideIcon; badge?: (counts: { requests: number; alerts: number }) => number }[] = [
  { key: "overview", label: "Хяналтын самбар", Icon: Home },
  { key: "requests", label: "Засварын хүсэлт", Icon: Wrench, badge: (counts) => counts.requests },
  { key: "polls", label: "Санал асуулга", Icon: MessageSquare },
  { key: "payments", label: "Төлбөрүүд", Icon: CreditCard },
  { key: "residents", label: "Оршин суугчид", Icon: Users },
  { key: "announcements", label: "Зарлал, мэдээ", Icon: FileText },
  { key: "reports", label: "Тайлан", Icon: BarChart2 },
  { key: "alerts", label: "Мэдэгдэл", Icon: Bell, badge: (counts) => counts.alerts },
  { key: "settings", label: "Тохиргоо", Icon: Settings },
];

const reqIcons = [
  { Icon: Building2, bg: "bg-blue-100", text: "text-blue-600", ring: "ring-blue-200/70" },
  { Icon: Droplets, bg: "bg-amber-100", text: "text-amber-600", ring: "ring-amber-200/70" },
  { Icon: Zap, bg: "bg-emerald-100", text: "text-emerald-600", ring: "ring-emerald-200/70" },
];

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <section className={`rounded-xl border border-slate-200 bg-white shadow-[0_2px_12px_rgba(0,0,0,0.08)] dark:border-slate-700 dark:bg-slate-900 dark:shadow-[0_2px_12px_rgba(0,0,0,0.4)] ${className}`}>{children}</section>;
}

function CardHeader({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-6 py-5 dark:border-slate-800">
      <h3 className="text-base font-bold text-slate-900 dark:text-slate-50">{title}</h3>
      {action}
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return <div className="px-6 py-12 text-center text-sm font-medium text-slate-500 dark:text-slate-400">{text}</div>;
}

function StatCard({
  Icon,
  iconBg,
  iconText,
  label,
  value,
  sub,
  loading,
  accent,
}: {
  Icon: LucideIcon;
  iconBg: string;
  iconText: string;
  label: string;
  value: string | number;
  sub: string;
  loading: boolean;
  accent: string;
}) {
  // Extract color from accent string (e.g., "border-t-4 border-t-blue-500" -> "blue")
  const accentColor = accent.includes("blue") ? "border-t-4 border-t-blue-500" : 
                      accent.includes("emerald") ? "border-t-4 border-t-emerald-500" :
                      accent.includes("purple") ? "border-t-4 border-t-purple-500" :
                      "border-t-4 border-t-orange-500";
  
  return (
    <Card className={`group relative overflow-hidden rounded-2xl p-6 ${accentColor}`}>
      <div className="flex items-start gap-4">
        <div className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-xl ${iconBg} ${iconText} shadow-sm`}>
          <Icon size={28} strokeWidth={1.8} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="mb-1 text-sm font-semibold text-slate-600 dark:text-slate-400">{label}</p>
          <p className="min-h-10 text-3xl font-black leading-tight text-slate-900 dark:text-slate-50">
            {loading ? <span className="inline-block h-8 w-20 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-700" /> : value}
          </p>
          <p className="mt-2 text-xs font-medium text-slate-500 dark:text-slate-500">{sub}</p>
        </div>
      </div>
    </Card>
  );
}

export default function SOHDashboard() {
  const [tab, setTab] = useState<Tab>("overview");
  const [residents, setResidents] = useState<Resident[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [requests, setRequests] = useState<Request[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [readAnnouncementIds, setReadAnnouncementIds] = useState<string[]>([]);
  const [polls, setPolls] = useState<Poll[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [currentRole, setCurrentRole] = useState<string | null>(null);

  const [showPayForm, setShowPayForm] = useState(false);
  const [payForm, setPayForm] = useState({ residentId: "", amount: "", month: new Date().toISOString().slice(0, 7), description: "" });
  const [showBulkPayForm, setShowBulkPayForm] = useState(false);
  const [bulkPayForm, setBulkPayForm] = useState({ amount: "", month: new Date().toISOString().slice(0, 7), description: "" });
  const [payLoading, setPayLoading] = useState(false);
  const [paySuccess, setPaySuccess] = useState("");
  const [selectedResident, setSelectedResident] = useState<Resident | null>(null);
  const [showAnnForm, setShowAnnForm] = useState(false);
  const [annForm, setAnnForm] = useState({ title: "", content: "", type: "INFO", imageUrl: "" });
  const [annLoading, setAnnLoading] = useState(false);
  const [showPollForm, setShowPollForm] = useState(false);
  const [pollForm, setPollForm] = useState({ question: "", options: ["", ""], expiresAt: "" });
  const [pollLoading, setPollLoading] = useState(false);
  const [pollDeletingId, setPollDeletingId] = useState<string | null>(null);
  const [requestsFilter, setRequestsFilter] = useState<"all" | "accepted" | "finished">("all");

  const fetchAll = useCallback(async () => {
    try {
      const [meRes, resRes, payRes, reqRes, annRes, pollRes] = await Promise.all([
        fetch("/api/auth/me"),
        fetch("/api/soh/residents"),
        fetch("/api/soh/payments"),
        fetch("/api/soh/requests"),
        fetch("/api/admin/announcements"),
        fetch("/api/soh/polls"),
      ]);
      if (meRes.ok) {
        const me = await meRes.json();
        setCurrentRole(me?.user?.role ?? null);
      }
      if (resRes.ok) setResidents(await resRes.json());
      if (payRes.ok) setPayments(await payRes.json());
      if (reqRes.ok) setRequests(await reqRes.json());
      if (annRes.ok) setAnnouncements(await annRes.json());
      if (pollRes.ok) setPolls(await pollRes.json());
      setLastUpdated(new Date());
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setMounted(true);
    fetchAll();
    const interval = setInterval(fetchAll, 15000);
    return () => clearInterval(interval);
  }, [fetchAll]);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(SOH_NOTIFICATION_READ_KEY);
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

  const sendPayment = async () => {
    if (currentRole === "ADMIN") {
      setPaySuccess("Админ төлбөр илгээх эрхгүй. Энэ үйлдлийг зөвхөн СӨХ менежер хийнэ.");
      setTimeout(() => setPaySuccess(""), 3500);
      return;
    }
    if (!payForm.residentId || !payForm.amount || !payForm.month) return;
    setPayLoading(true);
    const res = await fetch("/api/soh/payments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...payForm, amount: parseFloat(payForm.amount) }),
    });
    if (res.ok) {
      setPayForm({ residentId: "", amount: "", month: new Date().toISOString().slice(0, 7), description: "" });
      setShowPayForm(false);
      setPaySuccess("Төлбөр амжилттай илгээгдлээ!");
      setTimeout(() => setPaySuccess(""), 3000);
      fetchAll();
    }
    setPayLoading(false);
  };

  const sendBulkPayments = async () => {
    if (currentRole === "ADMIN") {
      setPaySuccess("Админ төлбөр илгээх эрхгүй. Энэ үйлдлийг зөвхөн СӨХ менежер хийнэ.");
      setTimeout(() => setPaySuccess(""), 3500);
      return;
    }
    if (!bulkPayForm.amount || !bulkPayForm.month || residents.length === 0) return;
    setPayLoading(true);
    try {
      const res = await fetch("/api/soh/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          residentIds: residents.map((resident) => resident.id),
          amount: parseFloat(bulkPayForm.amount),
          month: bulkPayForm.month,
          description: bulkPayForm.description,
        }),
      });
      const result = await res.json().catch(() => ({}));
      if (res.ok) {
        setBulkPayForm({ amount: "", month: new Date().toISOString().slice(0, 7), description: "" });
        setShowBulkPayForm(false);
        setPaySuccess(`${result.count ?? residents.length} оршин суугчид төлбөр үүсгэлээ.`);
        setTimeout(() => setPaySuccess(""), 3500);
        fetchAll();
      } else {
        setPaySuccess(result?.message ?? "Bulk төлбөр үүсгэхэд алдаа гарлаа.");
      }
    } finally {
      setPayLoading(false);
    }
  };

  const updateRequest = async (id: string, status: string) => {
    await fetch("/api/soh/requests", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    fetchAll();
  };

  const createAnn = async () => {
    if (!annForm.title || !annForm.content) return;
    setAnnLoading(true);
    await fetch("/api/admin/announcements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(annForm),
    });
    setAnnForm({ title: "", content: "", type: "INFO", imageUrl: "" });
    setShowAnnForm(false);
    fetchAll();
    setAnnLoading(false);
  };

  const createPoll = async () => {
    const options = pollForm.options.filter((option) => option.trim());
    if (!pollForm.question || options.length < 2) return;
    setPollLoading(true);
    await fetch("/api/soh/polls", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...pollForm, options }),
    });
    setPollForm({ question: "", options: ["", ""], expiresAt: "" });
    setShowPollForm(false);
    fetchAll();
    setPollLoading(false);
  };

  const vote = async (optionId: string) => {
    await fetch("/api/soh/polls/vote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ optionId }),
    });
    fetchAll();
  };

  const deletePoll = async (pollId: string) => {
    setPollDeletingId(pollId);
    try {
      const res = await fetch("/api/soh/polls", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: pollId }),
      });

      if (!res.ok) {
        console.error("Poll delete failed:", await res.text().catch(() => ""));
        return;
      }
      fetchAll();
    } finally {
      setPollDeletingId(null);
    }
  };

  const markAnnouncementsRead = useCallback(() => {
    const ids = announcements.map((announcement) => announcement.id);
    if (ids.length === 0) return;

    setReadAnnouncementIds((current) => {
      const next = Array.from(new Set([...current, ...ids]));
      window.localStorage.setItem(SOH_NOTIFICATION_READ_KEY, JSON.stringify(next));
      return next;
    });
  }, [announcements]);

  useEffect(() => {
    if (tab === "alerts") {
      markAnnouncementsRead();
    }
  }, [markAnnouncementsRead, tab]);

  const fmtDate = (date?: string | null) => (mounted && date ? new Date(date).toLocaleDateString("mn-MN") : "—");
  const fmtTime = (date?: string | null) => (mounted && date ? new Date(date).toLocaleString("mn-MN", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }) : "—");
  const openReqs = requests.filter((request) => request.status === "OPEN").length;
  const monthIncome = payments.filter((payment) => payment.status === "PAID").reduce((sum, payment) => sum + payment.amount, 0);
  const pendingPaymentAmount = payments.filter((payment) => payment.status !== "PAID").reduce((sum, payment) => sum + payment.amount, 0);
  const overduePayments = payments.filter((payment) => payment.status === "OVERDUE").length;
  const incompleteResidents = residents.filter((resident) => !resident.unitNumber || !resident.phoneNumber).length;
  const activePoll = polls[0];
  const alertsCount = announcements.filter((announcement) => !readAnnouncementIds.includes(announcement.id)).length;
  const titleByTab: Record<Tab, string> = {
    overview: "Хяналтын самбар",
    requests: "Засварын хүсэлт",
    polls: "Санал асуулга",
    payments: "Төлбөрүүд",
    residents: "Оршин суугчид",
    announcements: "Зарлал, мэдээ",
    building: "Барилга, байгууламж",
    reports: "Тайлан",
    alerts: "Мэдэгдэл",
    settings: "Тохиргоо",
  };

  const inputClass =
    "w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15 placeholder:text-gray-400 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500";

  return (
    <div className="min-h-screen bg-slate-50 p-2 text-gray-900 dark:bg-slate-950 dark:text-slate-100 sm:p-3">
      <div className="mx-auto flex h-[calc(100vh-16px)] max-w-[1540px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_4px_20px_rgba(0,0,0,0.08)] dark:border-slate-700 dark:bg-slate-900 dark:shadow-[0_4px_20px_rgba(0,0,0,0.3)] sm:h-[calc(100vh-24px)]">
        <aside
          className="hidden w-[215px] shrink-0 flex-col md:flex"
          style={{ background: "linear-gradient(135deg, #1e40af 0%, #1e3a8a 100%)" }}
        >
          <div className="px-4 py-6">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-white/15 bg-white p-1.5 shadow-lg shadow-black/20">
                <ResidenceLogo className="h-full w-full" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-[12px] font-black uppercase text-white">Өндөр хотхон</p>
                <p className="truncate text-[10px] font-medium text-blue-100/75">СӨХ удирдлагын систем</p>
              </div>
            </div>
          </div>

          <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto px-3 pb-3 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {navItems.map(({ key, label, Icon, badge }) => {
              const active = tab === key;
              const count = badge?.({ requests: openReqs, alerts: alertsCount }) ?? 0;
              return (
                <button
                  key={key}
                  onClick={() => {
                    setTab(key);
                    if (key === "alerts") markAnnouncementsRead();
                  }}
                  className={`flex min-h-10 w-full items-center justify-between gap-2 rounded-md px-3 py-2 text-left text-[12px] font-semibold transition ${
                    active ? "bg-[#3657d7] text-white shadow-[0_10px_22px_rgba(25,48,145,0.35)]" : "text-blue-100/80 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <span className="flex min-w-0 items-center gap-2.5">
                    <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md ${active ? "bg-white/16 text-white" : "bg-white/5 text-blue-100/80"}`}>
                      <Icon size={15} strokeWidth={active ? 2.25 : 1.8} />
                    </span>
                    <span className="truncate">{label}</span>
                  </span>
                  {count > 0 ? (
                    <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-black text-white shadow-sm shadow-red-950/30">
                      {count}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </nav>

          <div className="mt-auto shrink-0 border-t border-white/10 p-3">
            <div className="flex items-center gap-2">
              <button className="flex flex-1 items-center gap-2.5 rounded-md px-2 py-2 text-left transition hover:bg-white/10">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-400 to-cyan-300 text-xs font-black text-white">СӨ</div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-bold text-white">СӨХ менежер</p>
                  <p className="truncate text-[10px] text-blue-100/70">Менежер</p>
                </div>
              </button>
              <button
                onClick={handleLogout}
                title="Гарах"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-blue-100/50 transition hover:bg-white/10 hover:text-white"
              >
                <LogOut size={15} />
              </button>
            </div>
          </div>
        </aside>

        <main className="min-w-0 flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-950">
          <nav
            className="flex gap-2 overflow-x-auto overscroll-x-contain border-b border-slate-200 bg-white px-3 py-2.5 dark:border-slate-800 dark:bg-slate-900 md:hidden [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            aria-label="СӨХ цэс"
          >
            {navItems.map(({ key, label, Icon, badge }) => {
              const active = tab === key;
              const count = badge?.({ requests: openReqs, alerts: alertsCount }) ?? 0;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => {
                    setTab(key);
                    if (key === "alerts") markAnnouncementsRead();
                  }}
                  className={`flex shrink-0 items-center gap-2 rounded-full border px-3 py-2 text-left text-xs font-bold transition ${
                    active
                      ? "border-blue-500 bg-blue-50 text-blue-900 dark:border-blue-400/50 dark:bg-blue-950/50 dark:text-blue-100"
                      : "border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
                  }`}
                >
                  <Icon size={14} strokeWidth={active ? 2.25 : 1.8} className="shrink-0" />
                  <span className="max-w-[11rem] truncate">{label}</span>
                  {count > 0 ? (
                    <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-black text-white">{count}</span>
                  ) : null}
                </button>
              );
            })}
          </nav>
          <div className="relative px-4 pb-24 pt-5 sm:px-6 md:pb-6 lg:px-8">
            <div className="relative">
              <div className="rounded-2xl border border-slate-200 bg-white shadow-[0_4px_20px_rgba(0,0,0,0.08)] dark:border-slate-700 dark:bg-slate-900 dark:shadow-[0_4px_20px_rgba(0,0,0,0.3)]">
                <header className="flex flex-col gap-3 border-b border-slate-100 px-4 py-5 dark:border-slate-800 sm:px-6 sm:py-6 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50 sm:text-3xl">{titleByTab[tab]}</h1>
                    <p className="mt-2 text-sm font-medium text-slate-600 dark:text-slate-400">
                      Сайн байна уу, СӨХ менежер
                      {mounted && lastUpdated ? (
                        <span className="ml-2 inline-flex items-center gap-1 text-slate-500 dark:text-slate-500">
                          <RefreshCw size={12} className="opacity-70" /> {lastUpdated.toLocaleTimeString("mn-MN")}
                        </span>
                      ) : null}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3 sm:justify-end">
                    <ThemeToggle
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:border-slate-300 hover:text-blue-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:border-slate-600 dark:hover:text-blue-400"
                      iconSize={17}
                    />
                    <button
                      onClick={() => {
                        setShowNotifications(true);
                        markAnnouncementsRead();
                      }}
                      className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:border-blue-200 hover:text-[#3657d7] dark:border-slate-600 dark:bg-slate-800 dark:text-slate-400 dark:hover:border-blue-500/50"
                    >
                      <Bell size={17} />
                      {alertsCount > 0 ? <span className="absolute right-1.5 top-1.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-red-500" /> : null}
                    </button>
                    <button
                      onClick={() => {
                        setTab("polls");
                        setShowPollForm(true);
                      }}
                      className="inline-flex min-w-0 flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 px-3 py-2.5 text-xs font-bold text-white shadow-[0_4px_12px_rgba(37,99,235,0.3)] transition hover:from-blue-700 hover:to-blue-800 hover:shadow-[0_6px_16px_rgba(37,99,235,0.4)] sm:flex-initial sm:px-5 active:scale-95"
                    >
                      <Plus size={15} className="shrink-0" />
                      <span className="truncate">Санал асуулга үүсгэх</span>
                    </button>
                  </div>
                </header>

                <div className="space-y-6 p-5 sm:p-6">
                  {paySuccess ? (
                    <div className="flex items-center gap-2 rounded-lg border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
                      <CheckCircle2 size={16} />
                      {paySuccess}
                    </div>
                  ) : null}

                  {tab === "overview" ? (
                    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
                      <StatCard Icon={ClipboardCheck} iconBg="bg-blue-100" iconText="text-blue-600" accent="text-blue-500 border-t-4 border-t-blue-500" label="Шинэ засварын хүсэлт" value={openReqs} sub="Шинээр ирсэн" loading={loading} />
                      <StatCard Icon={Users} iconBg="bg-emerald-100" iconText="text-emerald-600" accent="text-emerald-500 border-t-4 border-t-emerald-500" label="Нийт оршин суугч" value={residents.length} sub="Идэвхтэй" loading={loading} />
                      <StatCard Icon={CreditCard} iconBg="bg-purple-100" iconText="text-purple-600" accent="text-purple-500 border-t-4 border-t-purple-500" label="Төлөгдсөн төлбөр (энэ сар)" value={`${monthIncome.toLocaleString()}₮`} sub="Сараар" loading={loading} />
                      <StatCard Icon={ClipboardCheck} iconBg="bg-orange-100" iconText="text-orange-600" accent="text-orange-500 border-t-4 border-t-orange-500" label="Идэвхтэй санал асуулга" value={polls.length} sub="Идэвхтэй" loading={loading} />
                    </div>
                  ) : null}

                  {tab === "overview" ? (
                    <SOHWorkQueue
                      openRequests={openReqs}
                      overduePayments={overduePayments}
                      pendingPaymentAmount={pendingPaymentAmount}
                      incompleteResidents={incompleteResidents}
                      activePoll={activePoll}
                      setTab={setTab}
                      loading={loading}
                    />
                  ) : null}

                  {tab === "overview" ? (
                    <Overview
                      loading={loading}
                      requests={requests}
                      announcements={announcements}
                      activePoll={activePoll}
                      setTab={setTab}
                      updateRequest={updateRequest}
                      fmtDate={fmtDate}
                      fmtTime={fmtTime}
                      deletePoll={deletePoll}
                      pollDeletingId={pollDeletingId}
                      residents={residents}
                      payments={payments}
                      onSelectResident={setSelectedResident}
                    />
                  ) : null}

                  {tab === "requests" ? <RequestsTab loading={loading} requests={requests} updateRequest={updateRequest} fmtDate={fmtDate} fmtTime={fmtTime} filter={requestsFilter} setFilter={setRequestsFilter} /> : null}

                  {tab === "polls" ? (
                    <PollsTab
                      polls={polls}
                      showPollForm={showPollForm}
                      setShowPollForm={setShowPollForm}
                      pollForm={pollForm}
                      setPollForm={setPollForm}
                      pollLoading={pollLoading}
                      createPoll={createPoll}
                      vote={vote}
                      deletePoll={deletePoll}
                      pollDeletingId={pollDeletingId}
                      inputClass={inputClass}
                      fmtDate={fmtDate}
                    />
                  ) : null}

                  {tab === "payments" ? (
                    <PaymentsTab
                      residents={residents}
                      payments={payments}
                      loading={loading}
                      showPayForm={showPayForm}
                      setShowPayForm={setShowPayForm}
                      payForm={payForm}
                      setPayForm={setPayForm}
                      showBulkPayForm={showBulkPayForm}
                      setShowBulkPayForm={setShowBulkPayForm}
                      bulkPayForm={bulkPayForm}
                      setBulkPayForm={setBulkPayForm}
                      payLoading={payLoading}
                      sendPayment={sendPayment}
                      sendBulkPayments={sendBulkPayments}
                      canSendPayments={currentRole !== "ADMIN"}
                      inputClass={inputClass}
                      fmtDate={fmtDate}
                    />
                  ) : null}

                  {tab === "residents" ? <ResidentsTab residents={residents} loading={loading} payments={payments} requests={requests} onSelectResident={setSelectedResident} /> : null}

                  {tab === "announcements" ? (
                    <AnnouncementsTab
                      announcements={announcements}
                      showAnnForm={showAnnForm}
                      setShowAnnForm={setShowAnnForm}
                      annForm={annForm}
                      setAnnForm={setAnnForm}
                      annLoading={annLoading}
                      createAnn={createAnn}
                      inputClass={inputClass}
                      fmtDate={fmtDate}
                    />
                  ) : null}

                  {tab === "building" ? <InfoGrid title="Барилга, байгууламж" items={[["Нийт блок", "5"], ["Давхар", "16"], ["Лифт", "8"], ["Зогсоол", "120"]]} /> : null}
                  {tab === "reports" ? <InfoGrid title="Тайлан" items={[["Төлбөрийн орлого", `${monthIncome.toLocaleString()}₮`], ["Нийт хүсэлт", requests.length.toString()], ["Шийдэгдсэн", requests.filter((r) => r.status === "RESOLVED").length.toString()], ["Санал асуулга", polls.length.toString()]]} /> : null}
                  {tab === "alerts" ? <AnnouncementsTab announcements={announcements} showAnnForm={false} setShowAnnForm={setShowAnnForm} annForm={annForm} setAnnForm={setAnnForm} annLoading={annLoading} createAnn={createAnn} inputClass={inputClass} fmtDate={fmtDate} hideFormButton /> : null}
                  {tab === "settings" ? <InfoGrid title="Тохиргоо" items={[["Авто шинэчлэлт", "15 секунд"], ["Эрх", "СӨХ менежер"], ["Систем", "Идэвхтэй"], ["Мэдэгдэл", "Асаалттай"]]} /> : null}
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
      {selectedResident ? (
        <ResidentDetailDrawer
          resident={selectedResident}
          payments={payments}
          requests={requests}
          fmtDate={fmtDate}
          onClose={() => setSelectedResident(null)}
        />
      ) : null}
    </div>
  );
}

function SOHWorkQueue({
  openRequests,
  overduePayments,
  pendingPaymentAmount,
  incompleteResidents,
  activePoll,
  setTab,
  loading,
}: {
  openRequests: number;
  overduePayments: number;
  pendingPaymentAmount: number;
  incompleteResidents: number;
  activePoll?: Poll;
  setTab: (tab: Tab) => void;
  loading: boolean;
}) {
  const items = [
    { label: "Шинэ засвар", value: openRequests, hint: "Хүлээж авах хүсэлт", target: "requests" as Tab, tone: "border-blue-100 bg-blue-50 text-blue-700" },
    { label: "Хоцорсон төлбөр", value: overduePayments, hint: `${pendingPaymentAmount.toLocaleString()}₮ хүлээгдэж байна`, target: "payments" as Tab, tone: "border-rose-100 bg-rose-50 text-rose-700" },
    { label: "Profile дутуу", value: incompleteResidents, hint: "Тоот эсвэл утас дутуу", target: "residents" as Tab, tone: "border-amber-100 bg-amber-50 text-amber-700" },
    { label: "Идэвхтэй poll", value: activePoll ? 1 : 0, hint: activePoll?.question ?? "Санал асуулга алга", target: "polls" as Tab, tone: "border-emerald-100 bg-emerald-50 text-emerald-700" },
  ];

  return (
    <Card className="overflow-hidden">
      <div className="border-b border-slate-100 bg-slate-950 px-5 py-4 text-white dark:border-slate-800">
        <p className="text-[11px] font-black uppercase tracking-wide text-blue-200">Operator queue</p>
        <h2 className="mt-1 text-lg font-black">Өнөөдрийн хийх ажлууд</h2>
      </div>
      <div className="grid gap-3 p-5 sm:grid-cols-2 xl:grid-cols-4">
        {items.map((item) => (
          <button key={item.label} type="button" onClick={() => setTab(item.target)} className={`rounded-xl border px-4 py-4 text-left transition hover:-translate-y-0.5 hover:shadow-[0_12px_28px_rgba(15,23,42,0.10)] ${item.tone}`}>
            <p className="text-xs font-black">{item.label}</p>
            <p className="mt-2 text-2xl font-black text-slate-950">{loading ? "..." : item.value.toLocaleString()}</p>
            <p className="mt-1 line-clamp-1 text-[11px] font-bold opacity-75">{item.hint}</p>
          </button>
        ))}
      </div>
    </Card>
  );
}

function Overview({
  loading,
  requests,
  announcements,
  activePoll,
  setTab,
  updateRequest,
  fmtDate,
  fmtTime,
  deletePoll,
  pollDeletingId,
  residents,
  payments,
  onSelectResident,
}: {
  loading: boolean;
  requests: Request[];
  announcements: Announcement[];
  activePoll?: Poll;
  setTab: (tab: Tab) => void;
  updateRequest: (id: string, status: string) => void;
  fmtDate: (date?: string | null) => string;
  fmtTime: (date?: string | null) => string;
  deletePoll: (pollId: string) => void;
  pollDeletingId: string | null;
  residents: Resident[];
  payments: Payment[];
  onSelectResident: (resident: Resident) => void;
}) {
  const topResidents = residents
    .map((resident) => ({
      resident,
      pending: payments.filter((payment) => payment.residentId === resident.id && payment.status !== "PAID").reduce((sum, payment) => sum + payment.amount, 0),
    }))
    .sort((a, b) => b.pending - a.pending)
    .slice(0, 4);

  return (
    <div className="grid gap-5 xl:grid-cols-[1.25fr_0.8fr_0.75fr]">
      <Card className="overflow-hidden">
        <CardHeader title="Шинэ засварын хүсэлтүүд" action={<button onClick={() => setTab("requests")} className="text-xs font-bold text-[#3450c7] hover:text-[#293fa4]">Бүгдийг харах</button>} />
        <div className="divide-y divide-gray-50 dark:divide-slate-800">
          {loading ? (
            [1, 2, 3].map((item) => <div key={item} className="px-5 py-4"><div className="h-4 animate-pulse rounded bg-gray-100 dark:bg-slate-700" /></div>)
          ) : requests.length === 0 ? (
            <EmptyState text="Хүсэлт байхгүй байна" />
          ) : (
            requests.slice(0, 3).map((request, index) => {
              const icon = reqIcons[index % reqIcons.length];
              const Icon = icon.Icon;
              return (
                <div key={request.id} className="flex items-center gap-4 px-5 py-4">
                  <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ${icon.bg} ${icon.text} ring-1 ${icon.ring}`}>
                    <Icon size={19} strokeWidth={2} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-gray-800 dark:text-slate-100">{request.title}</p>
                    <p className="mt-0.5 truncate text-xs text-gray-400 dark:text-slate-500">{request.resident.unitNumber ? `${request.resident.unitNumber}-р байр` : request.resident.email}</p>
                  </div>
                  <div className="hidden min-w-[118px] text-xs text-gray-500 sm:block">
                    <p className="font-semibold">{request.resident.name ?? "—"}</p>
                    <p className="mt-0.5 text-gray-400 dark:text-slate-500">{fmtTime(request.createdAt)}</p>
                  </div>
                  {request.status === "OPEN" ? (
                    <button onClick={() => updateRequest(request.id, "IN_PROGRESS")} className="rounded-md border border-red-200 bg-red-100 px-2.5 py-1 text-[11px] font-black text-red-600">
                      Шинэ
                    </button>
                  ) : (
                    <span className={`rounded-md border px-2.5 py-1 text-[11px] font-bold ${statusMap[request.status]?.cls}`}>{statusMap[request.status]?.label}</span>
                  )}
                </div>
              );
            })
          )}
        </div>
      </Card>

      <Card className="overflow-hidden">
        <CardHeader title="Идэвхтэй санал асуулга" action={<button onClick={() => setTab("polls")} className="text-xs font-bold text-[#3450c7] hover:text-[#293fa4]">Бүгдийг харах</button>} />
        <PollResult poll={activePoll} loading={loading} fmtDate={fmtDate} />
        {activePoll ? (
          <div className="flex justify-end border-t border-gray-50 px-5 py-3">
            <button
              type="button"
              onClick={() => deletePoll(activePoll.id)}
              disabled={pollDeletingId === activePoll.id}
              className="inline-flex items-center gap-1 rounded-md border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-bold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {pollDeletingId === activePoll.id ? (
                "Устгаж байна..."
              ) : (
                <>
                  <Trash2 size={14} />
                  Устгах
                </>
              )}
            </button>
          </div>
        ) : null}
      </Card>

      <Card className="overflow-hidden">
        <CardHeader title="Сүүлд орсон зарлал" action={<button onClick={() => setTab("announcements")} className="text-xs font-bold text-[#3450c7] hover:text-[#293fa4]">Бүгдийг харах</button>} />
        <div className="divide-y divide-gray-50 dark:divide-slate-800">
          {loading ? (
            [1, 2, 3].map((item) => <div key={item} className="px-5 py-4"><div className="h-4 animate-pulse rounded bg-gray-100 dark:bg-slate-700" /></div>)
          ) : announcements.length === 0 ? (
            <EmptyState text="Зарлал байхгүй байна" />
          ) : (
            announcements.slice(0, 4).map((announcement) => <AnnouncementRow key={announcement.id} announcement={announcement} fmtDate={fmtDate} compact />)
          )}
        </div>
      </Card>

      <Card className="overflow-hidden xl:col-span-3">
        <CardHeader title="Resident quick view" action={<button onClick={() => setTab("residents")} className="text-xs font-bold text-[#3450c7] hover:text-[#293fa4]">Бүгдийг харах</button>} />
        <div className="grid gap-3 p-5 sm:grid-cols-2 xl:grid-cols-4">
          {topResidents.length === 0 ? (
            <div className="col-span-full text-center text-sm text-slate-400">Оршин суугчийн мэдээлэл алга.</div>
          ) : (
            topResidents.map(({ resident, pending }) => (
              <button key={resident.id} type="button" onClick={() => onSelectResident(resident)} className="rounded-xl border border-slate-200 bg-white px-4 py-4 text-left transition hover:border-blue-200 hover:bg-blue-50/50 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800">
                <p className="truncate text-sm font-black text-slate-900 dark:text-slate-50">{resident.name ?? resident.email}</p>
                <p className="mt-1 text-xs font-semibold text-slate-400">{resident.unitNumber ?? "Тоотгүй"} · {resident.phoneNumber ?? "Утасгүй"}</p>
                <p className="mt-3 text-lg font-black text-blue-700">{pending.toLocaleString()}₮</p>
                <p className="text-[11px] font-bold text-slate-400">Хүлээгдэж буй төлбөр</p>
              </button>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}

function PollResult({ poll, loading, fmtDate }: { poll?: Poll; loading: boolean; fmtDate: (date?: string | null) => string }) {
  if (loading) {
    return <div className="space-y-3 p-5"><div className="h-4 animate-pulse rounded bg-gray-100 dark:bg-slate-700" /><div className="h-20 animate-pulse rounded bg-gray-100 dark:bg-slate-700" /></div>;
  }
  if (!poll) return <EmptyState text="Санал асуулга байхгүй байна" />;

  const total = poll.options.reduce((sum, option) => sum + option.votes, 0);
  return (
    <div className="space-y-4 p-5">
      <div>
        <p className="text-sm font-bold leading-5 text-gray-800 dark:text-slate-100">{poll.question}</p>
        {poll.expiresAt ? <p className="mt-1 text-xs text-gray-400 dark:text-slate-500">Хугацаа: {fmtDate(poll.expiresAt)} хүртэл</p> : null}
      </div>
      {poll.options.slice(0, 3).map((option, index) => {
        const percent = total > 0 ? Math.round((option.votes / total) * 100) : 0;
        return (
          <div key={option.id}>
            <div className="mb-2 flex items-center justify-between text-xs">
              <span className="font-semibold text-gray-600 dark:text-slate-300">{option.text}</span>
              <span className="font-bold text-gray-500 dark:text-slate-400">{percent}% ({option.votes})</span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-slate-100">
              <div className={`h-full rounded-full ${index === 0 ? "bg-emerald-500" : index === 1 ? "bg-red-500" : "bg-amber-500"}`} style={{ width: `${percent}%` }} />
            </div>
          </div>
        );
      })}
      <p className="pt-1 text-xs text-gray-400 dark:text-slate-500">Нийт санал өгсөн: {total}</p>
    </div>
  );
}

function RequestsTab({
  loading,
  requests,
  updateRequest,
  fmtDate,
  fmtTime,
  filter = "all",
  setFilter = () => {},
}: {
  loading: boolean;
  requests: Request[];
  updateRequest: (id: string, status: string) => void;
  fmtDate: (date?: string | null) => string;
  fmtTime: (date?: string | null) => string;
  filter?: "all" | "accepted" | "finished";
  setFilter?: (filter: "all" | "accepted" | "finished") => void;
}) {
  const filteredRequests = requests.filter((request) => {
    if (filter === "accepted") return request.status === "IN_PROGRESS";
    if (filter === "finished") return request.status === "RESOLVED";
    return true;
  });

  return (
    <div className="space-y-5">
      <div className="flex gap-2 overflow-x-auto pb-2">
        <button
          onClick={() => setFilter("all")}
          className={`shrink-0 rounded-lg border px-4 py-2.5 text-xs font-semibold transition ${
            filter === "all"
              ? "border-blue-500 bg-blue-100/80 text-blue-900 shadow-sm dark:border-blue-500/50 dark:bg-blue-950/60 dark:text-blue-100"
              : "border-slate-200 bg-slate-50/50 text-slate-700 hover:border-slate-300 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-200"
          }`}
        >
          Бүгд ({requests.length})
        </button>
        <button
          onClick={() => setFilter("accepted")}
          className={`shrink-0 rounded-lg border px-4 py-2.5 text-xs font-semibold transition ${
            filter === "accepted"
              ? "border-orange-500 bg-orange-100/80 text-orange-900 shadow-sm dark:border-orange-500/50 dark:bg-orange-950/60 dark:text-orange-100"
              : "border-slate-200 bg-slate-50/50 text-slate-700 hover:border-slate-300 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-200"
          }`}
        >
          Авсан ({requests.filter((r) => r.status === "IN_PROGRESS").length})
        </button>
        <button
          onClick={() => setFilter("finished")}
          className={`shrink-0 rounded-lg border px-4 py-2.5 text-xs font-semibold transition ${
            filter === "finished"
              ? "border-emerald-500 bg-emerald-100/80 text-emerald-900 shadow-sm dark:border-emerald-500/50 dark:bg-emerald-950/60 dark:text-emerald-100"
              : "border-slate-200 bg-slate-50/50 text-slate-700 hover:border-slate-300 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-200"
          }`}
        >
          Дууссан ({requests.filter((r) => r.status === "RESOLVED").length})
        </button>
      </div>
      
      <Card className="overflow-hidden">
        <CardHeader title={filter === "all" ? "Засварын хүсэлтүүд" : filter === "accepted" ? "Авсан хүсэлтүүд" : "Дууссан хүсэлтүүд"} />
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {loading ? (
            [1, 2, 3, 4].map((item) => <div key={item} className="px-6 py-4"><div className="h-4 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-700" /></div>)
          ) : filteredRequests.length === 0 ? (
            <EmptyState text={filter === "all" ? "Хүсэлт байхгүй байна" : filter === "accepted" ? "Авсан хүсэлт байхгүй байна" : "Дууссан хүсэлт байхгүй байна"} />
          ) : (
            filteredRequests.map((request, index) => {
              const icon = reqIcons[index % reqIcons.length];
              const Icon = icon.Icon;
              return (
                <div key={request.id} className="flex flex-col gap-3 px-5 py-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="flex min-w-0 gap-3">
                    <div className={`mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ${icon.bg} ${icon.text} ring-1 ${icon.ring}`}>
                      <Icon size={19} strokeWidth={2} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-bold text-gray-800 dark:text-slate-100">{request.title}</p>
                        <span className={`rounded-md border px-2 py-0.5 text-[11px] font-bold ${statusMap[request.status]?.cls}`}>{statusMap[request.status]?.label}</span>
                      </div>
                      <p className="mt-1 line-clamp-2 text-sm text-gray-500 dark:text-slate-400">{request.description}</p>
                      <p className="mt-2 flex items-center gap-1 text-xs text-gray-400 dark:text-slate-500">
                        <CalendarDays size={11} />
                        {request.resident.name ?? request.resident.email}{request.resident.unitNumber ? ` · ${request.resident.unitNumber}-р байр` : ""} · {fmtDate(request.createdAt)} · {fmtTime(request.createdAt)}
                      </p>
                    </div>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    {request.status === "OPEN" ? <button onClick={() => updateRequest(request.id, "IN_PROGRESS")} className={`rounded-md border px-4 py-2 text-xs font-black transition ${statusMap.OPEN.action}`}>Авах</button> : null}
                    {request.status === "IN_PROGRESS" ? <button onClick={() => updateRequest(request.id, "RESOLVED")} className={`rounded-md border px-4 py-2 text-xs font-black transition ${statusMap.IN_PROGRESS.action}`}>Шийдсэн</button> : null}
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

function PollsTab({
  polls,
  showPollForm,
  setShowPollForm,
  pollForm,
  setPollForm,
  pollLoading,
  createPoll,
  vote,
  deletePoll,
  pollDeletingId,
  inputClass,
  fmtDate,
}: {
  polls: Poll[];
  showPollForm: boolean;
  setShowPollForm: (show: boolean) => void;
  pollForm: { question: string; options: string[]; expiresAt: string };
  setPollForm: (form: { question: string; options: string[]; expiresAt: string }) => void;
  pollLoading: boolean;
  createPoll: () => void;
  vote: (optionId: string) => void;
  deletePoll: (pollId: string) => void;
  pollDeletingId: string | null;
  inputClass: string;
  fmtDate: (date?: string | null) => string;
}) {
  return (
    <div className="space-y-4">
      {showPollForm ? (
        <Card className="p-5">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-black text-gray-800 dark:text-slate-100"><MessageSquare size={16} className="text-[#3450c7]" /> Санал асуулга үүсгэх</h2>
          <div className="grid gap-3">
            <input value={pollForm.question} onChange={(event) => setPollForm({ ...pollForm, question: event.target.value })} placeholder="Асуулт" className={inputClass} />
            {pollForm.options.map((option, index) => (
              <div key={index} className="flex gap-2">
                <input
                  value={option}
                  onChange={(event) => {
                    const options = [...pollForm.options];
                    options[index] = event.target.value;
                    setPollForm({ ...pollForm, options });
                  }}
                  placeholder={`Сонголт ${index + 1}`}
                  className={inputClass}
                />
                {pollForm.options.length > 2 ? (
                  <button onClick={() => setPollForm({ ...pollForm, options: pollForm.options.filter((_, itemIndex) => itemIndex !== index) })} className="rounded-lg border border-gray-200 px-3 text-sm font-bold text-red-400">x</button>
                ) : null}
              </div>
            ))}
            <button onClick={() => setPollForm({ ...pollForm, options: [...pollForm.options, ""] })} className="inline-flex items-center gap-1 text-xs font-bold text-[#3450c7]">
              <Plus size={13} /> Сонголт нэмэх
            </button>
            <input type="date" value={pollForm.expiresAt} onChange={(event) => setPollForm({ ...pollForm, expiresAt: event.target.value })} className={inputClass} />
            <div className="flex flex-wrap gap-3">
              <button onClick={createPoll} disabled={pollLoading || !pollForm.question} className="rounded-md bg-[#3657d7] px-5 py-2.5 text-xs font-black text-white shadow-[0_10px_20px_rgba(54,87,215,0.2)] transition hover:bg-[#293fa4] disabled:opacity-45">
                {pollLoading ? "Үүсгэж байна..." : "Үүсгэх"}
              </button>
              <button onClick={() => setShowPollForm(false)} className="rounded-md border border-gray-200 px-5 py-2.5 text-xs font-bold text-gray-500 dark:text-slate-400">Цуцлах</button>
            </div>
          </div>
        </Card>
      ) : (
        <button onClick={() => setShowPollForm(true)} className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-gray-300 bg-white py-3 text-sm font-bold text-gray-400 transition hover:bg-gray-50 hover:text-gray-600 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800">
          <Plus size={15} /> Санал асуулга үүсгэх
        </button>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        {polls.length === 0 ? (
          <Card className="lg:col-span-2"><EmptyState text="Санал асуулга байхгүй байна" /></Card>
        ) : (
          polls.map((poll) => (
            <Card key={poll.id} className="p-5">
              <PollResult poll={poll} loading={false} fmtDate={fmtDate} />
              <div className="mt-2 flex items-center justify-end">
                <button
                  type="button"
                  onClick={() => deletePoll(poll.id)}
                  disabled={pollDeletingId === poll.id}
                  className="inline-flex items-center gap-1 rounded-md border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-bold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {pollDeletingId === poll.id ? (
                    "Устгаж байна..."
                  ) : (
                    <>
                      <Trash2 size={14} />
                      Устгах
                    </>
                  )}
                </button>
              </div>
              <div className="mt-3 flex flex-wrap gap-2 border-t border-gray-50 pt-3">
                {poll.options.map((option) => (
                  <button key={option.id} onClick={() => vote(option.id)} className="rounded-md border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs font-bold text-[#3657d7] transition hover:border-blue-200 hover:bg-blue-100">
                    {option.text.slice(0, 12)}
                  </button>
                ))}
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

function PaymentsTab({
  residents,
  payments,
  loading,
  showPayForm,
  setShowPayForm,
  payForm,
  setPayForm,
  showBulkPayForm,
  setShowBulkPayForm,
  bulkPayForm,
  setBulkPayForm,
  payLoading,
  sendPayment,
  sendBulkPayments,
  canSendPayments,
  inputClass,
  fmtDate,
}: {
  residents: Resident[];
  payments: Payment[];
  loading: boolean;
  showPayForm: boolean;
  setShowPayForm: (show: boolean) => void;
  payForm: { residentId: string; amount: string; month: string; description: string };
  setPayForm: (form: { residentId: string; amount: string; month: string; description: string }) => void;
  showBulkPayForm: boolean;
  setShowBulkPayForm: (show: boolean) => void;
  bulkPayForm: { amount: string; month: string; description: string };
  setBulkPayForm: (form: { amount: string; month: string; description: string }) => void;
  payLoading: boolean;
  sendPayment: () => void;
  sendBulkPayments: () => void;
  canSendPayments: boolean;
  inputClass: string;
  fmtDate: (date?: string | null) => string;
}) {
  return (
    <div className="space-y-4">
      {!canSendPayments ? (
        <Card className="border-amber-100 bg-amber-50/70 p-5 dark:border-amber-900/50 dark:bg-amber-950/20">
          <h2 className="text-sm font-black text-amber-800 dark:text-amber-200">Төлбөр илгээх эрх хязгаарлагдсан</h2>
          <p className="mt-1 text-xs leading-5 text-amber-700/80 dark:text-amber-200/70">
            Админ энэ хэсгийн төлбөрүүдийг харж, хянаж чадна. Харин шинэ төлбөр илгээх үйлдлийг зөвхөн СӨХ менежер хийнэ.
          </p>
        </Card>
      ) : showPayForm ? (
        <Card className="p-5">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-black text-gray-800 dark:text-slate-100"><CreditCard size={16} className="text-[#3450c7]" /> Шинэ төлбөр илгээх</h2>
          <div className="grid gap-3">
            <select value={payForm.residentId} onChange={(event) => setPayForm({ ...payForm, residentId: event.target.value })} className={inputClass}>
              <option value="">Оршин суугч сонгох...</option>
              {residents.map((resident) => <option key={resident.id} value={resident.id}>{resident.name ?? resident.email}{resident.unitNumber ? ` · ${resident.unitNumber}-р тоот` : ""}</option>)}
            </select>
            <div className="grid gap-3 sm:grid-cols-2">
              <input type="number" value={payForm.amount} onChange={(event) => setPayForm({ ...payForm, amount: event.target.value })} placeholder="Дүн (₮)" className={inputClass} />
              <input type="month" value={payForm.month} onChange={(event) => setPayForm({ ...payForm, month: event.target.value })} className={inputClass} />
            </div>
            <input value={payForm.description} onChange={(event) => setPayForm({ ...payForm, description: event.target.value })} placeholder="Тайлбар" className={inputClass} />
            <div className="flex flex-wrap gap-3">
              <button onClick={sendPayment} disabled={payLoading || !payForm.residentId || !payForm.amount} className="inline-flex items-center gap-2 rounded-md bg-[#3657d7] px-5 py-2.5 text-xs font-black text-white shadow-[0_10px_20px_rgba(54,87,215,0.2)] transition hover:bg-[#293fa4] disabled:opacity-45">
                {payLoading ? <><RefreshCw size={14} className="animate-spin" />Илгээж байна...</> : "Илгээх"}
              </button>
              <button onClick={() => setShowPayForm(false)} className="rounded-md border border-gray-200 px-5 py-2.5 text-xs font-bold text-gray-500 dark:text-slate-400">Цуцлах</button>
            </div>
          </div>
        </Card>
      ) : (
        <button onClick={() => setShowPayForm(true)} className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-gray-300 bg-white py-3 text-sm font-bold text-gray-400 transition hover:bg-gray-50 hover:text-gray-600 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800">
          <Plus size={15} /> Шинэ төлбөр илгээх
        </button>
      )}

      {canSendPayments ? (
        <Card className="overflow-hidden">
          <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-sm font-black text-slate-900 dark:text-slate-50">Bulk төлбөр үүсгэх</h2>
              <p className="mt-1 text-xs text-slate-400">Нэг сараар бүх оршин суугчид ижил төлбөр үүсгэнэ.</p>
            </div>
            <button type="button" onClick={() => setShowBulkPayForm(!showBulkPayForm)} className="rounded-lg bg-slate-950 px-4 py-2 text-xs font-black text-white transition hover:bg-slate-800">
              {showBulkPayForm ? "Хаах" : "Bulk үүсгэх"}
            </button>
          </div>
          {showBulkPayForm ? (
            <div className="grid gap-3 p-5 md:grid-cols-[1fr_1fr_1.3fr_auto]">
              <input type="number" value={bulkPayForm.amount} onChange={(event) => setBulkPayForm({ ...bulkPayForm, amount: event.target.value })} placeholder="Дүн (₮)" className={inputClass} />
              <input type="month" value={bulkPayForm.month} onChange={(event) => setBulkPayForm({ ...bulkPayForm, month: event.target.value })} className={inputClass} />
              <input value={bulkPayForm.description} onChange={(event) => setBulkPayForm({ ...bulkPayForm, description: event.target.value })} placeholder="Тайлбар" className={inputClass} />
              <button type="button" onClick={sendBulkPayments} disabled={payLoading || !bulkPayForm.amount || residents.length === 0} className="rounded-lg bg-blue-600 px-5 py-2.5 text-xs font-black text-white transition hover:bg-blue-700 disabled:opacity-50">
                {payLoading ? "Үүсгэж байна..." : `${residents.length} хүнд үүсгэх`}
              </button>
            </div>
          ) : null}
        </Card>
      ) : null}

      <PaymentTable payments={payments} loading={loading} fmtDate={fmtDate} />
    </div>
  );
}

function PaymentTable({ payments, loading, fmtDate }: { payments: Payment[]; loading: boolean; fmtDate: (date?: string | null) => string }) {
  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-xs text-gray-400 dark:bg-slate-800/80 dark:text-slate-500">
            <tr>
              <th className="px-5 py-3 font-bold">Оршин суугч</th>
              <th className="px-5 py-3 font-bold">Сар</th>
              <th className="px-5 py-3 font-bold">Дүн</th>
              <th className="px-5 py-3 font-bold">Статус</th>
              <th className="px-5 py-3 font-bold">Огноо</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 dark:divide-slate-800">
            {loading ? (
              [1, 2, 3].map((item) => <tr key={item}><td colSpan={5} className="px-5 py-4"><div className="h-4 animate-pulse rounded bg-gray-100 dark:bg-slate-700" /></td></tr>)
            ) : payments.length === 0 ? (
              <tr><td colSpan={5}><EmptyState text="Төлбөр байхгүй байна" /></td></tr>
            ) : (
              payments.map((payment) => (
                <tr key={payment.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/80">
                  <td className="px-5 py-3.5">
                    <p className="font-bold text-gray-800 dark:text-slate-100">{payment.resident.name ?? payment.resident.email}</p>
                    <p className="mt-0.5 text-xs text-gray-400 dark:text-slate-500">{payment.resident.unitNumber ? `${payment.resident.unitNumber}-р тоот` : ""}</p>
                  </td>
                  <td className="px-5 py-3.5 text-gray-600 dark:text-slate-300">{payment.month}</td>
                  <td className="px-5 py-3.5 font-black text-gray-900 dark:text-slate-50">{payment.amount.toLocaleString()}₮</td>
                  <td className="px-5 py-3.5"><span className={`rounded-md border px-2.5 py-1 text-xs font-bold ${statusMap[payment.status]?.cls}`}>{statusMap[payment.status]?.label}</span></td>
                  <td className="px-5 py-3.5 text-gray-400 dark:text-slate-500">{fmtDate(payment.createdAt)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function ResidentsTab({ residents, loading, payments, requests, onSelectResident }: { residents: Resident[]; loading: boolean; payments: Payment[]; requests: Request[]; onSelectResident: (resident: Resident) => void }) {
  return (
    <Card className="overflow-hidden">
      <CardHeader title="Оршин суугчдын жагсаалт" />
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-xs text-gray-400 dark:bg-slate-800/80 dark:text-slate-500">
            <tr>
              <th className="px-5 py-3 font-bold">Нэр</th>
              <th className="px-5 py-3 font-bold">Имэйл</th>
              <th className="px-5 py-3 font-bold">Тоот</th>
              <th className="px-5 py-3 font-bold">Төлөв</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 dark:divide-slate-800">
            {loading ? (
              [1, 2, 3].map((item) => <tr key={item}><td colSpan={4} className="px-5 py-4"><div className="h-4 animate-pulse rounded bg-gray-100 dark:bg-slate-700" /></td></tr>)
            ) : residents.length === 0 ? (
              <tr><td colSpan={4}><EmptyState text="Оршин суугч бүртгэгдээгүй байна" /></td></tr>
            ) : (
              residents.map((resident) => {
                const pending = payments.filter((payment) => payment.residentId === resident.id && payment.status !== "PAID").reduce((sum, payment) => sum + payment.amount, 0);
                const reqCount = requests.filter((request) => request.resident.email === resident.email).length;
                return (
                <tr key={resident.id} onClick={() => onSelectResident(resident)} className="cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-800/80">
                  <td className="px-5 py-3.5 font-bold text-gray-800 dark:text-slate-100">{resident.name ?? "Нэргүй"}</td>
                  <td className="px-5 py-3.5 text-gray-500 dark:text-slate-400">{resident.email}</td>
                  <td className="px-5 py-3.5 text-gray-500 dark:text-slate-400">{resident.unitNumber ?? "—"}</td>
                  <td className="px-5 py-3.5 text-gray-500 dark:text-slate-400">{pending.toLocaleString()}₮ · {reqCount} хүсэлт</td>
                </tr>
              )})
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function AnnouncementsTab({
  announcements,
  showAnnForm,
  setShowAnnForm,
  annForm,
  setAnnForm,
  annLoading,
  createAnn,
  inputClass,
  fmtDate,
  hideFormButton = false,
}: {
  announcements: Announcement[];
  showAnnForm: boolean;
  setShowAnnForm: (show: boolean) => void;
  annForm: { title: string; content: string; type: string; imageUrl: string };
  setAnnForm: (form: { title: string; content: string; type: string; imageUrl: string }) => void;
  annLoading: boolean;
  createAnn: () => void;
  inputClass: string;
  fmtDate: (date?: string | null) => string;
  hideFormButton?: boolean;
}) {
  const handleImageChange = (file?: File) => {
    if (!file || !file.type.startsWith("image/")) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setAnnForm({ ...annForm, imageUrl: reader.result });
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-5">
      {!hideFormButton ? (
        showAnnForm ? (
          <Card className="p-6">
            <h2 className="mb-4 flex items-center gap-2 text-base font-bold text-slate-900 dark:text-slate-50"><Bell size={18} className="text-blue-600" /> Шинэ зарлал нэмэх</h2>
            <div className="grid gap-3">
              <input value={annForm.title} onChange={(event) => setAnnForm({ ...annForm, title: event.target.value })} placeholder="Гарчиг" className={inputClass} />
              <textarea value={annForm.content} onChange={(event) => setAnnForm({ ...annForm, content: event.target.value })} placeholder="Агуулга" rows={3} className={`${inputClass} resize-none`} />
              <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/60 p-3 dark:border-slate-700 dark:bg-slate-800/30">
                {annForm.imageUrl ? (
                  <div className="overflow-hidden rounded-lg border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
                    <img src={annForm.imageUrl} alt="" className="h-48 w-full object-cover" />
                    <div className="flex items-center justify-between gap-3 px-3 py-2">
                      <span className="truncate text-xs font-semibold text-slate-500 dark:text-slate-400">Зураг хавсаргасан</span>
                      <button
                        type="button"
                        onClick={() => setAnnForm({ ...annForm, imageUrl: "" })}
                        className="inline-flex items-center gap-1 rounded-md border border-red-200 bg-red-50 px-2.5 py-1.5 text-xs font-bold text-red-700 transition hover:bg-red-100"
                      >
                        <X size={13} />
                        Устгах
                      </button>
                    </div>
                  </div>
                ) : (
                  <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-600 transition hover:border-blue-200 hover:text-blue-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
                    <ImageIcon size={17} />
                    Зураг оруулах
                    <input type="file" accept="image/*" onChange={(event) => handleImageChange(event.target.files?.[0])} className="hidden" />
                  </label>
                )}
              </div>
              <select value={annForm.type} onChange={(event) => setAnnForm({ ...annForm, type: event.target.value })} className={inputClass}>
                <option value="INFO">Мэдээлэл</option>
                <option value="WARNING">Анхааруулга</option>
                <option value="URGENT">Яаралтай</option>
              </select>
              <div className="flex flex-wrap gap-3">
                <button onClick={createAnn} disabled={annLoading || !annForm.title || !annForm.content} className="rounded-lg bg-gradient-to-br from-blue-600 to-blue-700 px-5 py-2.5 text-xs font-bold text-white shadow-[0_4px_12px_rgba(37,99,235,0.3)] transition hover:from-blue-700 hover:to-blue-800 disabled:opacity-45">
                  {annLoading ? "Нэмж байна..." : "Нийтлэх"}
                </button>
                <button onClick={() => setShowAnnForm(false)} className="rounded-lg border border-slate-200 px-5 py-2.5 text-xs font-bold text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800">Цуцлах</button>
              </div>
            </div>
          </Card>
        ) : (
          <button onClick={() => setShowAnnForm(true)} className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 bg-slate-50/50 py-4 text-sm font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-slate-600 dark:border-slate-600 dark:bg-slate-800/30 dark:text-slate-400 dark:hover:bg-slate-800">
            <Plus size={18} /> Шинэ зарлал нэмэх
          </button>
        )
      ) : null}

      {announcements.length === 0 ? (
        <Card className="p-12">
          <EmptyState text="Зарлал байхгүй байна" />
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2">
          {announcements.map((announcement) => <AnnouncementCard key={announcement.id} announcement={announcement} fmtDate={fmtDate} />)}
        </div>
      )}
    </div>
  );
}

function AnnouncementRow({ announcement, fmtDate, compact = false }: { announcement: Announcement; fmtDate: (date?: string | null) => string; compact?: boolean }) {
  const tone = typeMap[announcement.type] ?? typeMap.INFO;
  const Icon = tone.Icon;

  return (
    <div className="flex items-start gap-3 px-5 py-3.5">
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${tone.bg} ${tone.text} ring-1 ring-current/15`}>
        <Icon size={17} strokeWidth={2} />
      </div>
      <div className="min-w-0 flex-1">
        {announcement.imageUrl ? <img src={announcement.imageUrl} alt="" className="mb-3 h-28 w-full rounded-lg object-cover" /> : null}
        <div className="flex flex-wrap items-center gap-2">
          <p className="truncate text-sm font-bold text-gray-800 dark:text-slate-100">{announcement.title}</p>
          {!compact ? <span className={`rounded-md px-2 py-0.5 text-[11px] font-bold ${tone.bg} ${tone.text}`}>{tone.label}</span> : null}
        </div>
        {!compact ? <p className="mt-1 line-clamp-2 text-xs leading-5 text-gray-500 dark:text-slate-400">{announcement.content}</p> : null}
        <p className="mt-1 text-xs text-gray-400 dark:text-slate-500">{fmtDate(announcement.createdAt)}</p>
      </div>
    </div>
  );
}

function AnnouncementCard({ announcement, fmtDate }: { announcement: Announcement; fmtDate: (date?: string | null) => string }) {
  const tone = typeMap[announcement.type] ?? typeMap.INFO;
  const Icon = tone.Icon;
  
  const borderColor = announcement.type === "INFO" ? "border-t-4 border-t-amber-500" : 
                      announcement.type === "WARNING" ? "border-t-4 border-t-blue-500" :
                      "border-t-4 border-t-purple-500";
  
  return (
    <Card className={`group overflow-hidden rounded-2xl p-5 ${borderColor}`}>
      <div className="flex items-start gap-3">
        <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-xl ${tone.bg} ${tone.text} shadow-sm`}>
          <Icon size={24} strokeWidth={2} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">{tone.label}</p>
          <h3 className="mt-1 truncate text-lg font-bold text-slate-900 dark:text-slate-50">{announcement.title}</h3>
          {announcement.imageUrl ? <img src={announcement.imageUrl} alt="" className="mt-3 h-44 w-full rounded-xl object-cover" /> : null}
          <p className="mt-2 line-clamp-3 text-sm leading-5 text-slate-600 dark:text-slate-400">{announcement.content}</p>
          <p className="mt-3 text-xs font-medium text-slate-500 dark:text-slate-500">{fmtDate(announcement.createdAt)}</p>
        </div>
      </div>
    </Card>
  );
}

function ResidentDetailDrawer({
  resident,
  payments,
  requests,
  fmtDate,
  onClose,
}: {
  resident: Resident;
  payments: Payment[];
  requests: Request[];
  fmtDate: (date?: string | null) => string;
  onClose: () => void;
}) {
  const residentPayments = payments.filter((payment) => payment.residentId === resident.id);
  const residentRequests = requests.filter((request) => request.resident.email === resident.email);
  const pendingAmount = residentPayments.filter((payment) => payment.status !== "PAID").reduce((sum, payment) => sum + payment.amount, 0);

  return (
    <div className="fixed inset-0 z-[85] flex justify-end bg-slate-950/45 backdrop-blur-sm" onClick={onClose}>
      <div className="h-full w-full max-w-xl overflow-y-auto bg-white shadow-2xl dark:bg-slate-900" onClick={(event) => event.stopPropagation()}>
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white/95 px-5 py-4 backdrop-blur dark:border-slate-800 dark:bg-slate-900/95">
          <div className="flex min-w-0 items-center gap-3">
            {resident.avatarUrl ? (
              <img src={resident.avatarUrl} alt="" className="h-12 w-12 rounded-xl object-cover" />
            ) : (
              <div className="grid h-12 w-12 place-items-center rounded-xl bg-blue-50 text-lg font-black text-blue-700">
                {(resident.name ?? resident.email).slice(0, 1).toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <h2 className="truncate text-lg font-black text-slate-950 dark:text-slate-50">{resident.name ?? "Нэргүй оршин суугч"}</h2>
              <p className="truncate text-xs font-semibold text-slate-400">{resident.email}</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 dark:hover:bg-slate-800">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4 p-5">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
              <p className="text-xs font-black text-blue-700">Тоот</p>
              <p className="mt-2 text-lg font-black text-slate-950">{resident.unitNumber ?? "—"}</p>
            </div>
            <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4">
              <p className="text-xs font-black text-emerald-700">Хүлээгдэж буй</p>
              <p className="mt-2 text-lg font-black text-slate-950">{pendingAmount.toLocaleString()}₮</p>
            </div>
            <div className="rounded-xl border border-amber-100 bg-amber-50 p-4">
              <p className="text-xs font-black text-amber-700">Хүсэлт</p>
              <p className="mt-2 text-lg font-black text-slate-950">{residentRequests.length}</p>
            </div>
          </div>

          <Card className="overflow-hidden shadow-none">
            <CardHeader title="Холбоо барих" />
            <div className="grid gap-2 p-5 sm:grid-cols-2">
              <a href={`mailto:${resident.email}`} className="rounded-lg border border-slate-200 px-4 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">
                {resident.email}
              </a>
              <a href={resident.phoneNumber ? `tel:${resident.phoneNumber}` : undefined} className={`rounded-lg border px-4 py-3 text-sm font-black transition ${resident.phoneNumber ? "border-slate-200 text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800" : "pointer-events-none border-slate-100 text-slate-300 dark:border-slate-800 dark:text-slate-600"}`}>
                {resident.phoneNumber ?? "Утас бүртгэлгүй"}
              </a>
            </div>
          </Card>

          <Card className="overflow-hidden shadow-none">
            <CardHeader title="Сүүлийн төлбөрүүд" />
            <div className="divide-y divide-slate-50 dark:divide-slate-800">
              {residentPayments.length === 0 ? <EmptyState text="Төлбөрийн мэдээлэл алга" /> : residentPayments.slice(0, 6).map((payment) => (
                <div key={payment.id} className="flex items-center justify-between gap-3 px-5 py-3">
                  <div>
                    <p className="text-sm font-black text-slate-900 dark:text-slate-50">{payment.month}</p>
                    <p className="text-xs text-slate-400">{fmtDate(payment.createdAt)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-slate-900 dark:text-slate-50">{payment.amount.toLocaleString()}₮</p>
                    <p className="text-xs font-bold text-slate-400">{statusMap[payment.status]?.label ?? payment.status}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="overflow-hidden shadow-none">
            <CardHeader title="Засварын хүсэлтүүд" />
            <div className="divide-y divide-slate-50 dark:divide-slate-800">
              {residentRequests.length === 0 ? <EmptyState text="Хүсэлт алга" /> : residentRequests.slice(0, 6).map((request) => (
                <div key={request.id} className="px-5 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-black text-slate-900 dark:text-slate-50">{request.title}</p>
                    <span className={`rounded-md border px-2 py-0.5 text-[11px] font-bold ${statusMap[request.status]?.cls}`}>{statusMap[request.status]?.label}</span>
                  </div>
                  <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">{request.description}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function InfoGrid({ title, items }: { title: string; items: [string, string][] }) {
  return (
    <Card className="p-5">
      <h2 className="mb-4 text-sm font-black text-gray-800 dark:text-slate-100">{title}</h2>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {items.map(([label, value]) => (
          <div key={label} className="rounded-lg border border-blue-100 bg-blue-50/60 px-4 py-4">
            <p className="text-xs font-bold text-gray-400 dark:text-slate-500">{label}</p>
            <p className="mt-2 text-2xl font-black text-gray-900 dark:text-slate-50">{value}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}
