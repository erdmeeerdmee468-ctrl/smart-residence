"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const contacts = [
  {
    icon: "📞",
    label: "Утас",
    value: "+976 95082227",
    href: "tel:+97695082227",
  },
  {
    icon: "✉️",
    label: "Gmail",
    value: "info@smartresidence.mn",
    href: "mailto:info@smartresidence.mn",
  },
  {
    icon: "📘",
    label: "Facebook",
    value: "Smart Residence",
    href: "https://facebook.com/smartresidence",
    external: true,
  },
];

export default function HomePage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <main className="relative min-h-[100dvh] min-h-screen w-full overflow-hidden bg-black">
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 h-full w-full object-cover"
      >
        <source src="/videos/slide1.mp4" type="video/mp4" />
      </video>

      <div className="absolute inset-0 bg-gradient-to-b from-black/65 via-black/45 to-black/80" />

      <div
        className="absolute inset-0 pointer-events-none opacity-[0.05]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.18) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.18) 1px, transparent 1px)",
          backgroundSize: "72px 72px",
        }}
      />

      <div className="relative z-10 flex min-h-[100dvh] min-h-screen flex-col">
        <header className="flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/15 bg-white/10 text-xl backdrop-blur-md">
              🏢
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-white/50">
                Smart Residence
              </p>
              <h1 className="text-lg font-bold text-white">
                Орон сууцны ухаалаг систем
              </h1>
            </div>
          </div>

          <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-end sm:gap-4">
            <p className="text-sm font-semibold text-white/90 sm:text-base">
              Та манай оршин суугч уу?
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/login"
                className="inline-flex items-center justify-center rounded-2xl bg-blue-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-blue-600/30 transition hover:bg-blue-500 active:scale-95"
              >
                Нэвтрэх
              </Link>
            </div>
          </div>
        </header>

        <section
          className={`flex flex-1 items-center px-5 py-12 transition-all duration-700 sm:px-6 lg:px-8 ${
            mounted ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
          }`}
        >
          <div className="mx-auto max-w-4xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 backdrop-blur-md">
              <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
              <span className="text-xs font-medium text-white/80">
                Smart Residence · Гэрийн ухаалаг шийдэл
              </span>
            </div>

            <h2 className="text-[clamp(1.65rem,8vw,4.5rem)] font-black leading-[1.1] text-white drop-shadow-2xl sm:text-5xl lg:text-7xl">
              SMART
              <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                {" "}
                RESIDENCE
              </span>
              <br />
              
            </h2>

            <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-white/75 sm:text-lg">
              Орон сууцны зар мэдээлэл, үйлчилгээ, төлбөр тооцоо болон хүсэлтийг
              оршин суугч бүрд ойлгомжтой, хурдан, найдвартай байдлаар хүргэнэ.
            </p>

          </div>
        </section>

        <footer className="px-5 pb-6 pt-2 sm:px-6 lg:px-8">
          <div className="mx-auto flex max-w-6xl flex-col items-center gap-2 text-center">
            <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs text-white/55 sm:text-sm">
              {contacts.map((item, index) => (
                <div key={item.label} className="flex items-center gap-3">
                  {item.external ? (
                    <a
                      href={item.href}
                      target="_blank"
                      rel="noreferrer"
                      className="transition hover:text-white/90"
                    >
                      {item.value}
                    </a>
                  ) : (
                    <a
                      href={item.href}
                      className="transition hover:text-white/90"
                    >
                      {item.value}
                    </a>
                  )}
                  {index < contacts.length - 1 ? (
                    <span className="text-white/20">•</span>
                  ) : null}
                </div>
              ))}
            </div>

            <p className="text-[11px] text-white/25">
              © 2026 Smart Residence. Бүх эрх хуулиар хамгаалагдсан.
            </p>
          </div>
        </footer>
      </div>
    </main>
  );
}
