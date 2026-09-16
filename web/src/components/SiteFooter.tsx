import Link from "next/link";
import { baseSepolia } from "wagmi/chains";
import { easScanBase, registryAddresses } from "@/lib/contract";

export function SiteFooter() {
  const baseRegistry = registryAddresses[baseSepolia.id];
  const easScan = easScanBase[baseSepolia.id];
  return (
    <footer className="border-t border-line">
      <div className="mx-auto grid w-full max-w-6xl gap-6 px-5 py-8 text-sm sm:grid-cols-[1fr_auto]">
        <p className="max-w-xl text-ink-2">
          ChainCredID won a top prize at ETH Latam 2024 in San&nbsp;Pedro&nbsp;Sula and was re-cut in 2026 around agent
          and operator credentials. Testnet only, unaudited. Credentials are EAS attestations under a closed schema;
          verification reads EAS, not this&nbsp;app.
        </p>
        <nav className="flex flex-wrap gap-x-5 gap-y-2 font-mono text-xs text-ink-2">
          <Link href="/verify" className="hover:text-ink">
            /verify
          </Link>
          <Link href="/issue" className="hover:text-ink">
            /issue
          </Link>
          <a href="https://github.com/maxsorto/ChainCredID" target="_blank" rel="noreferrer" className="hover:text-ink">
            github
          </a>
          {easScan && (
            <a
              href={baseRegistry ? `${easScan}/address/${baseRegistry}` : easScan}
              target="_blank"
              rel="noreferrer"
              className="hover:text-ink"
            >
              easscan{baseRegistry ? "" : " (registry pending)"}
            </a>
          )}
        </nav>
      </div>
    </footer>
  );
}
