"use client";

import Link from "next/link";
import Image from "next/image";
import LoginForm from "@/components/forms/LoginForm";
import { Bell, CreditCard, Wrench } from "lucide-react";
import { ResidenceLogo } from "@/components/brand/ResidenceLogo";

export default function LoginPage() {
  return (
    <main className="relative min-h-[100dvh] min-h-screen overflow-hidden bg-black text-white">
      <Image
        src="/photos/image.png"
        alt="Smart Residence login background"
        fill
        priority
        className="object-cover object-center"
      />

      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(3,5,14,0.84)_0%,rgba(3,5,14,0.7)_42%,rgba(3,5,14,0.28)_100%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_30%,rgba(255,255,255,0.08),transparent_24%),radial-gradient(circle_at_55%_52%,rgba(255,255,255,0.04),transparent_18%)]" />

      <div className="relative z-10 grid min-h-[100dvh] min-h-screen items-center gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[1fr_480px] lg:px-12 xl:px-16">
        <section className="hidden max-w-3xl lg:block">
          <div className="mb-8 inline-flex items-center gap-3 rounded-2xl border border-white/12 bg-white/10 px-4 py-3 backdrop-blur-xl">
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-white p-1.5 shadow-lg shadow-black/20">
              <ResidenceLogo className="h-full w-full" />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.28em] text-white/55">Smart Residence</p>
              <p className="text-sm font-bold text-white">Орон сууцны ухаалаг систем</p>
            </div>
          </div>

          <h2 className="max-w-2xl text-5xl font-black leading-[1.05] text-white xl:text-6xl">
            Гэрийн үйлчилгээ, төлбөр, хүсэлтээ нэг дороос.
          </h2>
          <p className="mt-5 max-w-xl text-base leading-8 text-white/65">
            Оршин суугч, СӨХ менежер, админ бүрд зориулсан dashboard-той. Өдөр тутмын мэдээлэл илүү ойлгомжтой,
            хурдан, цэгцтэй болно.
          </p>

          <div className="mt-8 grid max-w-2xl grid-cols-3 gap-3">
            {[
              { Icon: CreditCard, label: "Төлбөр", text: "Сар бүрийн төлөв" },
              { Icon: Wrench, label: "Хүсэлт", text: "Засвар үйлчилгээ" },
              { Icon: Bell, label: "Мэдэгдэл", text: "Зарлал, шинэчлэлт" },
            ].map(({ Icon, label, text }) => (
              <div key={label} className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur-xl">
                <div className="mb-4 grid h-10 w-10 place-items-center rounded-xl bg-white/12 text-white">
                  <Icon size={19} />
                </div>
                <p className="text-sm font-black text-white">{label}</p>
                <p className="mt-1 text-xs text-white/50">{text}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto w-full max-w-[480px] rounded-[28px] border border-white/14 bg-[#0b1020]/58 p-5 shadow-[0_30px_95px_rgba(0,0,0,0.48)] backdrop-blur-2xl sm:p-7 lg:mx-0">
          <div className="mb-5 flex items-center justify-between gap-4">
            <Link href="/" className="text-[11px] font-semibold uppercase tracking-[0.32em] text-white/40 transition hover:text-white/65">
              ← Нүүр
            </Link>
            <Link href="/" className="text-[11px] font-semibold uppercase tracking-[0.3em] text-white/45 transition hover:text-white/70">
              Тусламж
            </Link>
          </div>

          <div className="mb-6">
            <div className="mb-4 flex items-center gap-3 lg:hidden">
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-white p-1.5 shadow-lg shadow-black/20">
                <ResidenceLogo className="h-full w-full" />
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-white/35">Smart Residence</p>
                <p className="text-xs text-white/45">Орон сууцны систем</p>
              </div>
            </div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.38em] text-[#ffd6c0]">Тавтай морил</p>
            <h1 className="mt-3 text-3xl font-black uppercase tracking-[0.12em] text-white sm:text-4xl">Нэвтрэх</h1>
            <p className="mt-3 max-w-[32ch] text-sm leading-6 text-white/50">
              Оршин суугч, ажилтан, удирдлагын хувьд нэг цэгээс нэвтэрнэ.
            </p>
          </div>

          <LoginForm />

          <p className="mt-6 text-center text-[10px] font-semibold uppercase tracking-[0.42em] text-white/20">
            Smart Residence © 2026
          </p>
        </section>
      </div>
    </main>
  );
}
