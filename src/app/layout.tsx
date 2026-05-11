import "./globals.css";
import type { Viewport } from "next";
import { GlobalChatMount } from "@/components/ai/GlobalChatMount";
import { ThemeScript } from "@/components/theme/ThemeScript";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="mn" suppressHydrationWarning>
      <body>
        <ThemeScript />
        {children}
        <GlobalChatMount />
      </body>
    </html>
  );
}
