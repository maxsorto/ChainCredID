import type { Metadata } from "next";
import { Bricolage_Grotesque, IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";
import { headers } from "next/headers";
import Link from "next/link";
import { cookieToInitialState } from "wagmi";
import { wagmiConfig } from "@/lib/wagmi";
import { Providers } from "./providers";
import { ConnectButton } from "@/components/ConnectButton";
import { SiteFooter } from "@/components/SiteFooter";
import "./globals.css";

const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
  weight: "variable",
  axes: ["wdth", "opsz"],
});
const plexSans = IBM_Plex_Sans({ variable: "--font-plex-sans", subsets: ["latin"], weight: ["400", "500", "600"] });
const plexMono = IBM_Plex_Mono({ variable: "--font-plex-mono", subsets: ["latin"], weight: ["400", "500"] });

export const metadata: Metadata = {
  title: "ChainCredID",
  description:
    "Issuer-signed, revocable, expiring credentials for wallets, including the wallets AI agents pay from. Built on EAS.",
  icons: { icon: "/logo.png" },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const initialState = cookieToInitialState(wagmiConfig, (await headers()).get("cookie"));
  return (
    <html lang="en" className={`${bricolage.variable} ${plexSans.variable} ${plexMono.variable} h-full`}>
      <body className="flex min-h-full flex-col">
        <Providers initialState={initialState}>
          <header className="sticky top-0 z-40 border-b border-line bg-paper/85 backdrop-blur">
            <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-5 py-3">
              <nav className="flex items-center gap-6 text-sm">
                <Link href="/" className="display flex items-center gap-2 text-[15px] font-semibold tracking-tight">
                  <span aria-hidden className="inline-block size-3 rounded-full border-2 border-ink" />
                  ChainCredID
                </Link>
                <Link href="/verify" className="text-ink-2 hover:text-ink">
                  Verify
                </Link>
                <Link href="/issue" className="text-ink-2 hover:text-ink">
                  Issue
                </Link>
                <a
                  href="https://github.com/maxsorto/ChainCredID"
                  className="hidden text-ink-2 hover:text-ink sm:inline"
                  target="_blank"
                  rel="noreferrer"
                >
                  GitHub
                </a>
              </nav>
              <ConnectButton />
            </div>
          </header>
          <main className="flex-1">{children}</main>
          <SiteFooter />
        </Providers>
      </body>
    </html>
  );
}
