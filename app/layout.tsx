import type { Metadata } from "next";
import "./globals.css";
import Providers from "@/app/providers";
import AppShell from "@/app/AppShell";

export const metadata: Metadata = {
  title: "Kinetic Pulse — Elite Fitness",
  description: "AI-powered fitness training dashboard",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased">
        <Providers>
          <AppShell>{children}</AppShell>
        </Providers>
      </body>
    </html>
  );
}
