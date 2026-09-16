"use client";

import { useScene } from "./motion";
import { Seal, Status, type SealState } from "./Seal";
import { Card, Scene, SUBJECT, UID_1, UID_2 } from "./Scene";
import { Terminal, type TermLine } from "./Terminal";

const LINES: TermLine[] = [
  { at: 1, kind: "prompt", text: `issue(${SUBJECT}, OPERATOR_KYC, now + 30d, "ipfs://kyc-report")` },
  { at: 2, kind: "event", text: `CredentialIssued(${SUBJECT}, OPERATOR_KYC, ${UID_1}, expires +30d)` },
  { at: 5, kind: "warn", text: "day 31 · hasCredential → false   expired (attestation still on EAS)" },
  { at: 6, kind: "prompt", text: `issue(${SUBJECT}, OPERATOR_KYC, now + 30d, "ipfs://kyc-report-v2")` },
  { at: 7, kind: "event", text: `CredentialIssued(${SUBJECT}, OPERATOR_KYC, ${UID_2}, refUID ${UID_1})` },
  { at: 8, kind: "ok", text: "hasCredential → true    history: 2 attestations, linked" },
];

export function SceneExpiry() {
  const { ref, step, replay, done } = useScene([500, 1200, 1200, 1400, 1400, 1500, 1200, 1300, 1]);
  // day counter: steps 2..5 scrub 0 → 31
  const day = step < 2 ? 0 : step === 2 ? 0 : step === 3 ? 12 : step === 4 ? 27 : 31;
  const first: SealState = step >= 5 ? "expired" : step >= 2 ? "active" : "none";
  const second: SealState = step >= 7 ? "active" : "none";
  const pct = Math.min(100, (day / 31) * 100);
  return (
    <Scene
      stageRef={ref}
      credential="OPERATOR_KYC"
      title="Credentials expire on their own, and a re-issue keeps the history."
      brief={
        <>
          An issuer grants operator KYC for 30 days. Nothing needs to revoke it: on day 31 the same read returns false
          because the attestation&apos;s expiration time has passed. A fresh issue writes a new attestation that points
          at the old one through <span className="font-mono text-[0.95em]">refUID</span>.
        </>
      }
      detail="Expired attestations stay on EAS. Verifiers see the whole chain, not just the current state."
      onReplay={replay}
      done={done}
    >
      <div className="space-y-4">
        <Card>
          <div className="flex items-center justify-between font-mono text-xs text-mute">
            <span>issued</span>
            <span className={day >= 31 ? "text-warn" : "text-ink"}>day {day}</span>
            <span>expires day 30</span>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded bg-line">
            <div
              className="h-full rounded transition-[width] duration-1000 ease-linear"
              style={{ width: `${pct}%`, background: day >= 31 ? "var(--warn)" : "var(--ok)" }}
            />
          </div>
          <div className="mt-5 grid grid-cols-[1fr_auto_1fr] items-center gap-2">
            <div className="flex flex-col items-center gap-2 text-center">
              <Seal key={`a-${first}`} state={first} size={96} />
              <p className="font-mono text-[11px] text-mute">{UID_1}</p>
              <Status state={first} />
            </div>
            <div className="flex w-14 items-center justify-center">
              <svg viewBox="0 0 56 20" className="w-14" aria-hidden>
                <path
                  d="M2 10 H50"
                  stroke={second === "active" ? "var(--cobalt)" : "var(--line-2)"}
                  strokeWidth="1.5"
                  strokeDasharray="4 4"
                  className={second === "active" ? "flow" : ""}
                />
                <path d="M46 5 L52 10 L46 15" fill="none" stroke={second === "active" ? "var(--cobalt)" : "var(--line-2)"} strokeWidth="1.5" />
              </svg>
            </div>
            <div className="flex flex-col items-center gap-2 text-center">
              <Seal key={`b-${second}`} state={second} size={96} />
              <p className="font-mono text-[11px] text-mute">{second === "active" ? `${UID_2} · refUID ${UID_1}` : " "}</p>
              {second === "active" ? <Status state="active" /> : <span className="font-mono text-[10px] text-mute">re-issue</span>}
            </div>
          </div>
        </Card>
        <Terminal title="issuer console" lines={LINES} step={step} />
      </div>
    </Scene>
  );
}
