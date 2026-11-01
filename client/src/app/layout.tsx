import type { Metadata } from "next";
import { Suspense } from "react";
import Script from "next/script";
import { Toaster } from "sonner";
import { SiteFooter } from "@/components/site-footer";
import { SessionAwareHeader } from "@/components/auth/session-aware-header";
import "./globals.css";

export const metadata: Metadata = {
  title: "StudioSpace | Creative workspace marketplace",
  description: "A peer-to-peer marketplace for creative workspaces and production studios.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <head>
        <Script id="studio-space-theme" strategy="beforeInteractive">
          {`try { document.documentElement.dataset.theme = localStorage.getItem("studiospace-theme") === "dark" ? "dark" : "light"; } catch { document.documentElement.dataset.theme = "light"; }`}
        </Script>
      </head>
      <body className="min-h-full flex flex-col font-sans">
        <Suspense fallback={<div aria-hidden="true" className="sticky top-0 z-50 h-[76px] border-b border-line/80 bg-canvas/95" />}>
          <SessionAwareHeader />
        </Suspense>
        {children}
        <SiteFooter />
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}
