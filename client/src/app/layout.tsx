import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "StudioSpace | Creative workspace marketplace",
  description: "A peer-to-peer marketplace for creative workspaces and production studios.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
