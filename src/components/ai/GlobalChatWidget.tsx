"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { MessageCircle, Send, X } from "lucide-react";

type PanelTab = "group" | "ai";

type GroupMessage = {
  id: string;
  userId: string | null;
  userName: string;
  userRole: string;
  content: string;
  createdAt: string;
};

type AiBubble = {
  role: "user" | "assistant";
  text: string;
};

export function GlobalChatWidget() {
  const pathname = usePathname();
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<PanelTab>("group");
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<GroupMessage[]>([]);
  const [aiMessages, setAiMessages] = useState<AiBubble[]>([
    { role: "assistant", text: "Сайн байна уу? Төлбөр, хүсэлт, статистикийн талаар асуултаа бичнэ үү." },
  ]);
  const [meId, setMeId] = useState<string | null>(null);

  const roleTone = useMemo(
    () => ({
      ADMIN: "bg-blue-100 text-blue-700",
      SOH: "bg-violet-100 text-violet-700",
      RESIDENT: "bg-emerald-100 text-emerald-700",
    }),
    [],
  );

  // ✅ fetchMessages нь hook биш тул useEffect-ийн дотор хөдөлнө
  const fetchMessages = async () => {
    try {
      const res = await fetch("/api/chat/group", { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      setMessages(Array.isArray(data) ? data : []);
    } catch {
      // ignore polling errors
    }
  };

  useEffect(() => {
    // ✅ Нуугдах үед init хийхгүй
    if (pathname?.startsWith("/login") || pathname?.startsWith("/api")) return;

    const init = async () => {
      try {
        const meRes = await fetch("/api/auth/me");
        if (meRes.ok) {
          const meData = await meRes.json();
          setMeId(meData?.user?.id ?? null);
        }
      } catch {
        setMeId(null);
      }
      fetchMessages();
    };

    init();
    const interval = setInterval(() => {
      if (tab === "group") fetchMessages();
    }, 3000);
    return () => clearInterval(interval);
  }, [tab, pathname]);

  useEffect(() => {
    if (!open) return;
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, aiMessages, open, tab]);

  // ✅ Бүх hook-уудын ДАРАА нөхцөлт return
  if (pathname?.startsWith("/login") || pathname?.startsWith("/api")) {
    return null;
  }

  const sendGroupMessage = async () => {
    const content = input.trim();
    if (!content || loading) return;

    setLoading(true);
    setInput("");

    try {
      const res = await fetch("/api/chat/group", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      if (res.ok) {
        await fetchMessages();
      } else {
        const data = await res.json().catch(() => ({}));
        setMessages((prev) => [
          ...prev,
          {
            id: `err-${Date.now()}`,
            userId: null,
            userName: "Систем",
            userRole: "ADMIN",
            content: data?.message ?? "Илгээхэд алдаа гарлаа.",
            createdAt: new Date().toISOString(),
          },
        ]);
      }
    } finally {
      setLoading(false);
    }
  };

  const sendAiQuestion = async () => {
    const question = input.trim();
    if (!question || loading) return;

    setAiMessages((prev) => [...prev, { role: "user", text: question }]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });
      const data = await res.json();

      if (!res.ok) {
        setAiMessages((prev) => [...prev, { role: "assistant", text: data?.message ?? "AI алдаа гарлаа." }]);
        return;
      }

      setAiMessages((prev) => [...prev, { role: "assistant", text: data?.answer ?? "Хариулт хоосон байна." }]);
    } catch {
      setAiMessages((prev) => [...prev, { role: "assistant", text: "Сервертэй холбогдож чадсангүй." }]);
    } finally {
      setLoading(false);
    }
  };

  const submit = () => {
    if (tab === "group") sendGroupMessage();
    else sendAiQuestion();
  };

  return (
    <div className="fixed z-[70] max-sm:left-3 max-sm:right-3 right-[max(1.25rem,env(safe-area-inset-right))] bottom-[max(1.25rem,env(safe-area-inset-bottom))] sm:right-5 sm:bottom-5">
      {open ? (
        <div className="mb-3 flex h-[min(440px,calc(100dvh-7.5rem))] w-full max-w-[350px] flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.2)] dark:border-slate-600 dark:bg-slate-900 dark:shadow-[0_20px_60px_rgba(0,0,0,0.45)] max-sm:max-w-none sm:ml-auto">
          <div className="flex items-center justify-between border-b border-slate-100 px-3 py-2 dark:border-slate-700">
            <div className="flex rounded-lg bg-slate-100 p-0.5 dark:bg-slate-800">
              <button
                type="button"
                onClick={() => {
                  setTab("group");
                  void fetchMessages();
                }}
                className={`rounded-md px-3 py-1.5 text-xs font-bold transition ${tab === "group" ? "bg-white text-slate-800 shadow-sm dark:bg-slate-700 dark:text-slate-100" : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"}`}
              >
                Групп
              </button>
              <button
                type="button"
                onClick={() => setTab("ai")}
                className={`rounded-md px-3 py-1.5 text-xs font-bold transition ${tab === "ai" ? "bg-white text-slate-800 shadow-sm dark:bg-slate-700 dark:text-slate-100" : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"}`}
              >
                AI туслах
              </button>
            </div>
            <button onClick={() => setOpen(false)} className="rounded p-1 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200">
              <X size={16} />
            </button>
          </div>

          <p className="border-b border-slate-50 px-4 py-2 text-[11px] text-slate-400 dark:border-slate-800 dark:text-slate-500">
            {tab === "group" ? "Admin · SOH · Resident — нэг чат" : "Groq AI — таны эрхийн өгөгдөлд тулгуурлана"}
          </p>

          <div ref={scrollRef} className="min-h-0 flex-1 space-y-2 overflow-y-auto bg-slate-50 p-3 dark:bg-slate-950">
            {tab === "group" ? (
              <>
                {messages.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-slate-300 bg-white px-3 py-2 text-sm text-slate-500 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-400">
                    Chat хоосон байна. Эхний мессежээ бичээрэй.
                  </div>
                ) : (
                  messages.map((message) => {
                    const isMine = meId && message.userId === meId;
                    return (
                      <div
                        key={message.id}
                        className={`max-w-[88%] rounded-lg border px-3 py-2 text-sm ${isMine ? "ml-auto border-blue-600 bg-blue-600 text-white" : "border-slate-200 bg-white text-slate-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"}`}
                      >
                        <div className="mb-1 flex items-center gap-2">
                          <span
                            className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${isMine ? "bg-white/20 text-white" : roleTone[message.userRole as keyof typeof roleTone] ?? "bg-slate-100 text-slate-600"}`}
                          >
                            {message.userRole}
                          </span>
                          <span className={`text-[11px] font-semibold ${isMine ? "text-blue-100" : "text-slate-500"}`}>{message.userName}</span>
                        </div>
                        <p className="whitespace-pre-wrap break-words">{message.content}</p>
                      </div>
                    );
                  })
                )}
              </>
            ) : (
              <>
                {aiMessages.map((message, index) => (
                  <div
                    key={index}
                    className={`max-w-[90%] rounded-lg px-3 py-2 text-sm ${message.role === "user" ? "ml-auto bg-blue-600 text-white" : "border border-slate-200 bg-white text-slate-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"}`}
                  >
                    {message.text}
                  </div>
                ))}
              </>
            )}
            {loading ? (
              <div className="inline-block rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-400">{tab === "group" ? "Илгээж байна..." : "AI бодож байна..."}</div>
            ) : null}
          </div>

          <div className="flex items-center gap-2 border-t border-slate-100 p-3 dark:border-slate-700">
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  submit();
                }
              }}
              placeholder={tab === "group" ? "Групп чат руу бичих..." : "AI-д асуух..."}
              className="h-10 flex-1 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-blue-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
            />
            <button
              onClick={submit}
              disabled={loading || !input.trim()}
              className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-blue-600 text-white transition hover:bg-blue-500 disabled:opacity-45"
            >
              <Send size={15} />
            </button>
          </div>
        </div>
      ) : null}

      <button
        onClick={() => setOpen((prev) => !prev)}
        className="ml-auto flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-white shadow-[0_14px_35px_rgba(37,99,235,0.4)] transition hover:scale-[1.02] hover:bg-blue-500 max-sm:h-12 max-sm:w-12"
        title="Чат ба AI туслах"
      >
        <MessageCircle size={24} strokeWidth={2} />
      </button>
    </div>
  );
}