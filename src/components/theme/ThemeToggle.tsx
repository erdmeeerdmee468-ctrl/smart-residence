"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Moon, Sun } from "lucide-react";

export function ThemeToggle({
  className = "",
  iconSize = 17,
}: {
  className?: string;
  iconSize?: number;
}) {
  const pathname = usePathname();
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

  if (pathname === "/" || pathname?.startsWith("/login")) {
    return null;
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className={className}
      title={dark ? "Гэрэл горим" : "Харанхуй горим"}
      aria-label={dark ? "Гэрэл горим" : "Харанхуй горим"}
    >
      {!mounted ? (
        <Moon size={iconSize} strokeWidth={1.9} />
      ) : dark ? (
        <Sun size={iconSize} strokeWidth={1.9} />
      ) : (
        <Moon size={iconSize} strokeWidth={1.9} />
      )}
    </button>
  );
}
