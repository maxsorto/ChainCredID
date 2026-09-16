import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { headers } from "next/headers";
import Link from "next/link";
import { cookieToInitialState } from "wagmi";
import { wagmiConfig } from "@/lib/wagmi";
import { Providers } from "./providers";
import { ConnectButton } from "@/components/ConnectButton";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ChainCredID",
  description: "Issuer-signed, revocable credentials for agents and operators, backed by EAS.",
  icons: { icon: "/logo.png" },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const initialState = cookieToInitialState(wagmiConfig, (await headers()).get("cookie"));
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <Providers initialState={initialState}>
          <header className="border-b border-black/10 dark:border-white/10">
            <div className="mx-auto flex w-full max-w-4xl items-center justify-between gap-4 px-4 py-3">
              <nav className="flex items-center gap-5 text-sm">
                <Link href="/" className="font-semibold tracking-tight">
                  ChainCredID
                </Link>
                <Link href="/" className="opacity-70 hover:opacity-100">
                  Verify
                </Link>
                <Link href="/issue" className="opacity-70 hover:opacity-100">
                  Issue
                </Link>
              </nav>
              <ConnectButton />
            </div>
          </header>
          <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8">{children}</main>
          <footer className="mx-auto w-full max-w-4xl px-4 py-6 text-xs opacity-60">
            ETH Latam 2024 winner, re-cut for 2026. Testnet only. Credentials are EAS attestations under a
            closed schema; verification reads EAS, not this app.
          </footer>
        </Providers>
      </body>
    </html>
  );
}
