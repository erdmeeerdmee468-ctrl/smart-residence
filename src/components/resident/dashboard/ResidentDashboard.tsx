"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import {
  Bell,
  Building2,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Circle,
  ClipboardList,
  CreditCard,
  FileText,
  Home,
  Loader2,
  LogOut,
  Mail,
  MessageSquare,
  Phone,
  Plus,
  Printer,
  Settings,
  User,
  Wallet,
  Wrench,
  Trash2,
  X,
  type LucideIcon,
} from "lucide-react";
import { ResidenceLogo } from "@/components/brand/ResidenceLogo";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { NotificationsModal } from "@/components/notifications/NotificationsModal";

type Payment = {
  id: string;
  amount: number;
  month: string;
  description: string | null;
  status: "PENDING" | "PAID" | "OVERDUE";
  createdAt: string;
  paidAt?: string | null;
};

type Request = {
  id: string;
  title: string;
  description: string;
  status: "OPEN" | "IN_PROGRESS" | "RESOLVED";
  createdAt: string;
  updatedAt?: string;
};

type Announcement = {
  id: string;
  title: string;
  content: string;
  type: string;
  imageUrl?: string | null;
  createdAt: string;
};

type Poll = {
  id: string;
  question: string;
  expiresAt: string | null;
  options: { id: string; text: string; votes: number }[];
};

type UserType = {
  id: string;
  name: string | null;
  email: string;
  unitNumber?: string | null;
  phoneNumber?: string | null;
  avatarUrl?: string | null;
  createdAt?: string;
};

export type ResidentDashboardView =
  | "overview"
  | "payments"
  | "requests"
  | "polls"
  | "announcements"
  | "profile"
  | "docs"
  | "contact";

type ResidentDashboardProps = { view?: ResidentDashboardView };

const payStatus: Record<Payment["status"], { label: string; cls: string; text: string }> = {
  PENDING: { label: "Хүлээгдэж буй", cls: "bg-amber-50 text-amber-600 border-amber-100", text: "text-amber-600" },
  PAID: { label: "Төлөгдсөн", cls: "bg-emerald-50 text-emerald-600 border-emerald-100", text: "text-emerald-600" },
  OVERDUE: { label: "Хоцорсон", cls: "bg-red-50 text-red-600 border-red-100", text: "text-red-600" },
};

const reqStatus: Record<Request["status"], { label: string; cls: string }> = {
  OPEN: { label: "Шинэ", cls: "bg-blue-50 text-blue-600 border-blue-100" },
  IN_PROGRESS: { label: "Хүлээгдэж буй", cls: "bg-amber-50 text-amber-600 border-amber-100" },
  RESOLVED: { label: "Шийдэгдсэн", cls: "bg-emerald-50 text-emerald-600 border-emerald-100" },
};

const requestLogisticsCopy: Record<
  Request["status"],
  { step: string; hint: string }
> = {
  OPEN: {
    step: "1/3 — СӨХ хүлээн авсан",
    hint: "Менежер таны хүсэлтийг уншиж, ажилд оруулах хүртэл түр хүлээнэ үү.",
  },
  IN_PROGRESS: {
    step: "2/3 — Засвар / шалгалт",
    hint: "СӨХ ажилтан талбайд ажиллаж байна. Шаардлагатай бол тантай холбогдоно.",
  },
  RESOLVED: {
    step: "3/3 — Ажил дууссан",
    hint: "Хүсэлт хаагдсан. Нэмэлт асуудал байвал шинэ хүсэлт үүсгэнэ үү.",
  },
};

function receiptNoFromPayment(payment: Payment) {
  const d = payment.paidAt ? new Date(payment.paidAt) : new Date(payment.createdAt);
  return `SR-${d.getFullYear()}-${payment.id.slice(-6).toUpperCase()}`;
}

const announcementTone: Record<string, { Icon: LucideIcon; bg: string; text: string }> = {
  INFO: { Icon: CreditCard, bg: "bg-blue-50", text: "text-blue-500" },
  WARNING: { Icon: Wrench, bg: "bg-amber-50", text: "text-amber-500" },
  URGENT: { Icon: Bell, bg: "bg-red-50", text: "text-red-500" },
};

const navItems: {
  href: string;
  label: string;
  Icon: LucideIcon;
  badge?: (counts: { openRequests: number; announcements: number }) => number;
}[] = [
  { href: "/resident", label: "Миний самбар", Icon: Home },
  { href: "/resident/profile", label: "Миний мэдээлэл", Icon: User },
  { href: "/resident/payments", label: "Төлбөрийн мэдээлэл", Icon: CreditCard },
  { href: "/resident/requests", label: "Засварын хүсэлт", Icon: Wrench },
  { href: "/resident/polls", label: "Санал асуулга", Icon: MessageSquare },
  { href: "/resident/news", label: "Зарлал, мэдээ", Icon: ClipboardList },
  { href: "/resident/docs", label: "Баримт бичиг", Icon: FileText },
  { href: "/resident/contact", label: "Холбоо барих", Icon: Phone },
];

const RESIDENT_NOTIFICATION_READ_KEY = "smart-residence-resident-read-announcements";

function Card({
  children,
  className = "",
}: {
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`rounded-lg border border-gray-100 bg-white shadow-[0_12px_36px_rgba(15,23,42,0.04)] dark:border-slate-700 dark:bg-slate-900 dark:shadow-[0_12px_36px_rgba(0,0,0,0.35)] ${className}`}>
      {children}
    </section>
  );
}

function CardHeader({
  title,
  action,
}: {
  title: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3 px-5 pb-3 pt-4">
      <h2 className="text-sm font-bold text-gray-800 dark:text-slate-100">{title}</h2>
      {action}
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
  loading,
}: {
  label: string;
  value: string;
  sub: string;
  loading: boolean;
}) {
  return (
    <Card className="p-4">
      <p className="mb-2 text-[11px] font-medium text-gray-400 dark:text-slate-500">{label}</p>
      <p className="min-h-8 text-2xl font-black leading-tight text-gray-800 dark:text-slate-100">
        {loading ? <span className="inline-block h-7 w-20 animate-pulse rounded-md bg-gray-100 dark:bg-slate-700" /> : value}
      </p>
      <p className="mt-1 text-[11px] font-medium text-gray-400 dark:text-slate-500">{sub}</p>
    </Card>
  );
}

function EmptyState({ text }: { text: string }) {
  return <div className="px-5 py-10 text-center text-sm text-gray-400 dark:text-slate-500">{text}</div>;
}

