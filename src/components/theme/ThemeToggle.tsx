"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

export function ThemeToggle() {
  const [dark, setDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  const toggle = () => {
    const next = !document.documentElement.classList.contains("dark");
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("smart-residence-theme", next ? "dark" : "light");
    setDark(next);
  };

  return (
    <button
      type="button"
      onClick={toggle}
      className="fixed z-[70] flex h-11 w-11 items-center justify-center rounded-full border border-slate-200/90 bg-white/95 text-slate-700 shadow-[0_8px_24px_rgba(15,23,42,0.1)] backdrop-blur-sm transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800/95 dark:text-amber-200 dark:hover:bg-slate-700 sm:h-12 sm:w-12 top-[max(0.75rem,env(safe-area-inset-top))] right-[max(0.75rem,env(safe-area-inset-right))] sm:top-4 sm:right-4"
      title={dark ? "Гэрэл горим" : "Харанхуй горим"}
      aria-label={dark ? "Гэрэл горим" : "Харанхуй горим"}
    >
      {!mounted ? <Moon size={22} strokeWidth={1.9} /> : dark ? <Sun size={22} strokeWidth={1.9} /> : <Moon size={22} strokeWidth={1.9} />}
    </button>
  );
}
