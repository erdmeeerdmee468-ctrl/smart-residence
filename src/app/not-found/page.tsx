"use client";

import { ResidenceLogo } from "@/components/brand/ResidenceLogo";

export default function NotFound() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#0a0a0a] px-4 text-center">
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-red-600/10 blur-3xl" />
      <div className="relative px-8 py-10">
        <div className="mx-auto mb-8 grid h-20 w-20 place-items-center rounded-3xl border border-white/10 bg-white p-2.5 shadow-2xl shadow-black/30">
          <ResidenceLogo className="h-full w-full" />
        </div>
        <div className="select-none text-[clamp(120px,20vw,220px)] font-black leading-none tracking-tight text-transparent [-webkit-text-stroke:2px_rgba(255,255,255,0.08)]">
          404
        </div>
        <div className="mx-auto mb-8 h-0.5 w-16 bg-gradient-to-r from-transparent via-red-600 to-transparent" />
        <h1 className="mb-4 text-[clamp(18px,3vw,28px)] font-normal uppercase tracking-[0.1em] text-neutral-100">
          Хуудас олдсонгүй
        </h1>
        <p className="mb-12 text-sm tracking-[0.05em] text-white/40">
          Та хайж буй хуудас байхгүй эсвэл нэвтрэх эрх байхгүй байна.
        </p>
        <a
          href="/"
          className="inline-block border border-white/15 bg-white/[0.03] px-9 py-3 text-xs uppercase tracking-[0.15em] text-neutral-100 transition hover:border-red-600/50 hover:bg-red-600/15"
        >
          Нүүр хуудас руу буцах
        </a>
      </div>
    </div>
  );
}
