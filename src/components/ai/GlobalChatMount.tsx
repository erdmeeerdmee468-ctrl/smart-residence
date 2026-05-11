"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";

const GlobalChatWidget = dynamic(
  () => import("./GlobalChatWidget").then((mod) => mod.GlobalChatWidget),
  {
    ssr: false,
    loading: () => null,
  },
);

export function GlobalChatMount() {
  const pathname = usePathname();

  if (pathname === "/" || pathname?.startsWith("/login") || pathname?.startsWith("/api")) {
    return null;
  }

  return <GlobalChatWidget />;
}
