import type { Metadata } from "next";
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
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col font-sans">
        <SessionAwareHeader />
        {children}
        <SiteFooter />
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}
