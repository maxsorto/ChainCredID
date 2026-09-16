"use client";

import { useScene } from "./motion";
import { Seal, Status } from "./Seal";
import { Card, Scene, SUBJECT, UID_1 } from "./Scene";
import { Terminal, type TermLine } from "./Terminal";

const LINES: TermLine[] = [
  { at: 1, kind: "prompt", text: `hasCredential(${SUBJECT}, MERCHANT_VERIFIED)` },
  { at: 2, kind: "ok", text: `→ true    uid ${UID_1}   expires never` },
  { at: 3, kind: "prompt", text: `x402 pay 42.00 USDC → ${SUBJECT}` },
  { at: 4, kind: "ok", text: "✓ settled" },
  { at: 5, kind: "event", text: `CredentialRevoked(${SUBJECT}, MERCHANT_VERIFIED, ${UID_1})` },
  { at: 6, kind: "prompt", text: `hasCredential(${SUBJECT}, MERCHANT_VERIFIED)` },
  { at: 7, kind: "bad", text: "→ false   revoked 2026-09-16" },
  { at: 8, kind: "prompt", text: `x402 pay 42.00 USDC → ${SUBJECT}` },
  { at: 9, kind: "bad", text: "✗ blocked: counterparty credential not active" },
];

export function ScenePay() {
  const { ref, step, replay, done } = useScene([500, 1300, 900, 1300, 1600, 1500, 1200, 900, 1300, 1]);
  const state = step >= 5 ? "revoked" : step >= 2 ? "active" : "none";
  return (
    <Scene
      stageRef={ref}
      credential="MERCHANT_VERIFIED"
      title="An agent pays a merchant only while the merchant's credential is active."
      brief={
        <>
          Before an x402 payment, the agent&apos;s tool asks the registry one question. The first time the merchant is
          verified and the payment settles. Then the issuer revokes. Same wallet, same question, different answer, and
          the payment stops.
        </>
      }
      detail="The registry answers yes or no. Your payments code decides what to do with it."
      onReplay={replay}
      done={done}
    >
      <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_200px]">
        <Terminal title="agent · verify_credential" lines={LINES} step={step} />
        <Card className="flex flex-col items-center justify-between gap-3 text-center">
          <div>
            <p className="eyebrow">merchant</p>
            <p className="mt-1 font-mono text-xs">{SUBJECT}</p>
          </div>
          <Seal key={state} state={state} size={110} />
          <Status state={state} />
        </Card>
      </div>
    </Scene>
  );
}
