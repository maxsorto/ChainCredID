"use client";

import { useScene } from "./motion";
import { Seal, Status } from "./Seal";
import { Card, Scene, SUBJECT, UID_1 } from "./Scene";
import { Terminal, type TermLine } from "./Terminal";

const AGENT = "0x3C44…93BC";
const LINES: TermLine[] = [
  { at: 1, kind: "prompt", text: `getCredential(${AGENT}, SPEND_LIMIT_USDC_1000)` },
  { at: 2, kind: "ok", text: `→ active   uid ${UID_1}   metadataURI ipfs://policy/limit-1000` },
  { at: 3, kind: "prompt", text: `settle 900.00 USDC → ${SUBJECT}` },
  { at: 4, kind: "ok", text: "✓ within issuer-vouched limit · settled" },
  { at: 5, kind: "prompt", text: `settle 1200.00 USDC → ${SUBJECT}` },
  { at: 6, kind: "bad", text: "✗ over limit for SPEND_LIMIT_USDC_1000 · held for operator approval" },
];

export function SceneSpend() {
  const { ref, step, replay, done } = useScene([500, 1300, 1000, 1300, 1400, 1300, 1]);
  const attempt = step >= 5 ? 1200 : step >= 3 ? 900 : 0;
  const pct = Math.min(100, (attempt / 1000) * 100);
  const over = attempt > 1000;
  return (
    <Scene
      stageRef={ref}
      credential="SPEND_LIMIT_USDC_1000"
      title="A credential can carry a policy the payments backend enforces."
      brief={
        <>
          The issuer vouches that this agent may settle up to 1,000 USDC per period and points the attestation&apos;s
          metadata at the policy. The backend reads the credential, then applies its own rule: 900 goes through,
          1,200 is held.
        </>
      }
      detail="The registry stores the claim and who signed it. Amount checks live where the money moves."
      onReplay={replay}
      done={done}
    >
      <div className="space-y-4">
        <Card>
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="eyebrow">agent wallet</p>
              <p className="mt-1 font-mono text-xs">{AGENT}</p>
            </div>
            <div className="flex items-center gap-3">
              <Status state={step >= 2 ? "active" : "none"} />
              <Seal key={step >= 2 ? "a" : "n"} state={step >= 2 ? "active" : "none"} label="LIMIT" size={64} />
            </div>
          </div>
          <div className="mt-5">
            <div className="flex items-baseline justify-between font-mono text-xs">
              <span className="text-mute">attempt</span>
              <span className={over ? "text-bad" : "text-ink"}>
                {attempt ? `${attempt.toLocaleString()} USDC` : " "}
              </span>
            </div>
            <div className="relative mt-2 h-2 rounded bg-line">
              <div
                className="h-full rounded transition-[width,background-color] duration-700 ease-out"
                style={{ width: `${pct}%`, background: over ? "var(--bad)" : "var(--ok)" }}
              />
              <div className="absolute top-[-6px] h-5 w-px bg-ink" style={{ left: "calc(100% - 1px)" }} aria-hidden />
            </div>
            <div className="mt-1 flex justify-between font-mono text-[10px] text-mute">
              <span>0</span>
              <span>limit 1,000 USDC</span>
            </div>
          </div>
        </Card>
        <Terminal title="payments backend" lines={LINES} step={step} />
      </div>
    </Scene>
  );
}
