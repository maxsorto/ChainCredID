"use client";

import { useState } from "react";
import { isAddress, type Address, type Hex } from "viem";
import { useChainId, useConnection, useReadContract, useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import { chainCredIdAbi, credentialTypeId, exampleCredentialTypes, registryAddresses } from "@/lib/contract";

export default function IssuePage() {
  const { address: connected } = useConnection();
  const chainId = useChainId();
  const registry = registryAddresses[chainId];

  const [subject, setSubject] = useState("");
  const [type, setType] = useState<string>(exampleCredentialTypes[0].name);
  const [ttlDays, setTtlDays] = useState(30);
  const [uri, setUri] = useState("");
  const [hash, setHash] = useState<Hex>();

  const issuerRole = useReadContract({
    address: registry,
    abi: chainCredIdAbi,
    functionName: "ISSUER_ROLE",
    query: { enabled: Boolean(registry) },
  });
  const isIssuer = useReadContract({
    address: registry,
    abi: chainCredIdAbi,
    functionName: "hasRole",
    args: [issuerRole.data as Hex, connected as Address],
    query: { enabled: Boolean(registry && issuerRole.data && connected) },
  });

  const write = useWriteContract();
  const receipt = useWaitForTransactionReceipt({ hash });

  const validSubject = isAddress(subject);
  const canSubmit = Boolean(registry && validSubject && isIssuer.data && !write.isPending && !receipt.isLoading);

  async function submit(action: "issue" | "revoke") {
    if (!registry || !validSubject) return;
    const credentialType = credentialTypeId(type);
    const expiration = ttlDays > 0 ? BigInt(Math.floor(Date.now() / 1000) + ttlDays * 86_400) : 0n;
    const txHash =
      action === "issue"
        ? await write.mutateAsync({
            address: registry,
            abi: chainCredIdAbi,
            functionName: "issue",
            args: [subject, credentialType, expiration, uri],
          })
        : await write.mutateAsync({ address: registry, abi: chainCredIdAbi, functionName: "revoke", args: [subject, credentialType] });
    setHash(txHash);
  }

  return (
    <div className="space-y-6">
      <section className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Issue or revoke</h1>
        <p className="max-w-2xl text-sm opacity-80">
          Only wallets holding <code>ISSUER_ROLE</code> on the registry can write. Each issue creates a revocable
          EAS attestation with the credential type and evidence URI in the payload; the registry is the attester,
          and the schema&apos;s resolver rejects anyone else.
        </p>
      </section>

      {!registry && <p className="text-sm opacity-80">No registry configured for this network.</p>}
      {registry && !connected && <p className="text-sm opacity-80">Connect a wallet.</p>}
      {registry && connected && isIssuer.data === false && (
        <p className="rounded-md border border-amber-500/50 px-3 py-2 text-sm">
          <span className="font-mono">{connected}</span> does not hold <code>ISSUER_ROLE</code>. Ask the admin to run{" "}
          <code>grantRole</code>, or use the deployer wallet.
        </p>
      )}

      <form
        className="grid gap-4 sm:grid-cols-2"
        onSubmit={(e) => {
          e.preventDefault();
          void submit("issue");
        }}
      >
        <label className="sm:col-span-2 text-sm">
          <span className="mb-1 block opacity-70">Subject wallet</span>
          <input className={field} placeholder="0x…" value={subject} onChange={(e) => setSubject(e.target.value.trim())} spellCheck={false} />
        </label>
        <label className="text-sm">
          <span className="mb-1 block opacity-70">Credential type</span>
          <select className={field} value={type} onChange={(e) => setType(e.target.value)}>
            {exampleCredentialTypes.map((t) => (
              <option key={t.name} value={t.name}>
                {t.label}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          <span className="mb-1 block opacity-70">Valid for (days, 0 = never expires)</span>
          <input className={field} type="number" min={0} value={ttlDays} onChange={(e) => setTtlDays(Number(e.target.value))} />
        </label>
        <label className="sm:col-span-2 text-sm">
          <span className="mb-1 block opacity-70">Evidence URI (optional)</span>
          <input className={field} placeholder="ipfs://… or https://…" value={uri} onChange={(e) => setUri(e.target.value.trim())} />
        </label>
        <div className="flex gap-2 sm:col-span-2">
          <button type="submit" className={primary} disabled={!canSubmit}>
            Issue
          </button>
          <button type="button" className={secondary} disabled={!canSubmit} onClick={() => void submit("revoke")}>
            Revoke
          </button>
        </div>
      </form>

      {(write.isPending || receipt.isLoading) && <p className="text-sm">Waiting for wallet / confirmation…</p>}
      {receipt.isSuccess && (
        <p className="break-all text-sm text-emerald-700 dark:text-emerald-400">
          Confirmed in block {receipt.data.blockNumber.toString()}. tx <span className="font-mono">{hash}</span>
        </p>
      )}
      {write.error && <p className="break-all text-sm text-red-600">{write.error.message}</p>}
    </div>
  );
}

const field = "w-full rounded-md border border-black/15 bg-transparent px-3 py-2 font-mono text-sm dark:border-white/20";
const primary = "rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background disabled:opacity-40";
const secondary = "rounded-md border border-black/15 px-4 py-2 text-sm font-medium disabled:opacity-40 dark:border-white/20";
