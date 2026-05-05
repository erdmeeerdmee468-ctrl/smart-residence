"use client";

import { SohGuard } from "@/components/auth-guard";
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
  MessageSquare,
  Plus,
  RefreshCw,
  Settings,
  Users,
  Users2,
  Wrench,
  Zap,
  type LucideIcon,
} from "lucide-react";

type Resident = { id: string; name: string | null; email: string; unitNumber: string | null };
type Payment = {
  id: string;
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
type Announcement = { id: string; title: string; content: string; type: string; createdAt: string };
type Poll = {
  id: string;
  question: string;
  options: { id: string; text: string; votes: number }[];
  expiresAt: string | null;
};

type Tab = "overview" | "requests" | "polls" | "payments" | "residents" | "announcements" | "building" | "reports" | "alerts" | "settings";

const statusMap: Record<string, { label: string; cls: string; action: string }> = {
  PENDING: { label: "Хүлээгдэж буй", cls: "bg-amber-100 text-amber-700 border-amber-200", action: "bg-amber-500 text-white border-amber-500 hover:bg-amber-600" },
  PAID: { label: "Төлөгдсөн", cls: "bg-emerald-100 text-emerald-700 border-emerald-200", action: "bg-emerald-500 text-white border-emerald-500 hover:bg-emerald-600" },
  OVERDUE: { label: "Хоцорсон", cls: "bg-red-100 text-red-700 border-red-200", action: "bg-red-500 text-white border-red-500 hover:bg-red-600" },
  OPEN: { label: "Шинэ", cls: "bg-red-100 text-red-700 border-red-200", action: "bg-amber-500 text-white border-amber-500 hover:bg-amber-600" },
  IN_PROGRESS: { label: "Хүлээгдэж буй", cls: "bg-amber-100 text-amber-700 border-amber-200", action: "bg-emerald-500 text-white border-emerald-500 hover:bg-emerald-600" },
  RESOLVED: { label: "Шийдэгдсэн", cls: "bg-emerald-100 text-emerald-700 border-emerald-200", action: "bg-emerald-50 text-emerald-700 border-emerald-200" },
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
  { key: "building", label: "Барилга, байгууламж", Icon: Building2 },
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
  return <section className={`rounded-lg border border-slate-200/70 bg-white shadow-[0_16px_40px_rgba(15,23,42,0.07)] dark:border-slate-600 dark:bg-slate-900 dark:shadow-[0_16px_40px_rgba(0,0,0,0.35)] ${className}`}>{children}</section>;
}

function CardHeader({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-gray-50 px-5 py-4 dark:border-slate-800">
      <h2 className="text-sm font-black text-gray-800 dark:text-slate-100">{title}</h2>
      {action}
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return <div className="px-5 py-10 text-center text-sm text-gray-400 dark:text-slate-500">{text}</div>;
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
  return (
    <Card className={`group relative overflow-hidden p-5 ${accent}`}>
      <div className="absolute right-0 top-0 h-16 w-16 rounded-bl-[48px] bg-current opacity-[0.06]" />
      <div className="flex items-start gap-4">
        <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-lg ${iconBg} ${iconText} ring-1 ring-current/15 transition group-hover:scale-105`}>
          <Icon size={24} strokeWidth={1.9} />
        </div>
        <div className="min-w-0">
          <p className="mb-1 text-[12px] font-semibold text-gray-500 dark:text-slate-400">{label}</p>
          <p className="min-h-8 text-2xl font-black leading-tight text-gray-900 dark:text-slate-50">
            {loading ? <span className="inline-block h-7 w-16 animate-pulse rounded bg-gray-100 dark:bg-slate-700" /> : value}
          </p>
          <p className="mt-1 text-[12px] text-gray-400 dark:text-slate-500">{sub}</p>
        </div>
      </div>
    </Card>
  );
}

// SOH page wrapper with auth guard
export default function SohPage() {
  return (
    <SohGuard>
      <SOHDashboard />
    </SohGuard>
  );
}

function SOHDashboard() {
  const [tab, setTab] = useState<Tab>("overview");
  const [residents, setResidents] = useState<Resident[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [requests, setRequests] = useState<Request[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [polls, setPolls] = useState<Poll[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const [showPayForm, setShowPayForm] = useState(false);
  const [payForm, setPayForm] = useState({ residentId: "", amount: "", month: new Date().toISOString().slice(0, 7), description: "" });
  const [payLoading, setPayLoading] = useState(false);
  const [paySuccess, setPaySuccess] = useState("");
  const [showAnnForm, setShowAnnForm] = useState(false);
  const [annForm, setAnnForm] = useState({ title: "", content: "", type: "INFO" });
  const [annLoading, setAnnLoading] = useState(false);
  const [showPollForm, setShowPollForm] = useState(false);
  const [pollForm, setPollForm] = useState({ question: "", options: ["", ""], expiresAt: "" });
  const [pollLoading, setPollLoading] = useState(false);
  const [aiQuestion, setAiQuestion] = useState("");
  const [aiAnswer, setAiAnswer] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  const fetchAll = useCallback(async () => {
    try {
      const [resRes, payRes, reqRes, annRes, pollRes] = await Promise.all([
        fetch("/api/soh/residents"),
        fetch("/api/soh/payments"),
        fetch("/api/soh/requests"),
        fetch("/api/admin/announcements"),
        fetch("/api/soh/polls"),
      ]);
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

  const sendPayment = async () => {
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
    setAnnForm({ title: "", content: "", type: "INFO" });
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

  const askPaymentAI = async () => {
    if (!aiQuestion.trim()) return;
    setAiLoading(true);
    setAiAnswer("");

    try {
      const res = await fetch("/api/soh/payments/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: aiQuestion }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAiAnswer(data?.message ?? "AI-с хариу авч чадсангүй.");
      } else {
        setAiAnswer(data?.answer ?? "AI хариу хоосон байна.");
      }
    } catch (error) {
      console.error(error);
      setAiAnswer("AI үйлчилгээтэй холбогдож чадсангүй.");
    } finally {
      setAiLoading(false);
    }
  };

  const fmtDate = (date?: string | null) => (mounted && date ? new Date(date).toLocaleDateString("mn-MN") : "—");
  const fmtTime = (date?: string | null) => (mounted && date ? new Date(date).toLocaleString("mn-MN", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }) : "—");
  const openReqs = requests.filter((request) => request.status === "OPEN").length;
  const monthIncome = payments.filter((payment) => payment.status === "PAID").reduce((sum, payment) => sum + payment.amount, 0);
  const activePoll = polls[0];
  const alertsCount = announcements.length;
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
    <div className="min-h-screen bg-[#eaf0f8] p-2 text-gray-900 dark:bg-slate-950 dark:text-slate-100 sm:p-3">
      <div className="mx-auto flex min-h-[calc(100vh-16px)] max-w-[1540px] overflow-hidden rounded-lg border border-slate-200 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.12)] dark:border-slate-700 dark:bg-slate-900 dark:shadow-[0_24px_80px_rgba(0,0,0,0.35)]">
        <aside
          className="hidden w-[215px] shrink-0 flex-col md:flex"
          style={{ background: "linear-gradient(180deg, #0f1e38 0%, #14294c 52%, #0d1830 100%)" }}
        >
          <div className="px-4 py-6">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-white/15 bg-white/10 shadow-inner shadow-white/10">
                <Building2 size={24} className="text-white" strokeWidth={1.9} />
              </div>
              <div className="min-w-0">
                <p className="truncate text-[12px] font-black uppercase text-white">Өндөр хотхон</p>
                <p className="truncate text-[10px] font-medium text-blue-100/75">СӨХ удирдлагын систем</p>
              </div>
            </div>
          </div>

          <nav className="flex-1 space-y-1 px-3">
            {navItems.map(({ key, label, Icon, badge }) => {
              const active = tab === key;
              const count = badge?.({ requests: openReqs, alerts: alertsCount }) ?? 0;
              return (
                <button
                  key={key}
                  onClick={() => setTab(key)}
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

          <div className="border-t border-white/10 p-3">
            <button className="flex w-full items-center gap-2.5 rounded-md px-2 py-2 text-left transition hover:bg-white/10">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-400 to-cyan-300 text-xs font-black text-white">СӨ</div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-bold text-white">СӨХ менежер</p>
                <p className="truncate text-[10px] text-blue-100/70">Менежер</p>
              </div>
              <ChevronDown size={14} className="text-blue-100/70" />
            </button>
          </div>
        </aside>

        <main className="min-w-0 flex-1 overflow-y-auto bg-[#f7f9fd] dark:bg-slate-950">
          <nav
            className="flex gap-2 overflow-x-auto overscroll-x-contain border-b border-slate-200 bg-white px-3 py-2.5 dark:border-slate-800 dark:bg-slate-950 md:hidden [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            aria-label="СӨХ цэс"
          >
            {navItems.map(({ key, label, Icon, badge }) => {
              const active = tab === key;
              const count = badge?.({ requests: openReqs, alerts: alertsCount }) ?? 0;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setTab(key)}
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
          <div className="relative px-4 pb-24 pt-4 sm:px-6 md:pb-6 lg:px-7">
            <div className="relative">
              <div className="rounded-lg border border-slate-200 bg-white shadow-[0_18px_64px_rgba(15,23,42,0.08)] dark:border-slate-700 dark:bg-slate-900 dark:shadow-[0_18px_64px_rgba(0,0,0,0.35)]">
                <header className="flex flex-col gap-3 border-b border-gray-100 px-4 py-4 dark:border-slate-800 sm:px-5 sm:py-5 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <h1 className="text-lg font-black text-gray-900 dark:text-slate-50 sm:text-xl">{titleByTab[tab]}</h1>
                    <p className="mt-1 text-xs font-medium text-gray-400 dark:text-slate-500">
                      Сайн байна уу, СӨХ менежер
                      {mounted && lastUpdated ? (
                        <span className="ml-2 inline-flex items-center gap-1 text-gray-300 dark:text-slate-600">
                          <RefreshCw size={10} /> {lastUpdated.toLocaleTimeString("mn-MN")}
                        </span>
                      ) : null}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3 sm:justify-end">
                    <button
                      onClick={() => setTab("alerts")}
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
                      className="inline-flex min-w-0 flex-1 items-center justify-center gap-2 rounded-md bg-[#3657d7] px-3 py-2.5 text-xs font-black text-white shadow-[0_10px_20px_rgba(54,87,215,0.22)] transition hover:bg-[#293fa4] sm:flex-initial sm:px-4"
                    >
                      <Plus size={15} className="shrink-0" />
                      <span className="truncate">Санал асуулга үүсгэх</span>
                    </button>
                  </div>
                </header>

                <div className="space-y-5 p-4 sm:p-5">
                  {paySuccess ? (
                    <div className="flex items-center gap-2 rounded-lg border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
                      <CheckCircle2 size={16} />
                      {paySuccess}
                    </div>
                  ) : null}

                  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <StatCard Icon={ClipboardCheck} iconBg="bg-blue-100" iconText="text-blue-600" accent="text-blue-500 border-t-4 border-t-blue-500" label="Шинэ засварын хүсэлт" value={openReqs} sub="Шинээр ирсэн" loading={loading} />
                    <StatCard Icon={Users} iconBg="bg-emerald-100" iconText="text-emerald-600" accent="text-emerald-500 border-t-4 border-t-emerald-500" label="Нийт оршин суугч" value={residents.length} sub="Идэвхтэй" loading={loading} />
                    <StatCard Icon={CreditCard} iconBg="bg-purple-100" iconText="text-purple-600" accent="text-purple-500 border-t-4 border-t-purple-500" label="Төлөгдсөн төлбөр (энэ сар)" value={`${monthIncome.toLocaleString()}₮`} sub="Сараар" loading={loading} />
                    <StatCard Icon={ClipboardCheck} iconBg="bg-orange-100" iconText="text-orange-600" accent="text-orange-500 border-t-4 border-t-orange-500" label="Идэвхтэй санал асуулга" value={polls.length} sub="Идэвхтэй" loading={loading} />
                  </div>

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
                    />
                  ) : null}

                  {tab === "requests" ? <RequestsTab loading={loading} requests={requests} updateRequest={updateRequest} fmtDate={fmtDate} fmtTime={fmtTime} /> : null}

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
                      payLoading={payLoading}
                      sendPayment={sendPayment}
                      inputClass={inputClass}
                      fmtDate={fmtDate}
                      aiQuestion={aiQuestion}
                      setAiQuestion={setAiQuestion}
                      aiAnswer={aiAnswer}
                      aiLoading={aiLoading}
                      askPaymentAI={askPaymentAI}
                    />
                  ) : null}

                  {tab === "residents" ? <ResidentsTab residents={residents} loading={loading} /> : null}

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
    </div>
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
}: {
  loading: boolean;
  requests: Request[];
  announcements: Announcement[];
  activePoll?: Poll;
  setTab: (tab: Tab) => void;
  updateRequest: (id: string, status: string) => void;
  fmtDate: (date?: string | null) => string;
  fmtTime: (date?: string | null) => string;
}) {
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
}: {
  loading: boolean;
  requests: Request[];
  updateRequest: (id: string, status: string) => void;
  fmtDate: (date?: string | null) => string;
  fmtTime: (date?: string | null) => string;
}) {
  return (
    <Card className="overflow-hidden">
      <CardHeader title="Засварын хүсэлтүүд" />
      <div className="divide-y divide-gray-50 dark:divide-slate-800">
        {loading ? (
          [1, 2, 3, 4].map((item) => <div key={item} className="px-5 py-4"><div className="h-4 animate-pulse rounded bg-gray-100 dark:bg-slate-700" /></div>)
        ) : requests.length === 0 ? (
          <EmptyState text="Хүсэлт байхгүй байна" />
        ) : (
          requests.map((request, index) => {
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
  payLoading,
  sendPayment,
  inputClass,
  fmtDate,
  aiQuestion,
  setAiQuestion,
  aiAnswer,
  aiLoading,
  askPaymentAI,
}: {
  residents: Resident[];
  payments: Payment[];
  loading: boolean;
  showPayForm: boolean;
  setShowPayForm: (show: boolean) => void;
  payForm: { residentId: string; amount: string; month: string; description: string };
  setPayForm: (form: { residentId: string; amount: string; month: string; description: string }) => void;
  payLoading: boolean;
  sendPayment: () => void;
  inputClass: string;
  fmtDate: (date?: string | null) => string;
  aiQuestion: string;
  setAiQuestion: (value: string) => void;
  aiAnswer: string;
  aiLoading: boolean;
  askPaymentAI: () => void;
}) {
  return (
    <div className="space-y-4">
      {showPayForm ? (
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

      <Card className="p-5">
        <h2 className="mb-3 flex items-center gap-2 text-sm font-black text-gray-800 dark:text-slate-100"><MessageSquare size={16} className="text-[#3450c7]" /> AI туслах (Төлбөр)</h2>
        <div className="grid gap-3">
          <input
            value={aiQuestion}
            onChange={(event) => setAiQuestion(event.target.value)}
            placeholder="Ж: Манай 2-р байрны оршин суугчийн төлбөр хэд гарсан бэ?"
            className={inputClass}
          />
          <div className="flex flex-wrap gap-3">
            <button
              onClick={askPaymentAI}
              disabled={aiLoading || !aiQuestion.trim()}
              className="rounded-md bg-[#3657d7] px-5 py-2.5 text-xs font-black text-white shadow-[0_10px_20px_rgba(54,87,215,0.2)] transition hover:bg-[#293fa4] disabled:opacity-45"
            >
              {aiLoading ? "AI бодож байна..." : "AI-с асуух"}
            </button>
          </div>
          {aiAnswer ? <div className="rounded-lg border border-blue-100 bg-blue-50 p-3 text-sm text-gray-700 dark:border-blue-900/50 dark:bg-blue-950/50 dark:text-slate-200">{aiAnswer}</div> : null}
        </div>
      </Card>

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

function ResidentsTab({ residents, loading }: { residents: Resident[]; loading: boolean }) {
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
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 dark:divide-slate-800">
            {loading ? (
              [1, 2, 3].map((item) => <tr key={item}><td colSpan={3} className="px-5 py-4"><div className="h-4 animate-pulse rounded bg-gray-100 dark:bg-slate-700" /></td></tr>)
            ) : residents.length === 0 ? (
              <tr><td colSpan={3}><EmptyState text="Оршин суугч бүртгэгдээгүй байна" /></td></tr>
            ) : (
              residents.map((resident) => (
                <tr key={resident.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/80">
                  <td className="px-5 py-3.5 font-bold text-gray-800 dark:text-slate-100">{resident.name ?? "Нэргүй"}</td>
                  <td className="px-5 py-3.5 text-gray-500 dark:text-slate-400">{resident.email}</td>
                  <td className="px-5 py-3.5 text-gray-500 dark:text-slate-400">{resident.unitNumber ?? "—"}</td>
                </tr>
              ))
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
  annForm: { title: string; content: string; type: string };
  setAnnForm: (form: { title: string; content: string; type: string }) => void;
  annLoading: boolean;
  createAnn: () => void;
  inputClass: string;
  fmtDate: (date?: string | null) => string;
  hideFormButton?: boolean;
}) {
  return (
    <div className="space-y-4">
      {!hideFormButton ? (
        showAnnForm ? (
          <Card className="p-5">
            <h2 className="mb-4 flex items-center gap-2 text-sm font-black text-gray-800 dark:text-slate-100"><Bell size={16} className="text-[#3450c7]" /> Шинэ зарлал нэмэх</h2>
            <div className="grid gap-3">
              <input value={annForm.title} onChange={(event) => setAnnForm({ ...annForm, title: event.target.value })} placeholder="Гарчиг" className={inputClass} />
              <textarea value={annForm.content} onChange={(event) => setAnnForm({ ...annForm, content: event.target.value })} placeholder="Агуулга" rows={3} className={`${inputClass} resize-none`} />
              <select value={annForm.type} onChange={(event) => setAnnForm({ ...annForm, type: event.target.value })} className={inputClass}>
                <option value="INFO">Мэдээлэл</option>
                <option value="WARNING">Анхааруулга</option>
                <option value="URGENT">Яаралтай</option>
              </select>
              <div className="flex flex-wrap gap-3">
                <button onClick={createAnn} disabled={annLoading || !annForm.title || !annForm.content} className="rounded-md bg-[#3657d7] px-5 py-2.5 text-xs font-black text-white shadow-[0_10px_20px_rgba(54,87,215,0.2)] transition hover:bg-[#293fa4] disabled:opacity-45">
                  {annLoading ? "Нэмж байна..." : "Нийтлэх"}
                </button>
                <button onClick={() => setShowAnnForm(false)} className="rounded-md border border-gray-200 px-5 py-2.5 text-xs font-bold text-gray-500 dark:text-slate-400">Цуцлах</button>
              </div>
            </div>
          </Card>
        ) : (
          <button onClick={() => setShowAnnForm(true)} className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-gray-300 bg-white py-3 text-sm font-bold text-gray-400 transition hover:bg-gray-50 hover:text-gray-600 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800">
            <Plus size={15} /> Шинэ зарлал нэмэх
          </button>
        )
      ) : null}

      <Card className="overflow-hidden">
        <CardHeader title={hideFormButton ? "Мэдэгдлүүд" : "Зарлалын жагсаалт"} />
        <div className="divide-y divide-gray-50 dark:divide-slate-800">
          {announcements.length === 0 ? <EmptyState text="Зарлал байхгүй байна" /> : announcements.map((announcement) => <AnnouncementRow key={announcement.id} announcement={announcement} fmtDate={fmtDate} />)}
        </div>
      </Card>
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
