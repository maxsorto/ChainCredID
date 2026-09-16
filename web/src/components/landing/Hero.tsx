"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useReducedMotion } from "./motion";
import { Seal, Status, type SealState } from "./Seal";
import { Card, SUBJECT_FULL, UID_1 } from "./Scene";

/**
 * The hero stamps a live credential card through its whole life: issued, active, revoked,
 * re-issued. It is the one thing this page should be remembered by.
 */
const FRAMES: { state: SealState; line: string; hold: number }[] = [
  { state: "none", line: "issue(subject, MERCHANT_VERIFIED, 0, evidenceURI)", hold: 1400 },
  { state: "active", line: "hasCredential(subject, MERCHANT_VERIFIED) → true", hold: 2600 },
  { state: "revoked", line: "revoke(subject, MERCHANT_VERIFIED)", hold: 2200 },
  { state: "none", line: "hasCredential(subject, MERCHANT_VERIFIED) → false", hold: 1500 },
];

export function Hero() {
  const reduced = useReducedMotion();
  const [i, setI] = useState(1);
  useEffect(() => {
    if (reduced) return;
    const t = setTimeout(() => setI((k) => (k + 1) % FRAMES.length), FRAMES[i].hold);
    return () => clearTimeout(t);
  }, [i, reduced]);
  const f = FRAMES[i];

  return (
    <section className="mx-auto grid w-full max-w-6xl gap-10 px-5 pb-16 pt-14 md:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] md:items-center md:pt-20">
      <div>
        <p className="eyebrow">Credential registry on EAS · Base Sepolia · testnet</p>
        <h1 className="mt-5 text-[2.6rem] font-semibold leading-[1.02] tracking-tight md:text-[3.6rem]">
          Know who you are paying before the money&nbsp;moves.
        </h1>
        <p className="mt-6 max-w-xl text-lg leading-relaxed text-ink-2">
          ChainCredID is an issuer-signed credential registry on the Ethereum Attestation Service. A human, a payments
          backend, or an AI agent asks one question about a wallet, <span className="font-mono text-[0.95em]">hasCredential(subject,&nbsp;type)</span>,
          and gets an answer computed from EAS state: not from this app, not from a database.
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Link
            href="/verify"
            className="rounded-md bg-ink px-4 py-2.5 text-sm font-medium text-paper transition hover:opacity-90"
          >
            Verify a wallet
          </Link>
          <Link
            href="/issue"
            className="rounded-md border border-line-2 px-4 py-2.5 text-sm font-medium text-ink transition hover:border-ink"
          >
            Open the issuer console
          </Link>
          <a
            href="https://github.com/maxsorto/ChainCredID"
            target="_blank"
            rel="noreferrer"
            className="px-2 py-2.5 font-mono text-xs text-ink-2 hover:text-ink"
          >
            github.com/maxsorto/ChainCredID
          </a>
        </div>
        <p className="mt-8 max-w-xl text-sm leading-relaxed text-mute">
          Won a top prize at ETH Latam 2024 as a citizen-rights demo. Rebuilt in 2026 around agent and operator
          credentials: Foundry, 23 tests against real EAS bytecode, Next.js&nbsp;16, wagmi&nbsp;3. Not audited, not on
          mainnet.
        </p>
      </div>

      <Card className="relative overflow-hidden p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="eyebrow">subject</p>
            <p className="mt-1 break-all font-mono text-[13px]">{SUBJECT_FULL}</p>
            <p className="mt-4 eyebrow">credential</p>
            <p className="mt-1 font-mono text-[13px]">MERCHANT_VERIFIED</p>
            <p className="mt-4 eyebrow">status</p>
            <div className="mt-1">
              <Status state={f.state === "none" && i === 3 ? "revoked" : f.state} />
            </div>
          </div>
          <div className="shrink-0 pt-1">
            <Seal key={`${i}-${f.state}`} state={f.state === "none" ? (i === 3 ? "revoked" : "none") : f.state} size={128} />
          </div>
        </div>
        <div className="mt-5 border-t border-line pt-3 font-mono text-[11.5px] leading-relaxed text-ink-2">
          <div className="text-mute">last call</div>
          <div key={i} className="rise break-words">
            {f.line}
          </div>
          <div className="mt-1 text-mute">
            attestation {UID_1} · schema closed by RegistryOnlyResolver
          </div>
        </div>
      </Card>
    </section>
  );
}