export function ResidentDashboard({ view = "overview" }: ResidentDashboardProps) {
  const pathname = usePathname();
  const [user, setUser] = useState<UserType | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [requests, setRequests] = useState<Request[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [polls, setPolls] = useState<Poll[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [selectedPollOption, setSelectedPollOption] = useState<Record<string, string>>({});
  const [votedPolls, setVotedPolls] = useState<Record<string, string>>({});
  const [reqForm, setReqForm] = useState({ title: "", description: "", notes: "" });
  const [showReqForm, setShowReqForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [receipt, setReceipt] = useState<{ payment: Payment; receiptNo: string } | null>(null);
  const [payingId, setPayingId] = useState<string | null>(null);
  const [payMessage, setPayMessage] = useState("");
  const [deletingPaymentId, setDeletingPaymentId] = useState<string | null>(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [readAnnouncementIds, setReadAnnouncementIds] = useState<string[]>([]);
  const [selectedAnnouncementImage, setSelectedAnnouncementImage] = useState<{ src: string; title: string } | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const meRes = await fetch("/api/auth/me");
      if (!meRes.ok) {
        setUser(null);
        setPayments([]);
        setRequests([]);
        setAnnouncements([]);
        setPolls([]);
        return;
      }

      const meData = await meRes.json();
      setUser(meData.user);

      const [payRes, reqRes, annRes, pollRes] = await Promise.all([
        fetch("/api/resident/payments"),
        fetch("/api/resident/requests"),
        fetch("/api/admin/announcements"),
        fetch("/api/soh/polls"),
      ]);

      if (payRes.ok) setPayments(await payRes.json());
      if (reqRes.ok) setRequests(await reqRes.json());
      if (annRes.ok) setAnnouncements(await annRes.json());
      if (pollRes.ok) setPolls(await pollRes.json());
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
      const stored = window.localStorage.getItem(RESIDENT_NOTIFICATION_READ_KEY);
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

  const submitRequest = async () => {
    if (!reqForm.title.trim() || !reqForm.description.trim()) return;

    setSubmitting(true);
    const res = await fetch("/api/resident/requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(reqForm),
    });

    if (res.ok) {
      setReqForm({ title: "", description: "", notes: "" });
      setShowReqForm(false);
      fetchData();
    }
    setSubmitting(false);
  };

  const votePoll = async (pollId: string) => {
    const optionId = selectedPollOption[pollId];
    if (!optionId || votedPolls[pollId]) return;

    const res = await fetch("/api/soh/polls/vote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ optionId }),
    });

    if (res.ok) {
      setVotedPolls((prev) => ({ ...prev, [pollId]: optionId }));
      fetchData();
    }
  };

  const payPayment = async (paymentId: string) => {
    setPayingId(paymentId);
    setPayMessage("");
    try {
      const res = await fetch("/api/resident/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentId }),
      });
      const data = (await res.json()) as { message?: string; payment?: Payment; receiptNo?: string };
      if (!res.ok) {
        setPayMessage(data.message ?? "Төлбөр бүртгэхэд алдаа гарлаа");
        return;
      }
      if (data.payment && data.receiptNo) {
        setReceipt({
          payment: {
            ...data.payment,
            createdAt: String(data.payment.createdAt),
            paidAt: data.payment.paidAt ? String(data.payment.paidAt) : null,
          },
          receiptNo: data.receiptNo,
        });
      }
      void fetchData();
    } catch {
      setPayMessage("Сүлжээний алдаа");
    } finally {
      setPayingId(null);
    }
  };

  const deletePayment = async (paymentId: string) => {
    setDeletingPaymentId(paymentId);
    setPayMessage("");

    try {
      const res = await fetch("/api/resident/payments", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentId }),
      });

      const data = (await res.json().catch(() => ({}))) as { message?: string };
      if (!res.ok) {
        setPayMessage(data.message ?? "Төлбөр устгахад алдаа гарлаа");
        return;
      }

      if (receipt?.payment.id === paymentId) {
        setReceipt(null);
      }
      void fetchData();
    } catch {
      setPayMessage("Сүлжээний алдаа");
    } finally {
      setDeletingPaymentId(null);
    }
  };

  const markAnnouncementsRead = useCallback(() => {
    const ids = announcements.map((announcement) => announcement.id);
    if (ids.length === 0) return;

    setReadAnnouncementIds((current) => {
      const next = Array.from(new Set([...current, ...ids]));
      window.localStorage.setItem(RESIDENT_NOTIFICATION_READ_KEY, JSON.stringify(next));
      return next;
    });
  }, [announcements]);

  useEffect(() => {
    if (view === "announcements") {
      markAnnouncementsRead();
    }
  }, [markAnnouncementsRead, view]);

  const fmtDate = (date?: string | null) => (mounted && date ? new Date(date).toLocaleDateString("mn-MN") : "—");
  const latestPayment = payments[0];
  const openRequests = requests.filter((request) => request.status !== "RESOLVED").length;
  const pendingTotal = payments
    .filter((payment) => payment.status !== "PAID")
    .reduce((sum, payment) => sum + payment.amount, 0);
  const activePoll = polls[0];
  const unreadAnnouncementCount = announcements.filter((announcement) => !readAnnouncementIds.includes(announcement.id)).length;
  const currentTitle =
    view === "payments"
      ? "Төлбөрийн мэдээлэл"
      : view === "requests"
        ? "Засварын хүсэлт"
        : view === "polls"
          ? "Санал асуулга"
          : view === "announcements"
            ? "Зарлал, мэдээ"
            : view === "profile"
              ? "Миний мэдээлэл"
              : view === "docs"
                ? "Баримт бичиг"
                : view === "contact"
                  ? "Холбоо барих"
                  : "Миний самбар";

  const inputClass =
    "w-full rounded-lg border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-800 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15 placeholder:text-gray-400 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500";

  return (
    <div className="min-h-screen bg-[#f3f5f7] p-3 text-gray-900 dark:bg-slate-950 dark:text-slate-100 sm:p-4">
      <div className="mx-auto flex h-[calc(100vh-24px)] max-w-[1520px] overflow-hidden rounded-lg border border-gray-200 bg-white shadow-[0_20px_70px_rgba(15,23,42,0.08)] dark:border-slate-700 dark:bg-slate-900 dark:shadow-[0_20px_70px_rgba(0,0,0,0.35)] sm:h-[calc(100vh-32px)]">
        <aside className="hidden w-[190px] shrink-0 flex-col bg-[#075c46] md:flex">
          <div className="px-4 pb-5 pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-white/15 bg-white p-1.5 shadow-lg shadow-black/20">
                <ResidenceLogo className="h-full w-full" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-[12px] font-black uppercase text-white">Өндөр хотхон</p>
                <p className="truncate text-[10px] text-emerald-100/70">Оршин суугчийн систем</p>
              </div>
            </div>
          </div>

          <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto px-3 pb-3 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {navItems.map(({ href, label, Icon }) => {
              const active = pathname === href || (href !== "/resident" && pathname?.startsWith(href));
              const badge =
                href === "/resident/requests"
                  ? openRequests
                  : href === "/resident/news"
                    ? unreadAnnouncementCount
                    : 0;

              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex min-h-10 items-center justify-between gap-2 rounded-md px-3 py-2 text-[12px] font-semibold transition ${
                    active ? "bg-white/12 text-white" : "text-emerald-50/80 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <span className="flex min-w-0 items-center gap-2.5">
                    <Icon size={15} strokeWidth={1.9} className="shrink-0" />
                    <span className="truncate">{label}</span>
                  </span>
                  {badge > 0 ? (
                    <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                      {badge}
                    </span>
                  ) : null}
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto shrink-0 border-t border-white/10 p-3">
            <div className="flex items-center gap-2">
              {user?.avatarUrl ? (
                <img src={user.avatarUrl} alt="" className="h-8 w-8 shrink-0 rounded-full border border-white/30 object-cover" />
              ) : (
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-xs font-black text-emerald-700">
                  {user?.name?.[0]?.toUpperCase() ?? "?"}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-xs font-bold text-white">{user?.name ?? "Оршин суугч"}</p>
                  <button
                    onClick={handleLogout}
                    title="Гарах"
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-white/30 bg-red-500/90 text-white shadow-sm transition hover:bg-red-600"
                  >
                    <LogOut size={13} />
                  </button>
                </div>
                {user?.unitNumber ? (
                  <p className="truncate text-[10px] text-emerald-100/70">{user.unitNumber}-р байр</p>
                ) : null}
              </div>
            </div>
          </div>
        </aside>

        <main className="flex min-w-0 flex-1 flex-col overflow-y-auto bg-[#fbfcfd] dark:bg-slate-950">
          <div className="border-b border-gray-100 bg-white px-4 py-3 dark:border-slate-700 dark:bg-slate-900 md:hidden">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-white p-1 shadow-sm ring-1 ring-emerald-100">
                  <ResidenceLogo className="h-full w-full" />
                </span>
                <div>
                  <p className="text-sm font-black text-gray-900 dark:text-slate-100">Өндөр хотхон</p>
                  <p className="text-[11px] text-gray-400 dark:text-slate-500">Оршин суугчийн систем</p>
                </div>
              </div>
              <Link href="/resident/requests" className="shrink-0 rounded-md bg-emerald-600 px-3 py-2 text-xs font-bold text-white">
                Хүсэлт
              </Link>
            </div>
          </div>

          <nav
            className="flex gap-2 overflow-x-auto overscroll-x-contain border-b border-gray-100 bg-white px-3 py-2.5 dark:border-slate-700 dark:bg-slate-900 md:hidden [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            aria-label="Үндсэн цэс"
          >
            {navItems.map(({ href, label, Icon }) => {
              const active = pathname === href || (href !== "/resident" && pathname?.startsWith(href));
              const badge =
                href === "/resident/requests"
                  ? openRequests
                  : href === "/resident/news"
                    ? unreadAnnouncementCount
                    : 0;
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex shrink-0 items-center gap-2 rounded-full border px-3 py-2 text-xs font-bold transition ${
                    active
                      ? "border-emerald-500 bg-emerald-50 text-emerald-800 dark:border-emerald-500/60 dark:bg-emerald-950/50 dark:text-emerald-100"
                      : "border-gray-200 bg-gray-50 text-gray-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
                  }`}
                >
                  <Icon size={14} strokeWidth={2} className="shrink-0" />
                  <span className="max-w-[10rem] truncate">{label}</span>
                  {badge > 0 ? (
                    <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">{badge}</span>
                  ) : null}
                </Link>
              );
            })}
          </nav>

          <div className="relative flex-1 overflow-y-auto px-4 pb-24 pt-4 sm:px-6 md:pb-6 lg:px-7">
            <div className="relative">
              <Card className="overflow-hidden">
                <header className="flex flex-col gap-3 border-b border-gray-100 px-5 py-5 dark:border-slate-700 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h1 className="text-xl font-black text-gray-900 dark:text-slate-50">{currentTitle}</h1>
                    <p className="mt-1 text-xs font-medium text-gray-400 dark:text-slate-500">Сайн байна уу, {user?.name ?? "Оршин суугч"}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <ThemeToggle
                      className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-100 bg-white text-gray-500 shadow-sm transition hover:text-emerald-600 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-400"
                      iconSize={17}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setShowNotifications(true);
                        markAnnouncementsRead();
                      }}
                      className="relative flex h-9 w-9 items-center justify-center rounded-full border border-gray-100 bg-white text-gray-500 shadow-sm transition hover:text-emerald-600 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-400"
                      title="Мэдэгдэл"
                      aria-label="Мэдэгдэл"
                    >
                      <Bell size={17} />
                      {unreadAnnouncementCount > 0 ? (
                        <span className="absolute right-1.5 top-1.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-red-500" />
                      ) : null}
                    </button>
                  </div>
                </header>

                <div className="space-y-5 p-4 sm:p-5">
                  {view === "overview" ? (
                    <>
                      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                        <StatCard
                          label="Төлбөрийн үлдэгдэл"
                          value={`${pendingTotal.toLocaleString()}₮`}
                          sub={pendingTotal > 0 ? "Төлөх дүн" : "Төлбөргүй"}
                          loading={loading}
                        />
                        <StatCard
                          label="Сүүлийн төлбөр"
                          value={latestPayment?.month ?? "—"}
                          sub={latestPayment ? `${latestPayment.amount.toLocaleString()}₮ төлбөр` : "Мэдээлэл алга"}
                          loading={loading}
                        />
                        <StatCard
                          label="Байрны дугаар"
                          value={user?.unitNumber ?? "—"}
                          sub={user?.unitNumber ? "1 давхар" : "Бүртгэл дутуу"}
                          loading={loading}
                        />
                        <StatCard
                          label="Бүртгэлийн огноо"
                          value={fmtDate(user?.createdAt)}
                          sub="Идэвхтэй хэрэглэгч"
                          loading={loading}
                        />
                      </div>

                      <div className="grid gap-5 lg:grid-cols-[0.95fr_1.35fr]">
                        <Card className="p-5">
                          <h2 className="text-sm font-black text-gray-800 dark:text-slate-100">Засварын хүсэлт гаргах</h2>
                          <p className="mt-2 text-xs leading-5 text-gray-400 dark:text-slate-500">Гэртээ гарсан асуудлын мэдээллийг СӨХ-д шууд илгээнэ үү.</p>
                          <button
                            onClick={() => setShowReqForm(true)}
                            className="mt-5 inline-flex items-center gap-2 rounded-md bg-emerald-600 px-4 py-2.5 text-xs font-black text-white transition hover:bg-emerald-500"
                          >
                            <Plus size={15} />
                            Шинэ хүсэлт гаргах
                          </button>
                        </Card>

                        <RequestsPreview requests={requests} loading={loading} fmtDate={fmtDate} />
                      </div>

                      <div className="grid gap-5 lg:grid-cols-2">
                        <PollCard
                          poll={activePoll}
                          loading={loading}
                          selectedOption={activePoll ? selectedPollOption[activePoll.id] : undefined}
                          votedOption={activePoll ? votedPolls[activePoll.id] : undefined}
                          onSelect={(pollId, optionId) => setSelectedPollOption((prev) => ({ ...prev, [pollId]: optionId }))}
                          onVote={votePoll}
                          fmtDate={fmtDate}
                        />
                        <AnnouncementsList announcements={announcements} loading={loading} fmtDate={fmtDate} compact onOpenImage={setSelectedAnnouncementImage} />
                      </div>
                    </>
                  ) : null}

                  {view === "payments" ? (
                    <PaymentsView
                      payments={payments}
                      latestPayment={latestPayment}
                      loading={loading}
                      fmtDate={fmtDate}
                      payingId={payingId}
                      payMessage={payMessage}
                      onPay={payPayment}
                  deletingPaymentId={deletingPaymentId}
                  onDeletePayment={deletePayment}
                      onShowReceipt={(payment) =>
                        setReceipt({ payment, receiptNo: receiptNoFromPayment(payment) })
                      }
                    />
                  ) : null}

                  {view === "requests" ? (
                    <RequestsView
                      requests={requests}
                      loading={loading}
                      showReqForm={showReqForm}
                      setShowReqForm={setShowReqForm}
                      reqForm={reqForm}
                      setReqForm={setReqForm}
                      submitRequest={submitRequest}
                      submitting={submitting}
                      inputClass={inputClass}
                      fmtDate={fmtDate}
                    />
                  ) : null}

                  {view === "polls" ? (
                    <div className="grid gap-4 lg:grid-cols-2">
                      {loading ? (
                        [1, 2].map((item) => <Card key={item} className="h-56 animate-pulse bg-white p-5" />)
                      ) : polls.length === 0 ? (
                        <Card className="lg:col-span-2">
                          <EmptyState text="Санал асуулга байхгүй байна" />
                        </Card>
                      ) : (
                        polls.map((poll) => (
                          <PollCard
                            key={poll.id}
                            poll={poll}
                            loading={false}
                            selectedOption={selectedPollOption[poll.id]}
                            votedOption={votedPolls[poll.id]}
                            onSelect={(pollId, optionId) => setSelectedPollOption((prev) => ({ ...prev, [pollId]: optionId }))}
                            onVote={votePoll}
                            fmtDate={fmtDate}
                          />
                        ))
                      )}
                    </div>
                  ) : null}

                  {view === "announcements" ? (
                    <AnnouncementsList announcements={announcements} loading={loading} fmtDate={fmtDate} onOpenImage={setSelectedAnnouncementImage} />
                  ) : null}

                  {view === "profile" ? (
                    <ProfileView
                      user={user}
                      loading={loading}
                      fmtDate={fmtDate}
                      payments={payments}
                      requests={requests}
                      onProfileUpdated={(updatedUser) => setUser((current) => current ? { ...current, ...updatedUser } : updatedUser)}
                    />
                  ) : null}

                  {view === "docs" ? <DocsView /> : null}

                  {view === "contact" ? <ContactView /> : null}
                </div>
              </Card>
            </div>
          </div>
        </main>
      </div>

      {showReqForm && view === "overview" ? (
        <RequestModal
          reqForm={reqForm}
          setReqForm={setReqForm}
          submitRequest={submitRequest}
          submitting={submitting}
          onClose={() => {
            setShowReqForm(false);
            setReqForm({ title: "", description: "", notes: "" });
          }}
          inputClass={inputClass}
        />
      ) : null}

      {receipt ? (
        <PaymentReceiptModal
          receipt={receipt}
          user={user}
          mounted={mounted}
          fmtDate={fmtDate}
          fmtDateTime={(iso: string) =>
            mounted ? new Date(iso).toLocaleString("mn-MN", { dateStyle: "medium", timeStyle: "short" }) : "—"
          }
          onClose={() => setReceipt(null)}
        />
      ) : null}

      <NotificationsModal
        open={showNotifications}
        announcements={announcements}
        onClose={() => setShowNotifications(false)}
        title="Мэдэгдэл"
      />

      {selectedAnnouncementImage ? (
        <ImagePreviewModal
          image={selectedAnnouncementImage}
          onClose={() => setSelectedAnnouncementImage(null)}
        />
      ) : null}
    </div>
  );
}

function RequestLogisticsStrip({ status }: { status: Request["status"] }) {
  const meta = requestLogisticsCopy[status];
  const steps: { key: Request["status"]; label: string }[] = [
    { key: "OPEN", label: "Ирсэн" },
    { key: "IN_PROGRESS", label: "Явцад" },
    { key: "RESOLVED", label: "Дууссан" },
  ];
  const activeIndex = status === "OPEN" ? 0 : status === "IN_PROGRESS" ? 1 : 2;

  return (
    <div className="mt-3 space-y-2 border-t border-gray-100 pt-3 dark:border-slate-800">
      <p className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400">{meta.step}</p>
      <div className="flex flex-wrap items-center gap-1.5">
        {steps.map((step, index) => {
          const done = index < activeIndex;
          const active = index === activeIndex;
          return (
            <div key={step.key} className="flex items-center gap-1.5">
              {index > 0 ? <ChevronRight size={12} className="text-gray-300 dark:text-slate-600" /> : null}
              <span
                className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold ${
                  done
                    ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200"
                    : active
                      ? "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100"
                      : "border-gray-100 bg-gray-50 text-gray-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-500"
                }`}
              >
                {done ? <CheckCircle2 size={11} className="shrink-0" /> : active ? <Circle size={11} className="shrink-0" /> : <Circle size={11} className="shrink-0 opacity-40" />}
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
      <p className="text-[11px] leading-relaxed text-gray-500 dark:text-slate-400">{meta.hint}</p>
    </div>
  );
}

function PaymentReceiptModal({
  receipt,
  user,
  mounted,
  fmtDate,
  fmtDateTime,
  onClose,
}: {
  receipt: { payment: Payment; receiptNo: string };
  user: UserType | null;
  mounted: boolean;
  fmtDate: (date?: string | null) => string;
  fmtDateTime: (iso: string) => string;
  onClose: () => void;
}) {
  const { payment, receiptNo } = receipt;
  const paidLabel = payment.paidAt ? fmtDateTime(payment.paidAt) : mounted ? fmtDateTime(new Date().toISOString()) : "—";

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-slate-900/45 p-0 backdrop-blur-sm sm:items-center sm:p-4 print:static print:bg-transparent print:p-0">
      <div className="flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl border border-gray-200 bg-white shadow-2xl dark:border-slate-600 dark:bg-slate-900 sm:rounded-2xl print:max-h-none print:max-w-none print:rounded-none print:shadow-none">
        <div className="no-print flex items-center justify-between border-b border-gray-100 px-4 py-3 dark:border-slate-800">
          <p className="text-sm font-black text-gray-900 dark:text-slate-50">Төлбөрийн баримт</p>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 dark:hover:bg-slate-800"
            aria-label="Хаах"
          >
            <X size={18} />
          </button>
        </div>

        <div id="resident-payment-receipt" className="overflow-y-auto px-5 py-5 print:overflow-visible">
          <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50/80 p-5 dark:border-slate-700 dark:bg-slate-950/50 print:border-gray-300 print:bg-white">
            <div className="flex items-start justify-between gap-3 border-b border-gray-200 pb-4 dark:border-slate-700">
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-emerald-700 dark:text-emerald-400">Smart Residence</p>
                <p className="mt-1 text-sm font-bold text-gray-900 dark:text-slate-100">Өндөр хотхон</p>
                <p className="mt-0.5 text-[11px] text-gray-500 dark:text-slate-400">Төлбөрийн албан баримт (дансны баримт)</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold uppercase text-gray-400 dark:text-slate-500">Баримтын №</p>
                <p className="text-sm font-black text-gray-900 dark:text-slate-50">{receiptNo}</p>
              </div>
            </div>

            <dl className="mt-4 space-y-2.5 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-gray-500 dark:text-slate-400">Оршин суугч</dt>
                <dd className="text-right font-bold text-gray-900 dark:text-slate-100">{user?.name ?? "—"}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-gray-500 dark:text-slate-400">Тоот / имэйл</dt>
                <dd className="text-right font-semibold text-gray-800 dark:text-slate-200">
                  {user?.unitNumber ? `${user.unitNumber}-р тоот` : "—"}
                  <span className="mt-0.5 block text-xs font-normal text-gray-500">{user?.email ?? ""}</span>
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-gray-500 dark:text-slate-400">Төлбөрийн сар</dt>
                <dd className="font-bold text-gray-900 dark:text-slate-100">{payment.month}-р сар</dd>
              </div>
              {payment.description ? (
                <div className="flex justify-between gap-3">
                  <dt className="text-gray-500 dark:text-slate-400">Тайлбар</dt>
                  <dd className="max-w-[60%] text-right text-xs text-gray-700 dark:text-slate-300">{payment.description}</dd>
                </div>
              ) : null}
              <div className="flex justify-between gap-3 border-t border-gray-200 pt-3 dark:border-slate-700">
                <dt className="font-bold text-gray-800 dark:text-slate-200">Нийт дүн</dt>
                <dd className="text-lg font-black text-emerald-700 dark:text-emerald-400">{payment.amount.toLocaleString()}₮</dd>
              </div>
              <div className="flex justify-between gap-3 text-xs">
                <dt className="text-gray-500 dark:text-slate-400">Төлөгдсөн</dt>
                <dd className="font-semibold text-gray-800 dark:text-slate-200">{paidLabel}</dd>
              </div>
              <div className="flex justify-between gap-3 text-xs">
                <dt className="text-gray-500 dark:text-slate-400">Бүртгэл үүссэн</dt>
                <dd className="text-gray-700 dark:text-slate-300">{fmtDate(payment.createdAt)}</dd>
              </div>
            </dl>

            <p className="mt-5 text-center text-[10px] leading-relaxed text-gray-400 dark:text-slate-500">
              Энэхүү баримтыг банк / аж ахуйн нэгжид хүссэн үедээ үзүүлж болно. Хэвлэх товчийг ашиглана уу.
            </p>
          </div>
        </div>

        <div className="no-print flex gap-2 border-t border-gray-100 p-4 dark:border-slate-800">
          <button
            type="button"
            onClick={() => {
              window.print();
            }}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-sm font-black text-white transition hover:bg-emerald-500"
          >
            <Printer size={17} />
            Хэвлэх / PDF
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-gray-200 px-5 py-3 text-sm font-bold text-gray-600 transition hover:bg-gray-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            Хаах
          </button>
        </div>
      </div>
    </div>
  );
}

function RequestsPreview({
  requests,
  loading,
  fmtDate,
}: {
  requests: Request[];
  loading: boolean;
  fmtDate: (date?: string | null) => string;
}) {
  return (
    <Card className="overflow-hidden">
      <CardHeader
        title="Миний засварын хүсэлтүүд"
        action={
          <Link href="/resident/requests" className="text-xs font-bold text-emerald-600 hover:text-emerald-500">
            Бүгдийг харах
          </Link>
        }
      />
      <div className="divide-y divide-gray-50 dark:divide-slate-800">
        {loading ? (
          [1, 2, 3].map((item) => (
            <div key={item} className="px-5 py-3">
              <div className="h-4 animate-pulse rounded bg-gray-100 dark:bg-slate-700" />
            </div>
          ))
        ) : requests.length === 0 ? (
          <EmptyState text="Хүсэлт байхгүй байна" />
        ) : (
          requests.slice(0, 3).map((request) => (
            <div key={request.id} className="px-5 py-3 text-sm">
              <div className="grid grid-cols-[1fr_auto] gap-3">
                <div className="min-w-0">
                  <p className="truncate font-semibold text-gray-700 dark:text-slate-200">{request.title}</p>
                  <p className="mt-0.5 text-xs text-gray-400 dark:text-slate-500">{fmtDate(request.createdAt)}</p>
                </div>
                <span className={`self-start rounded-md border px-2 py-1 text-[11px] font-bold ${reqStatus[request.status].cls}`}>
                  {reqStatus[request.status].label}
                </span>
              </div>
              <RequestLogisticsStrip status={request.status} />
            </div>
          ))
        )}
      </div>
    </Card>
  );
}

function PollCard({
  poll,
  loading,
  selectedOption,
  votedOption,
  onSelect,
  onVote,
  fmtDate,
}: {
  poll?: Poll;
  loading: boolean;
  selectedOption?: string;
  votedOption?: string;
  onSelect: (pollId: string, optionId: string) => void;
  onVote: (pollId: string) => void;
  fmtDate: (date?: string | null) => string;
}) {
  const totalVotes = poll?.options.reduce((sum, option) => sum + option.votes, 0) ?? 0;
  const showResults = Boolean(votedOption);

  return (
    <Card className="p-5">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-black text-gray-800 dark:text-slate-100">Идэвхтэй санал асуулга</h2>
          {poll?.expiresAt ? <p className="mt-1 text-xs text-gray-400 dark:text-slate-500">Хугацаа: {fmtDate(poll.expiresAt)} хүртэл</p> : null}
        </div>
        <Link href="/resident/polls" className="text-xs font-bold text-emerald-600 hover:text-emerald-500">
          Бүгдийг харах
        </Link>
      </div>

      {loading ? (
        <div className="space-y-3">
          <div className="h-4 animate-pulse rounded bg-gray-100 dark:bg-slate-700" />
          <div className="h-16 animate-pulse rounded bg-gray-100 dark:bg-slate-700" />
        </div>
      ) : !poll ? (
        <EmptyState text="Санал асуулга байхгүй байна" />
      ) : (
        <div className="space-y-3">
          <p className="text-sm font-semibold leading-5 text-gray-800 dark:text-slate-100">{poll.question}</p>
          {showResults ? (
            <div className="space-y-3">
              {poll.options.map((option, index) => {
                const percent = totalVotes > 0 ? Math.round((option.votes / totalVotes) * 100) : 0;
                return (
                  <div key={option.id}>
                    <div className="mb-1 flex items-center justify-between gap-3 text-xs">
                      <span className="font-semibold text-gray-600 dark:text-slate-300">{option.text}</span>
                      <span className="text-gray-400 dark:text-slate-500">{percent}%</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                      <div
                        className={`h-full rounded-full ${index % 2 === 0 ? "bg-emerald-500" : "bg-amber-400"}`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
              <p className="text-xs font-bold text-emerald-600">Санал өгсөн</p>
            </div>
          ) : (
            <div className="space-y-2">
              {poll.options.map((option) => (
                <label key={option.id} className="flex cursor-pointer items-center gap-2 text-sm font-medium text-gray-600 dark:text-slate-300">
                  <input
                    type="radio"
                    name={`poll-${poll.id}`}
                    checked={selectedOption === option.id}
                    onChange={() => onSelect(poll.id, option.id)}
                    className="h-4 w-4 accent-emerald-600"
                  />
                  <span>{option.text}</span>
                </label>
              ))}
              <button
                onClick={() => onVote(poll.id)}
                disabled={!selectedOption}
                className="mt-2 rounded-md bg-emerald-600 px-4 py-2.5 text-xs font-black text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-45"
              >
                Санал өгөх
              </button>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}

function AnnouncementsList({
  announcements,
  loading,
  fmtDate,
  compact = false,
  onOpenImage,
}: {
  announcements: Announcement[];
  loading: boolean;
  fmtDate: (date?: string | null) => string;
  compact?: boolean;
  onOpenImage?: (image: { src: string; title: string }) => void;
}) {
  return (
    <Card className="overflow-hidden">
      <CardHeader
        title="Сүүлийн зарлал"
        action={
          compact ? (
            <Link href="/resident/news" className="text-xs font-bold text-emerald-600 hover:text-emerald-500">
              Бүгдийг харах
            </Link>
          ) : null
        }
      />
      <div className={compact ? "divide-y divide-gray-50 dark:divide-slate-800" : "grid gap-4 px-5 pb-5 sm:grid-cols-2"}>
        {loading ? (
          [1, 2, 3].map((item) => (
            <div key={item} className={compact ? "px-5 py-4" : "overflow-hidden rounded-xl border border-gray-100 bg-white dark:border-slate-700 dark:bg-slate-900"}>
              <div className={compact ? "h-4 animate-pulse rounded bg-gray-100 dark:bg-slate-700" : "h-44 animate-pulse bg-gray-100 dark:bg-slate-700"} />
              {!compact ? <div className="space-y-2 p-4"><div className="h-4 animate-pulse rounded bg-gray-100 dark:bg-slate-700" /><div className="h-3 w-2/3 animate-pulse rounded bg-gray-100 dark:bg-slate-700" /></div> : null}
            </div>
          ))
        ) : announcements.length === 0 ? (
          <EmptyState text="Зарлал байхгүй байна" />
        ) : (
          announcements.slice(0, compact ? 4 : announcements.length).map((announcement) => {
            const tone = announcementTone[announcement.type] ?? announcementTone.INFO;
            const Icon = tone.Icon;
            if (!compact) {
              return (
                <article key={announcement.id} className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-[0_12px_30px_rgba(15,23,42,0.04)] transition hover:-translate-y-0.5 hover:shadow-[0_18px_40px_rgba(15,23,42,0.08)] dark:border-slate-700 dark:bg-slate-900">
                  {announcement.imageUrl ? (
                    <button
                      type="button"
                      onClick={() => onOpenImage?.({ src: announcement.imageUrl!, title: announcement.title })}
                      className="block w-full cursor-zoom-in overflow-hidden text-left focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <img src={announcement.imageUrl} alt="" className="h-48 w-full object-cover transition duration-300 hover:scale-[1.02]" />
                    </button>
                  ) : (
                    <div className={`flex h-36 w-full items-center justify-center ${tone.bg}`}>
                      <Icon size={34} className={tone.text} />
                    </div>
                  )}
                  <div className="p-4">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold ${tone.bg} ${tone.text}`}>
                        <Icon size={13} />
                        Зарлал
                      </span>
                      <span className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-gray-400 dark:text-slate-500">
                        <CalendarDays size={13} />
                        {fmtDate(announcement.createdAt)}
                      </span>
                    </div>
                    <h3 className="line-clamp-2 text-base font-black leading-6 text-gray-900 dark:text-slate-50">{announcement.title}</h3>
                    <p className="mt-2 line-clamp-3 text-sm leading-6 text-gray-500 dark:text-slate-400">{announcement.content}</p>
                  </div>
                </article>
              );
            }

            return (
              <div key={announcement.id} className="flex items-start gap-3 px-5 py-3.5">
                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${tone.bg} ${tone.text}`}>
                  <Icon size={16} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-gray-800 dark:text-slate-100">{announcement.title}</p>
                  {announcement.imageUrl ? (
                    <button
                      type="button"
                      onClick={() => onOpenImage?.({ src: announcement.imageUrl!, title: announcement.title })}
                      className="mt-2 block cursor-zoom-in overflow-hidden rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <img src={announcement.imageUrl} alt="" className="h-20 w-28 object-cover transition duration-300 hover:scale-105" />
                    </button>
                  ) : null}
                  {!compact ? <p className="mt-1 line-clamp-2 text-xs leading-5 text-gray-500 dark:text-slate-400">{announcement.content}</p> : null}
                </div>
                <p className="shrink-0 text-xs text-gray-400 dark:text-slate-500">{fmtDate(announcement.createdAt)}</p>
              </div>
            );
          })
        )}
      </div>
    </Card>
  );
}

function ImagePreviewModal({
  image,
  onClose,
}: {
  image: { src: string; title: string };
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="relative w-full max-w-5xl" onClick={(event) => event.stopPropagation()}>
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 z-10 grid h-10 w-10 place-items-center rounded-full bg-black/55 text-white shadow-lg transition hover:bg-black/75"
          aria-label="Хаах"
        >
          <X size={20} />
        </button>
        <div className="overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-slate-900">
          <img src={image.src} alt="" className="max-h-[78vh] w-full object-contain bg-black" />
          <div className="border-t border-slate-100 px-4 py-3 dark:border-slate-800">
            <p className="truncate text-sm font-black text-slate-900 dark:text-slate-50">{image.title}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function PaymentsView({
  payments,
  latestPayment,
  loading,
  fmtDate,
  payingId,
  payMessage,
  onPay,
  onDeletePayment,
  deletingPaymentId,
  onShowReceipt,
}: {
  payments: Payment[];
  latestPayment?: Payment;
  loading: boolean;
  fmtDate: (date?: string | null) => string;
  payingId: string | null;
  payMessage: string;
  onPay: (paymentId: string) => void;
  onDeletePayment: (paymentId: string) => void;
  deletingPaymentId: string | null;
  onShowReceipt: (payment: Payment) => void;
}) {
  const canPay = (p: Payment) => p.status === "PENDING" || p.status === "OVERDUE";

  return (
    <div className="space-y-5">
      {payMessage ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200">
          {payMessage}
        </p>
      ) : null}

      <Card className="p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-medium text-gray-400 dark:text-slate-500">
              {latestPayment ? `${latestPayment.month}-р сарын төлбөр` : "Сүүлийн төлбөр"}
            </p>
            <p className="mt-2 text-3xl font-black text-gray-900 dark:text-slate-50">
              {latestPayment ? `${latestPayment.amount.toLocaleString()}₮` : "—"}
            </p>
            {latestPayment ? (
              <p className={`mt-1 text-sm font-bold ${payStatus[latestPayment.status].text}`}>{payStatus[latestPayment.status].label}</p>
            ) : null}
            {latestPayment && canPay(latestPayment) ? (
              <button
                type="button"
                onClick={() => onPay(latestPayment.id)}
                disabled={payingId === latestPayment.id}
                className="mt-4 inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-black text-white shadow-sm transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {payingId === latestPayment.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
                Төлбөр төлөх
              </button>
            ) : null}
            {latestPayment?.status === "PAID" ? (
              <button
                type="button"
                onClick={() => onShowReceipt(latestPayment)}
                className="mt-3 inline-flex items-center gap-2 text-sm font-bold text-emerald-700 underline-offset-2 hover:underline dark:text-emerald-400"
              >
                <Printer size={15} />
                Баримт харах
              </button>
            ) : null}
          </div>
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-500">
            <Wallet size={23} />
          </div>
        </div>
      </Card>

      <Card className="overflow-hidden">
        <CardHeader title="Төлбөрийн жагсаалт" />
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-xs text-gray-400 dark:bg-slate-800/80 dark:text-slate-500">
              <tr>
                <th className="px-5 py-3 font-bold">Сар</th>
                <th className="px-5 py-3 font-bold">Дүн</th>
                <th className="px-5 py-3 font-bold">Төлөв</th>
                <th className="px-5 py-3 font-bold">Огноо</th>
                <th className="px-5 py-3 font-bold">Баримт</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-slate-800">
              {loading ? (
                [1, 2, 3].map((item) => (
                  <tr key={item}>
                    <td colSpan={5} className="px-5 py-4">
                      <div className="h-4 animate-pulse rounded bg-gray-100 dark:bg-slate-700" />
                    </td>
                  </tr>
                ))
              ) : payments.length === 0 ? (
                <tr>
                  <td colSpan={5}>
                    <EmptyState text="Төлбөр байхгүй байна" />
                  </td>
                </tr>
              ) : (
                payments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/80/70">
                    <td className="px-5 py-3.5 font-semibold text-gray-700 dark:text-slate-200">{payment.month}-р сар</td>
                    <td className="px-5 py-3.5 font-black text-gray-900 dark:text-slate-50">{payment.amount.toLocaleString()}₮</td>
                    <td className="px-5 py-3.5">
                      <span className={`rounded-md border px-2.5 py-1 text-xs font-bold ${payStatus[payment.status].cls}`}>
                        {payStatus[payment.status].label}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-gray-400 dark:text-slate-500">{fmtDate(payment.createdAt)}</td>
                    <td className="px-5 py-3.5">
                      {canPay(payment) ? (
                        <button
                          type="button"
                          onClick={() => onPay(payment.id)}
                          disabled={payingId === payment.id}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-black text-white transition hover:bg-emerald-500 disabled:opacity-50"
                        >
                          {payingId === payment.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                          Төлөх
                        </button>
                      ) : payment.status === "PAID" ? (
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                          <button
                            type="button"
                            onClick={() => onShowReceipt(payment)}
                            className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 hover:underline dark:text-emerald-400"
                          >
                            <Printer size={14} />
                            Баримт
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeletePayment(payment.id)}
                            disabled={deletingPaymentId === payment.id}
                            className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-bold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {deletingPaymentId === payment.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 size={14} />}
                            Устгах
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400 dark:text-slate-500">—</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function RequestsView({
  requests,
  loading,
  showReqForm,
  setShowReqForm,
  reqForm,
  setReqForm,
  submitRequest,
  submitting,
  inputClass,
  fmtDate,
}: {
  requests: Request[];
  loading: boolean;
  showReqForm: boolean;
  setShowReqForm: (show: boolean) => void;
  reqForm: { title: string; description: string; notes: string };
  setReqForm: (form: { title: string; description: string; notes: string }) => void;
  submitRequest: () => void;
  submitting: boolean;
  inputClass: string;
  fmtDate: (date?: string | null) => string;
}) {
  return (
    <div className="space-y-5">
      <Card className="p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-black text-gray-800 dark:text-slate-100">Засварын хүсэлт гаргах</h2>
            <p className="mt-1 text-xs text-gray-400 dark:text-slate-500">Шинэ асуудал, засвар үйлчилгээний хүсэлтээ бүртгэнэ.</p>
          </div>
          <button
            onClick={() => setShowReqForm(!showReqForm)}
            className="inline-flex items-center justify-center gap-2 rounded-md bg-emerald-600 px-4 py-2.5 text-xs font-black text-white transition hover:bg-emerald-500"
          >
            <Plus size={15} />
            Шинэ хүсэлт
          </button>
        </div>

        {showReqForm ? (
          <div className="mt-5 grid gap-3">
            <input
              value={reqForm.title}
              onChange={(event) => setReqForm({ ...reqForm, title: event.target.value })}
              placeholder="Гарчиг"
              className={inputClass}
            />
            <textarea
              value={reqForm.description}
              onChange={(event) => setReqForm({ ...reqForm, description: event.target.value })}
              placeholder="Дэлгэрэнгүй тайлбар"
              rows={3}
              className={`${inputClass} resize-none`}
            />
            <textarea
              value={reqForm.notes}
              onChange={(event) => setReqForm({ ...reqForm, notes: event.target.value })}
              placeholder="Нэмэлт мэдээлэл (шаардлагагүй)"
              rows={2}
              className={`${inputClass} resize-none`}
            />
            <div className="flex flex-wrap gap-3">
              <button
                onClick={submitRequest}
                disabled={submitting || !reqForm.title.trim() || !reqForm.description.trim()}
                className="rounded-md bg-emerald-600 px-5 py-2.5 text-xs font-black text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-45"
              >
                {submitting ? "Илгээж байна..." : "Илгээх"}
              </button>
              <button
                onClick={() => {
                  setShowReqForm(false);
                  setReqForm({ title: "", description: "", notes: "" });
                }}
                className="rounded-md border border-gray-200 px-5 py-2.5 text-xs font-bold text-gray-500 transition hover:bg-gray-50 dark:border-slate-600 dark:text-slate-400 dark:hover:bg-slate-800/80"
              >
                Цуцлах
              </button>
            </div>
          </div>
        ) : null}
      </Card>

      <Card className="overflow-hidden">
        <CardHeader title="Миний засварын хүсэлтүүд" />
        <div className="divide-y divide-gray-50 dark:divide-slate-800">
          {loading ? (
            [1, 2, 3].map((item) => (
              <div key={item} className="px-5 py-4">
                <div className="h-4 animate-pulse rounded bg-gray-100 dark:bg-slate-700" />
              </div>
            ))
          ) : requests.length === 0 ? (
            <EmptyState text="Хүсэлт байхгүй байна" />
          ) : (
            requests.map((request) => (
              <div key={request.id} className="px-5 py-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-gray-800 dark:text-slate-100">{request.title}</p>
                    <p className="mt-1 line-clamp-3 text-sm leading-5 text-gray-500 dark:text-slate-400">{request.description}</p>
                    <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-400 dark:text-slate-500">
                      <span className="inline-flex items-center gap-1">
                        <CalendarDays size={12} />
                        Илгээсэн: {fmtDate(request.createdAt)}
                      </span>
                      {request.updatedAt && request.updatedAt !== request.createdAt ? (
                        <span className="inline-flex items-center gap-1">Шинэчилсэн: {fmtDate(request.updatedAt)}</span>
                      ) : null}
                    </p>
                  </div>
                  <span className={`shrink-0 self-start rounded-md border px-2.5 py-1 text-xs font-bold ${reqStatus[request.status].cls}`}>
                    {reqStatus[request.status].label}
                  </span>
                </div>
                <RequestLogisticsStrip status={request.status} />
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}

function RequestModal({
  reqForm,
  setReqForm,
  submitRequest,
  submitting,
  onClose,
  inputClass,
}: {
  reqForm: { title: string; description: string; notes: string };
  setReqForm: (form: { title: string; description: string; notes: string }) => void;
  submitRequest: () => void;
  submitting: boolean;
  onClose: () => void;
  inputClass: string;
}) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/35 p-4 backdrop-blur-sm">
      <Card className="w-full max-w-lg p-5">
        <h2 className="text-base font-black text-gray-900 dark:text-slate-50">Засварын хүсэлт илгээх</h2>
        <div className="mt-4 grid gap-3">
          <input
            value={reqForm.title}
            onChange={(event) => setReqForm({ ...reqForm, title: event.target.value })}
            placeholder="Гарчиг"
            className={inputClass}
          />
          <textarea
            value={reqForm.description}
            onChange={(event) => setReqForm({ ...reqForm, description: event.target.value })}
            placeholder="Дэлгэрэнгүй тайлбар"
            rows={3}
            className={`${inputClass} resize-none`}
          />
          <textarea
            value={reqForm.notes}
            onChange={(event) => setReqForm({ ...reqForm, notes: event.target.value })}
            placeholder="Нэмэлт мэдээлэл (шаардлагагүй)"
            rows={2}
            className={`${inputClass} resize-none`}
          />
          <div className="flex flex-wrap gap-3">
            <button
              onClick={submitRequest}
              disabled={submitting || !reqForm.title.trim() || !reqForm.description.trim()}
              className="rounded-md bg-emerald-600 px-5 py-2.5 text-xs font-black text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-45"
            >
              {submitting ? "Илгээж байна..." : "Илгээх"}
            </button>
            <button onClick={onClose} className="rounded-md border border-gray-200 px-5 py-2.5 text-xs font-bold text-gray-500 transition hover:bg-gray-50 dark:border-slate-600 dark:text-slate-400 dark:hover:bg-slate-800/80">
              Цуцлах
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
}

function ProfileView({
  user,
  loading,
  fmtDate,
  payments,
  requests,
  onProfileUpdated,
}: {
  user: UserType | null;
  loading: boolean;
  fmtDate: (date?: string | null) => string;
  payments: Payment[];
  requests: Request[];
  onProfileUpdated: (user: UserType) => void;
}) {
  const latestPayment = payments[0];
  const [form, setForm] = useState({ name: "", phoneNumber: "", unitNumber: "", avatarUrl: "" });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    setForm({
      name: user?.name ?? "",
      phoneNumber: user?.phoneNumber ?? "",
      unitNumber: user?.unitNumber ?? "",
      avatarUrl: user?.avatarUrl ?? "",
    });
  }, [user]);

  const rows = [
    { label: "Нэр", value: user?.name ?? "—" },
    { label: "Имэйл", value: user?.email ?? "—" },
    { label: "Утас", value: user?.phoneNumber ?? "—" },
    { label: "Роль", value: "Оршин суугч" },
    { label: "Байрны дугаар", value: user?.unitNumber ?? "—" },
    { label: "Бүртгэлийн огноо", value: fmtDate(user?.createdAt) },
    { label: "Сүүлийн төлбөр", value: latestPayment ? `${latestPayment.month}-р сар · ${latestPayment.amount.toLocaleString()}₮` : "—" },
    { label: "Сүүлийн төлбөрийн төлөв", value: latestPayment ? payStatus[latestPayment.status].label : "—" },
  ];

  const handleAvatarChange = (file?: File) => {
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") setForm((current) => ({ ...current, avatarUrl: reader.result as string }));
    };
    reader.readAsDataURL(file);
  };

  const saveProfile = async () => {
    setSaving(true);
    setMessage("");
    try {
      const res = await fetch("/api/resident/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        setMessage("Мэдээлэл хадгалж чадсангүй.");
        return;
      }
      const updated = await res.json();
      onProfileUpdated(updated);
      setMessage("Мэдээлэл шинэчлэгдлээ.");
    } catch (error) {
      console.error(error);
      setMessage("Сервертэй холбогдож чадсангүй.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card className="overflow-hidden">
        <CardHeader title="Миний мэдээлэл" />
      {loading ? (
        <div className="space-y-3 p-5">
          {[1, 2, 3].map((item) => (
            <div key={item} className="h-4 animate-pulse rounded bg-gray-100 dark:bg-slate-700" />
          ))}
        </div>
      ) : (
        <div className="divide-y divide-gray-50 dark:divide-slate-800">
          {rows.map((row) => (
            <div key={row.label} className="flex items-center justify-between gap-4 px-5 py-4 text-sm">
              <span className="font-medium text-gray-400 dark:text-slate-500">{row.label}</span>
              <span className="text-right font-bold text-gray-800 dark:text-slate-100">{row.value}</span>
            </div>
          ))}
        </div>
      )}
      </Card>

      <Card className="overflow-hidden">
        <CardHeader title="Мэдээлэл засах" />
        {loading ? (
          <div className="space-y-3 p-5">
            {[1, 2, 3].map((item) => (
              <div key={item} className="h-4 animate-pulse rounded bg-gray-100 dark:bg-slate-700" />
            ))}
          </div>
        ) : (
          <div className="space-y-4 p-5">
            <div className="flex items-center gap-4">
              <div className="h-20 w-20 overflow-hidden rounded-2xl border border-gray-100 bg-emerald-50 dark:border-slate-700 dark:bg-slate-800">
                {form.avatarUrl ? (
                  <img src={form.avatarUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="grid h-full w-full place-items-center text-2xl font-black text-emerald-700">
                    {(form.name || user?.email || "U").slice(0, 1).toUpperCase()}
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <label className="inline-flex cursor-pointer items-center justify-center rounded-md bg-emerald-600 px-4 py-2.5 text-xs font-black text-white transition hover:bg-emerald-500">
                  Зураг солих
                  <input type="file" accept="image/*" onChange={(event) => handleAvatarChange(event.target.files?.[0])} className="hidden" />
                </label>
                {form.avatarUrl ? (
                  <button type="button" onClick={() => setForm((current) => ({ ...current, avatarUrl: "" }))} className="ml-2 rounded-md border border-gray-200 px-3 py-2 text-xs font-bold text-gray-500 transition hover:bg-gray-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">
                    Устгах
                  </button>
                ) : null}
              </div>
            </div>

            <div className="grid gap-3">
              <label className="grid gap-1.5 text-xs font-bold text-gray-500 dark:text-slate-400">
                Нэр
                <input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className="rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-800 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100" />
              </label>
              <label className="grid gap-1.5 text-xs font-bold text-gray-500 dark:text-slate-400">
                Утас
                <input value={form.phoneNumber} onChange={(event) => setForm({ ...form, phoneNumber: event.target.value })} className="rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-800 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100" />
              </label>
              <label className="grid gap-1.5 text-xs font-bold text-gray-500 dark:text-slate-400">
                Байрны дугаар
                <input value={form.unitNumber} onChange={(event) => setForm({ ...form, unitNumber: event.target.value })} className="rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-800 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100" />
              </label>
              <label className="grid gap-1.5 text-xs font-bold text-gray-400 dark:text-slate-500">
                Имэйл
                <input value={user?.email ?? ""} disabled className="rounded-lg border border-gray-100 bg-gray-50 px-4 py-2.5 text-sm font-semibold text-gray-400 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-500" />
              </label>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button onClick={saveProfile} disabled={saving} className="rounded-md bg-emerald-600 px-5 py-2.5 text-xs font-black text-white transition hover:bg-emerald-500 disabled:opacity-50">
                {saving ? "Хадгалж байна..." : "Хадгалах"}
              </button>
              {message ? <p className="text-xs font-bold text-emerald-600 dark:text-emerald-300">{message}</p> : null}
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

function DocsView() {
  return (
    <Card className="p-6">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
          <FileText size={20} />
        </div>
        <div>
          <h2 className="text-sm font-black text-gray-800 dark:text-slate-100">Баримт бичиг</h2>
          <p className="mt-2 text-sm leading-6 text-gray-500 dark:text-slate-400">Одоогоор нийтлэгдсэн баримт бичиг алга байна.</p>
        </div>
      </div>
    </Card>
  );
}

function ContactView() {
  const contacts = [
    { Icon: Phone, label: "Утас", value: "+976 95082227", href: "tel:+97695082227" },
    { Icon: Mail, label: "Имэйл", value: "info@smartresidence.mn", href: "mailto:info@smartresidence.mn" },
    { Icon: Building2, label: "Хаяг", value: "Өндөр хотхон, Улаанбаатар", href: "#" },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {contacts.map(({ Icon, label, value, href }) => (
        <a key={label} href={href} className="rounded-lg border border-gray-100 bg-white p-5 shadow-[0_12px_36px_rgba(15,23,42,0.04)] transition hover:border-emerald-100 hover:bg-emerald-50/30 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-emerald-800 dark:hover:bg-emerald-950/40">
          <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
            <Icon size={20} />
          </div>
          <p className="text-xs font-bold text-gray-400 dark:text-slate-500">{label}</p>
          <p className="mt-1 text-sm font-black text-gray-800 dark:text-slate-100">{value}</p>
        </a>
      ))}
    </div>
  );
}
