"use client";

import { useChainId, useConnect, useConnection, useConnectors, useDisconnect, useSwitchChain } from "wagmi";
import { chains } from "@/lib/wagmi";
import { registryAddresses } from "@/lib/contract";

function short(addr: string) {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

export function ConnectButton() {
  const { address, isConnected } = useConnection();
  const chainId = useChainId();
  const connectors = useConnectors();
  const connect = useConnect();
  const disconnect = useDisconnect();
  const switchChain = useSwitchChain();

  if (!isConnected || !address) {
    const connector = connectors[0];
    return (
      <button
        type="button"
        className="whitespace-nowrap rounded-md bg-ink px-3 py-1.5 text-sm font-medium text-paper disabled:opacity-50"
        disabled={!connector || connect.isPending}
        onClick={() => connector && connect.mutate({ connector })}
      >
        {connect.isPending ? (
          "Connecting…"
        ) : (
          <>
            <span className="sm:hidden">Connect</span>
            <span className="hidden sm:inline">Connect wallet</span>
          </>
        )}
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2 text-sm">
      <select
        aria-label="Network"
        className="rounded-md border border-black/15 bg-transparent px-2 py-1 dark:border-white/20"
        value={chainId}
        onChange={(e) => switchChain.mutate({ chainId: Number(e.target.value) as (typeof chains)[number]["id"] })}
      >
        {chains.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
            {registryAddresses[c.id] ? "" : " (no registry)"}
          </option>
        ))}
      </select>
      <span className="font-mono text-xs" title={address}>
        {short(address)}
      </span>
      <button type="button" className="rounded-md border border-black/15 px-2 py-1 text-xs dark:border-white/20" onClick={() => disconnect.mutate({})}>
        Disconnect
      </button>
    </div>
  );
}
