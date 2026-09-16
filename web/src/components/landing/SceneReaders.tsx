"use client";

import { useScene } from "./motion";
import { Seal, Status } from "./Seal";
import { Card, Scene, SUBJECT, UID_1 } from "./Scene";
import { Terminal, type TermLine } from "./Terminal";

const REG = "$REGISTRY";
const CLI: TermLine[] = [
  { at: 1, kind: "prompt", text: `cast call ${REG} "hasCredential(address,bytes32)(bool)" $SUBJECT $(cast keccak AGENT_REGISTERED)` },
  { at: 2, kind: "ok", text: "true" },
  { at: 5, kind: "prompt", text: `cast call ${REG} "hasCredential(address,bytes32)(bool)" $SUBJECT $(cast keccak AGENT_REGISTERED)` },
  { at: 6, kind: "bad", text: "false" },
];

export function SceneReaders() {
  const { ref, step, replay, done } = useScene([500, 1400, 1200, 1400, 1400, 1400, 1200, 1]);
  const web = step >= 5 ? "revoked" : step >= 2 ? "active" : step >= 1 ? "loading" : "none";
  return (
    <Scene
      stageRef={ref}
      credential="AGENT_REGISTERED"
      title="Two readers, one source. Neither of them is this app."
      brief={
        <>
          The web page and a plain <span className="font-mono text-[0.95em]">cast call</span> read the same attestation
          through the registry. When the issuer revokes, both flip on the next read, because the truth lives on EAS and
          the registry only stores a pointer to&nbsp;it.
        </>
      }
      detail="Anything that can read a chain can verify: an indexer, another contract, an MCP tool in an agent's toolbox."
      onReplay={replay}
      done={done}
    >
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="flex flex-col">
          <p className="eyebrow">reader A · /verify</p>
          <div className="mt-3 rounded-md border border-line px-3 py-2 font-mono text-[11px] text-ink-2">{SUBJECT}</div>
          <div className="mt-3 flex items-center justify-between rounded-md border border-line px-3 py-2">
            <div>
              <div className="text-sm font-medium">Agent registered</div>
              <div className="font-mono text-[10px] text-mute">AGENT_REGISTERED</div>
            </div>
            <Status state={web} />
          </div>
          <div className="mt-3 flex flex-1 items-center justify-center py-2">
            <Seal key={web} state={web === "loading" || web === "none" ? "none" : web} size={88} />
          </div>
          <p className="font-mono text-[10px] text-mute">uid {UID_1}</p>
        </Card>
        <div className="flex flex-col gap-3">
          <Terminal title="reader B · cast (Foundry)" lines={CLI} step={step} className="flex-1" />
          <div
            className={`rounded-md border px-3 py-2 font-mono text-[11px] transition-colors ${
              step >= 4 ? "border-bad/40 bg-bad-soft text-bad" : "border-line text-mute"
            }`}
          >
            {step >= 4 ? `event CredentialRevoked(${SUBJECT}, AGENT_REGISTERED, ${UID_1})` : "waiting for chain events"}
          </div>
        </div>
      </div>
    </Scene>
  );
}
