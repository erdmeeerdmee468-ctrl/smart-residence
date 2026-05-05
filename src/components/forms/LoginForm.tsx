"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Eye, EyeOff, Loader2, Lock, Mail } from "lucide-react";
import { isAppRole, ROLE_HOME } from "@/lib/roles";

type LoginResponse = {
  message?: string;
  user?: {
    role?: string;
  };
};

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const data = (await response.json()) as LoginResponse;

      if (!response.ok) {
        throw new Error(data.message || "Нэвтрэхэд алдаа гарлаа");
      }

      const role = data.user?.role;
     window.location.href = isAppRole(role) ? ROLE_HOME[role] : ROLE_HOME.RESIDENT;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Сервертэй холбогдоход алдаа гарлаа");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-2.5">
        <label className="ml-1 text-[11px] font-bold uppercase tracking-[0.24em] text-white/45">
          Имэйл хаяг
        </label>
        <div className="relative">
          <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="name@example.com"
            className="h-14 w-full rounded-2xl border border-white/10 bg-[#11162a] pl-11 pr-4 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-[#ff8c42]/60 focus:bg-[#151c35] focus:ring-2 focus:ring-[#ff8c42]/15"
            autoComplete="email"
            required
          />
        </div>
      </div>

      <div className="space-y-2.5">
        <label className="ml-1 text-[11px] font-bold uppercase tracking-[0.24em] text-white/45">
          Нууц үг
        </label>
        <div className="relative">
          <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
          <input
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="••••••••"
            className="h-14 w-full rounded-2xl border border-white/10 bg-[#11162a] pl-11 pr-11 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-[#ff8c42]/60 focus:bg-[#151c35] focus:ring-2 focus:ring-[#ff8c42]/15"
            autoComplete="current-password"
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword((current) => !current)}
            className="absolute right-3 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full text-white/35 transition hover:bg-white/5 hover:text-white/80"
            aria-label={showPassword ? "Нууц үг нуух" : "Нууц үг харах"}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {error ? (
        <p className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-100">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={loading}
        className="flex h-14 w-full items-center justify-center rounded-2xl bg-gradient-to-r from-[#ff9a3d] via-[#ff7a2f] to-[#ff4f2b] px-4 text-sm font-extrabold uppercase tracking-[0.24em] text-white shadow-[0_18px_40px_rgba(255,103,45,0.28)] transition hover:brightness-110 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-70"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Нэвтрэх"}
      </button>

      <p className="pt-1 text-center text-xs leading-6 text-white/40">
        Бүртгэл үүсгүүлэх бол системийн админтай холбогдоно уу.
      </p>
    </form>
  );
}
