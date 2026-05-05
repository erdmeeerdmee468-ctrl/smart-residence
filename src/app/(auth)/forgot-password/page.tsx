"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";

const logoUrl = "https://th.bing.com/th/id/OIP.DQ4OQ4rPfx39afbQ0JMypwHaHa?w=166&h=180&c=7&r=0&o=7&pid=1.7&rm=3";

type Step = "email" | "code" | "password";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const inputCls = "w-full bg-white/[0.04] border border-white/[0.08] text-white px-4 py-3.5 rounded-xl focus:ring-2 focus:ring-blue-500/40 outline-none transition-all placeholder:text-gray-600 text-sm";

  // Алхам 1: Имэйл илгээх
  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (res.ok) {
        setStep("code");
      } else {
        const data = await res.json();
        setError(data.message || "Алдаа гарлаа");
      }
    } catch {
      setError("Сервертэй холбогдоход алдаа гарлаа");
    } finally {
      setLoading(false);
    }
  };

  // Алхам 2: Код шалгах
  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });
      if (res.ok) {
        const data = await res.json();
        setToken(data.token);
        setStep("password");
      } else {
        const data = await res.json();
        setError(data.message || "Код буруу байна");
      }
    } catch {
      setError("Сервертэй холбогдоход алдаа гарлаа");
    } finally {
      setLoading(false);
    }
  };

  // Алхам 3: Нууц үг солих
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      setError("Нууц үг таарахгүй байна");
      return;
    }
    if (password.length < 6) {
      setError("Нууц үг хамгийн багадаа 6 тэмдэгт байх ёстой");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      if (res.ok) {
        router.push("/login");
      } else {
        const data = await res.json();
        setError(data.message || "Алдаа гарлаа");
      }
    } catch {
      setError("Сервертэй холбогдоход алдаа гарлаа");
    } finally {
      setLoading(false);
    }
  };

  const steps = ["Имэйл", "Код", "Нууц үг"];
  const stepIndex = step === "email" ? 0 : step === "code" ? 1 : 2;

  return (
    <>
      {/* Left branding */}
      <div className="hidden lg:flex flex-col flex-1 max-w-xl text-white">
        <div className="flex items-center gap-4 mb-10">
          <div className="relative w-14 h-14 rounded-2xl overflow-hidden border border-white/10">
            <Image src={logoUrl} alt="Logo" fill className="object-cover" sizes="56px" />
          </div>
          <span className="text-2xl font-bold tracking-tight">Smart Residence</span>
        </div>
        <h1 className="text-[3.5rem] font-black leading-[1.1] mb-6">
          <span className="text-white">Нууц үг</span><br />
          <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
            сэргээх
          </span>
        </h1>
        <p className="text-gray-400 text-lg leading-relaxed max-w-md mb-10">
          Бүртгэлтэй имэйл хаягаа оруулснаар 6 оронтой баталгаажуулах код илгээгдэнэ.
        </p>
        {/* Steps indicator */}
        <div className="flex flex-col gap-3">
          {steps.map((s, i) => (
            <div key={s} className={`flex items-center gap-3 ${i <= stepIndex ? "opacity-100" : "opacity-30"}`}>
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 ${
                i < stepIndex ? "bg-blue-500 border-blue-500 text-white" :
                i === stepIndex ? "border-blue-400 text-blue-400" :
                "border-gray-600 text-gray-600"
              }`}>
                {i < stepIndex ? "✓" : i + 1}
              </div>
              <span className={`text-sm font-medium ${i === stepIndex ? "text-white" : "text-gray-500"}`}>{s}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right card */}
      <div className="w-full max-w-[420px]">
        <div className="lg:hidden flex items-center gap-3 mb-8">
          <div className="relative w-10 h-10 rounded-xl overflow-hidden border border-white/10">
            <Image src={logoUrl} alt="Logo" fill className="object-cover" sizes="40px" />
          </div>
          <span className="text-white font-bold text-lg">Smart Residence</span>
        </div>

        <div className="bg-white/[0.03] border border-white/[0.08] rounded-[28px] p-9 shadow-2xl shadow-black/40 relative overflow-hidden">
          <div className="absolute -top-20 -right-20 w-52 h-52 bg-blue-500/10 blur-[80px] rounded-full pointer-events-none" />

          <div className="relative z-10">

            {/* Step 1: Имэйл */}
            {step === "email" && (
              <>
                <div className="mb-8">
                  <h3 className="text-[1.75rem] font-bold text-white mb-1.5">Нууц үг мартсан</h3>
                  <p className="text-gray-400 text-sm">Имэйл хаягаа оруулна уу, код илгээнэ.</p>
                </div>
                <form onSubmit={handleSendCode} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">Имэйл хаяг</label>
                    <input
                      type="email"
                      placeholder="email@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className={inputCls}
                    />
                  </div>
                  {error && <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3"><p className="text-red-400 text-sm">{error}</p></div>}
                  <button type="submit" disabled={loading}
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3.5 rounded-xl transition-all disabled:opacity-50 text-sm flex items-center justify-center gap-2 mt-2">
                    {loading ? <><svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>Илгээж байна...</> : "Код илгээх"}
                  </button>
                </form>
              </>
            )}

            {/* Step 2: Код */}
            {step === "code" && (
              <>
                <div className="mb-8">
                  <h3 className="text-[1.75rem] font-bold text-white mb-1.5">Код оруулах</h3>
                  <p className="text-gray-400 text-sm">
                    <span className="text-white font-medium">{email}</span> хаяг руу 6 оронтой код илгээгдлээ.
                  </p>
                </div>
                <form onSubmit={handleVerifyCode} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">Баталгаажуулах код</label>
                    <input
                      type="text"
                      placeholder="000000"
                      value={code}
                      onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      maxLength={6}
                      required
                      className={`${inputCls} text-center text-2xl font-bold tracking-[0.5em]`}
                    />
                  </div>
                  {error && <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3"><p className="text-red-400 text-sm">{error}</p></div>}
                  <button type="submit" disabled={loading || code.length !== 6}
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3.5 rounded-xl transition-all disabled:opacity-50 text-sm flex items-center justify-center gap-2 mt-2">
                    {loading ? <><svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>Шалгаж байна...</> : "Баталгаажуулах"}
                  </button>
                  <button type="button" onClick={() => { setStep("email"); setError(""); setCode(""); }}
                    className="w-full text-gray-500 hover:text-gray-300 text-sm py-2 transition-colors">
                    ← Имэйл дахин оруулах
                  </button>
                </form>
              </>
            )}

            {/* Step 3: Нууц үг */}
            {step === "password" && (
              <>
                <div className="mb-8">
                  <h3 className="text-[1.75rem] font-bold text-white mb-1.5">Шинэ нууц үг</h3>
                  <p className="text-gray-400 text-sm">Шинэ нууц үгээ оруулна уу.</p>
                </div>
                <form onSubmit={handleResetPassword} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">Шинэ нууц үг</label>
                    <input
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className={inputCls}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">Нууц үг давтах</label>
                    <input
                      type="password"
                      placeholder="••••••••"
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      required
                      className={inputCls}
                    />
                  </div>
                  {error && <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3"><p className="text-red-400 text-sm">{error}</p></div>}
                  <button type="submit" disabled={loading}
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3.5 rounded-xl transition-all disabled:opacity-50 text-sm flex items-center justify-center gap-2 mt-2">
                    {loading ? <><svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>Хадгалж байна...</> : "Нууц үг солих"}
                  </button>
                </form>
              </>
            )}

            <div className="mt-7 pt-7 border-t border-white/[0.06] text-center">
              <Link href="/login" className="text-gray-500 hover:text-gray-300 text-sm transition-colors">
                ← Нэвтрэх хуудас руу буцах
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}