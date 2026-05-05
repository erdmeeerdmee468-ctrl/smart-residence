"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

const logoUrl = "https://th.bing.com/th/id/OIP.DQ4OQ4rPfx39afbQ0JMypwHaHa?w=166&h=180&c=7&r=0&o=7&pid=1.7&rm=3";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) setError("Token байхгүй байна");
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
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
        setSuccess(true);
        setTimeout(() => router.push("/login"), 3000);
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

  return (
    <div className="bg-white/[0.03] border border-white/[0.08] rounded-[28px] p-9 shadow-2xl shadow-black/40 relative overflow-hidden">
      <div className="absolute -top-20 -right-20 w-52 h-52 bg-blue-500/10 blur-[80px] rounded-full pointer-events-none" />
      <div className="relative z-10">
        {success ? (
          <div className="text-center py-4">
            <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center text-3xl mx-auto mb-6">✅</div>
            <h3 className="text-xl font-bold text-white mb-2">Амжилттай!</h3>
            <p className="text-gray-400 text-sm mb-2">Нууц үг амжилттай солигдлоо.</p>
            <p className="text-gray-600 text-xs">3 секундын дараа нэвтрэх хуудас руу шилжинэ...</p>
          </div>
        ) : (
          <>
            <div className="mb-8">
              <h3 className="text-[1.75rem] font-bold text-white mb-1.5">Нууц үг сэргээх</h3>
              <p className="text-gray-400 text-sm">Шинэ нууц үгээ оруулна уу.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">
                  Шинэ нууц үг
                </label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full bg-white/[0.04] border border-white/[0.08] text-white px-4 py-3.5 rounded-xl focus:ring-2 focus:ring-blue-500/40 outline-none transition-all placeholder:text-gray-600 text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">
                  Нууц үг давтах
                </label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                  className="w-full bg-white/[0.04] border border-white/[0.08] text-white px-4 py-3.5 rounded-xl focus:ring-2 focus:ring-blue-500/40 outline-none transition-all placeholder:text-gray-600 text-sm"
                />
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !token}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3.5 rounded-xl transition-all active:scale-[0.98] disabled:opacity-50 text-sm flex items-center justify-center gap-2 mt-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    Хадгалж байна...
                  </>
                ) : "Нууц үг солих"}
              </button>
            </form>

            <div className="mt-7 pt-7 border-t border-white/[0.06] text-center">
              <Link href="/login" className="text-gray-500 hover:text-gray-300 text-sm transition-colors">
                ← Нэвтрэх хуудас руу буцах
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  const logoUrl = "https://th.bing.com/th/id/OIP.DQ4OQ4rPfx39afbQ0JMypwHaHa?w=166&h=180&c=7&r=0&o=7&pid=1.7&rm=3";

  return (
    <>
      <div className="hidden lg:flex flex-col flex-1 max-w-xl text-white">
        <div className="flex items-center gap-4 mb-10">
          <div className="relative w-14 h-14 rounded-2xl overflow-hidden border border-white/10">
            <Image src={logoUrl} alt="Logo" fill className="object-cover" sizes="56px" />
          </div>
          <span className="text-2xl font-bold tracking-tight">Smart Residence</span>
        </div>
        <h1 className="text-[3.5rem] font-black leading-[1.1] mb-6">
          <span className="text-white">Шинэ нууц үг</span><br />
          <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
            тохируулах
          </span>
        </h1>
        <p className="text-gray-400 text-lg leading-relaxed max-w-md">
          Аюулгүй, хүчтэй нууц үг сонгоно уу.
        </p>
      </div>

      <div className="w-full max-w-[420px]">
        <div className="lg:hidden flex items-center gap-3 mb-8">
          <div className="relative w-10 h-10 rounded-xl overflow-hidden border border-white/10">
            <Image src={logoUrl} alt="Logo" fill className="object-cover" sizes="40px" />
          </div>
          <span className="text-white font-bold text-lg">Smart Residence</span>
        </div>
        <Suspense fallback={<div className="text-gray-500 text-sm">Ачааллаж байна...</div>}>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </>
  );
}