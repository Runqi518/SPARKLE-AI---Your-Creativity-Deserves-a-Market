import type { Metadata } from "next";
import "./globals.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Sparkle",
  description: "Sparkle - AI Video Creation Workspace",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="h-screen w-screen overflow-hidden bg-sparkle-bg text-sparkle-text">
        {children}
      </body>
    </html>
  );
}
