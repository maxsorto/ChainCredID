"use client";

import { useState } from "react";
import { isAddress, type Address } from "viem";
import { useChainId, useConnection, useReadContracts } from "wagmi";
import {
  chainCredIdAbi,
  credentialTypeId,
  easAttestationUrl,
  exampleCredentialTypes,
  registryAddresses,
  ZERO_BYTES32,
} from "@/lib/contract";

export default function VerifyPage() {
  const { address: connected } = useConnection();
  const chainId = useChainId();
  const registry = registryAddresses[chainId];
  const [input, setInput] = useState("");

  const subject: Address | undefined = isAddress(input) ? input : connected;

  const reads = useReadContracts({
    contracts: exampleCredentialTypes.map((t) => ({
      address: registry as Address,
      abi: chainCredIdAbi,
      functionName: "getCredential" as const,
      args: [subject as Address, credentialTypeId(t.name)] as const,
    })),
    query: { enabled: Boolean(registry && subject) },
  });

  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <h1 className="text-2xl font-semibold tracking-tight">Verify a credential</h1>
        <p className="max-w-2xl text-sm opacity-80">
          Paste any wallet (a human operator, a smart account, or an agent&apos;s wallet). Each row is read
          live from EAS through the registry: a credential is <b>active</b> only if it exists, is not revoked,
          and has not expired.
        </p>
        <input
          className="w-full rounded-md border border-black/15 bg-transparent px-3 py-2 font-mono text-sm dark:border-white/20"
          placeholder={connected ? `${connected} (connected wallet)` : "0x… subject address"}
          value={input}
          onChange={(e) => setInput(e.target.value.trim())}
          spellCheck={false}
        />
        {input && !isAddress(input) && <p className="text-xs text-red-600">Not a valid address.</p>}
      </section>

      {!registry && (
        <Notice>
          No registry deployed on this network. Run <code>forge script script/Deploy.s.sol</code> against
          anvil or Base Sepolia and set <code>NEXT_PUBLIC_REGISTRY_ADDRESS_*</code>.
        </Notice>
      )}
      {registry && !subject && <Notice>Connect a wallet or paste an address to look up.</Notice>}

      {registry && subject && (
        <ul className="divide-y divide-black/10 rounded-lg border border-black/10 dark:divide-white/10 dark:border-white/10">
          {exampleCredentialTypes.map((t, i) => {
            const r = reads.data?.[i];
            const result = r?.status === "success" ? r.result : undefined;
            const [attestation, metadataURI, active] = result ?? [];
            const uid = attestation?.uid;
            const issued = uid && uid !== ZERO_BYTES32;
            const url = uid && issued ? easAttestationUrl(chainId, uid) : undefined;
            return (
              <li key={t.name} className="flex flex-wrap items-start justify-between gap-3 px-4 py-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <Badge state={reads.isPending ? "loading" : active ? "active" : issued ? "inactive" : "none"} />
                    <span className="font-medium">{t.label}</span>
                    <code className="text-xs opacity-60">{t.name}</code>
                  </div>
                  <p className="mt-1 text-xs opacity-70">{t.blurb}</p>
                  {issued && attestation && (
                    <p className="mt-1 break-all font-mono text-[11px] opacity-70">
                      uid {uid}
                      {attestation.expirationTime > 0n && ` · expires ${fmt(attestation.expirationTime)}`}
                      {attestation.revocationTime > 0n && ` · revoked ${fmt(attestation.revocationTime)}`}
                      {metadataURI && ` · ${metadataURI}`}
                    </p>
                  )}
                  {r?.status === "failure" && <p className="mt-1 text-xs text-red-600">Read failed: {r.error.message}</p>}
                </div>
                {url && (
                  <a className="text-xs underline opacity-80" href={url} target="_blank" rel="noreferrer">
                    View on EAS
                  </a>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function fmt(ts: bigint) {
  return new Date(Number(ts) * 1000).toISOString().slice(0, 10);
}

function Badge({ state }: { state: "loading" | "active" | "inactive" | "none" }) {
  const map = {
    loading: ["bg-black/10 dark:bg-white/10", "…"],
    active: ["bg-emerald-600 text-white", "active"],
    inactive: ["bg-amber-500 text-black", "revoked / expired"],
    none: ["bg-black/10 dark:bg-white/10", "not issued"],
  } as const;
  const [cls, label] = map[state];
  return <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${cls}`}>{label}</span>;
}

function Notice({ children }: { children: React.ReactNode }) {
  return <p className="rounded-md border border-dashed border-black/20 px-4 py-3 text-sm opacity-80 dark:border-white/20">{children}</p>;
}
