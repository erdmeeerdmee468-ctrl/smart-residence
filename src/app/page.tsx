"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ResidenceLogo } from "@/components/brand/ResidenceLogo";

const contacts = [
  {
    label: "Утас",
    value: "+976 95082227",
    href: "tel:+97695082227",
  },
  {
    label: "Gmail",
    value: "info@smartresidence.mn",
    href: "mailto:info@smartresidence.mn",
  },
  {
    label: "Facebook",
    value: "Smart Residence",
    href: "https://facebook.com/smartresidence",
    external: true,
  },
];

export default function HomePage() {
  const [mounted, setMounted] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    setMounted(true);
    videoRef.current?.play().catch(() => {});
  }, []);

  return (
    <main className="relative min-h-[100dvh] w-full overflow-x-hidden bg-black text-white">
      <video
        ref={videoRef}
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 h-full w-full object-cover"
      >
        <source src="/videos/slide1.mp4" type="video/mp4" />
      </video>

      <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/45 to-black/85" />

      <div
        className="pointer-events-none absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.18) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.18) 1px, transparent 1px)",
          backgroundSize: "72px 72px",
        }}
      />

      <div className="relative z-10 flex min-h-[100dvh] flex-col">
        <header className="flex shrink-0 items-center justify-center px-5 py-5 sm:justify-start sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/15 bg-white/95 p-1.5 shadow-lg shadow-black/20 backdrop-blur-md sm:h-12 sm:w-12">
              <ResidenceLogo className="h-full w-full" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-[11px] uppercase tracking-[0.24em] text-white/55 sm:text-xs sm:tracking-[0.35em]">
                Smart Residence
              </p>
              <h1 className="truncate text-sm font-bold text-white sm:text-lg">Орон сууцны ухаалаг систем</h1>
            </div>
          </div>
        </header>

        <section
          className={`flex flex-1 items-center px-5 py-8 transition-all duration-700 sm:px-6 sm:py-12 lg:px-8 ${
            mounted ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
          }`}
        >
          <div className="mx-auto w-full max-w-4xl text-center">
            <div className="mb-5 inline-flex max-w-full items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-2 backdrop-blur-md sm:mb-6 sm:px-4">
              <span className="h-2 w-2 shrink-0 animate-pulse rounded-full bg-emerald-400" />
              <span className="truncate text-[11px] font-medium text-white/80 sm:text-xs">
                Smart Residence · Хотхоны ухаалаг шийдэл
              </span>
            </div>

            <h2 className="mx-auto max-w-[11ch] text-[clamp(2.15rem,12vw,4.5rem)] font-black leading-[1.02] text-white drop-shadow-2xl sm:max-w-none sm:text-5xl lg:text-7xl">
              SMART
              <span className="block bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent sm:inline">
                {" "}
                RESIDENCE
              </span>
            </h2>

            <p className="mx-auto mt-5 max-w-2xl text-sm leading-6 text-white/75 sm:mt-6 sm:text-lg sm:leading-7">
              Орон сууцны зар мэдээ, үйлчилгээ, төлбөр тооцоо болон хүсэлтийг оршин суугч бүрд ойлгомжтой, хурдан,
              найдвартай байдлаар хүргэнэ.
            </p>

            <div className="mx-auto mt-7 flex w-full max-w-sm flex-col items-center gap-3 rounded-2xl border border-white/15 bg-black/20 px-4 py-4 shadow-2xl shadow-black/20 backdrop-blur-md sm:mt-8 sm:max-w-none sm:flex-row sm:justify-center sm:gap-4 sm:border-0 sm:bg-transparent sm:p-0 sm:shadow-none sm:backdrop-blur-0">
              <p className="text-center text-sm font-semibold text-white/90 sm:text-base">Та манай оршин суугч уу?</p>
              <Link
                href="/login"
                className="inline-flex h-12 w-full items-center justify-center rounded-xl bg-blue-600 px-7 text-sm font-bold text-white shadow-lg shadow-blue-600/30 transition hover:bg-blue-500 active:scale-95 sm:w-auto sm:rounded-2xl"
              >
                Нэвтрэх
              </Link>
            </div>
          </div>
        </section>

        <footer className="shrink-0 px-5 pb-5 pt-2 sm:px-6 sm:pb-6 lg:px-8">
          <div className="mx-auto flex max-w-6xl flex-col items-center gap-2 text-center">
            <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs text-white/55 sm:text-sm">
              {contacts.map((item, index) => (
                <div key={item.label} className="flex items-center gap-3">
                  {item.external ? (
                    <a href={item.href} target="_blank" rel="noreferrer" className="transition hover:text-white/90">
                      {item.value}
                    </a>
                  ) : (
                    <a href={item.href} className="transition hover:text-white/90">
                      {item.value}
                    </a>
                  )}
                  {index < contacts.length - 1 ? <span className="text-white/20">•</span> : null}
                </div>
              ))}
            </div>

            <p className="text-[11px] text-white/25">© 2026 Smart Residence. Бүх эрх хуулиар хамгаалагдсан.</p>
          </div>
        </footer>
      </div>
    </main>
  );
}
