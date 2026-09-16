"use client";

import { useInView } from "./motion";

/**
 * How a credential moves. The dashed paths animate while the section is in view; the
 * resolver's "attester == registry?" check is drawn as a gate because that is what it is.
 */
export function Flow() {
  const { ref, inView } = useInView<HTMLDivElement>(0.3);
  const flow = inView ? "flow" : "";
  return (
    <section className="mx-auto w-full max-w-6xl px-5 py-16">
      <div className="rule" />
      <div className="grid gap-8 pt-8 md:grid-cols-[minmax(0,4fr)_minmax(0,8fr)]">
        <div>
          <p className="eyebrow">How it works</p>
          <h2 className="mt-3 text-2xl font-semibold md:text-3xl">One writer, one schema, any&nbsp;reader.</h2>
          <ul className="mt-5 space-y-3 text-[15px] leading-relaxed text-ink-2">
            <li>
              <b className="text-ink">Issue.</b> A wallet holding <code className="font-mono text-[0.9em]">ISSUER_ROLE</code>{" "}
              calls <code className="font-mono text-[0.9em]">issue(subject, credentialType, expirationTime, metadataURI)</code>.
            </li>
            <li>
              <b className="text-ink">Attest.</b> The registry writes a typed, revocable EAS attestation. The schema&apos;s
              resolver rejects any attester that is not the registry, so the schema is closed.
            </li>
            <li>
              <b className="text-ink">Verify.</b> Anyone calls <code className="font-mono text-[0.9em]">hasCredential</code>.
              The answer is derived from the attestation&apos;s revocation and expiration times on EAS.
            </li>
            <li>
              <b className="text-ink">Re-issue.</b> A new attestation links to the old one through{" "}
              <code className="font-mono text-[0.9em]">refUID</code>, so a credential&apos;s history is a chain.
            </li>
          </ul>
        </div>
        <div ref={ref} className="self-start overflow-x-auto rounded-xl border border-line bg-panel p-3 sm:p-5">
          <svg viewBox="0 0 720 300" className="h-auto w-full min-w-[560px]" role="img" aria-label="Issuer to registry to EAS to verifier">
            <defs>
              <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                <path d="M0,0 L10,5 L0,10 z" fill="var(--ink-2)" />
              </marker>
            </defs>
            <Node x={20} y={110} w={150} title="Issuer wallet" sub="ISSUER_ROLE" />
            <Node x={240} y={110} w={215} title="ChainCredID.sol" sub="issue · revoke · hasCredential" />
            <Node x={530} y={30} w={170} title="EAS" sub="attestations" />
            <Node x={530} y={190} w={170} title="RegistryOnlyResolver" sub="attester == registry?" gate />
            <Node x={250} y={230} w={200} title="Any verifier" sub="dApp · backend · agent tool" dashed />

            <path d="M170 145 H240" stroke="var(--ink-2)" strokeWidth="1.5" fill="none" markerEnd="url(#arrow)" className={flow} />
            <text x="172" y="136" fontFamily="var(--font-mono)" fontSize="9.5" fill="var(--mute)">
              issue / revoke
            </text>

            <path d="M455 130 C 490 110, 500 80, 530 68" stroke="var(--ok)" strokeWidth="1.5" fill="none" markerEnd="url(#arrow)" className={flow} />
            <text x="458" y="92" fontFamily="var(--font-mono)" fontSize="10" fill="var(--ok)">
              attest
            </text>

            <path d="M615 100 V190" stroke="var(--ink-2)" strokeWidth="1.5" fill="none" markerEnd="url(#arrow)" className={flow} />
            <text x="622" y="150" fontFamily="var(--font-mono)" fontSize="10" fill="var(--mute)">
              onAttest
            </text>

            <path d="M350 230 V180" stroke="var(--ink-2)" strokeWidth="1.5" fill="none" markerEnd="url(#arrow)" className={flow} />
            <text x="358" y="212" fontFamily="var(--font-mono)" fontSize="10" fill="var(--mute)">
              hasCredential
            </text>

            <path d="M455 165 C 495 175, 505 95, 530 84" stroke="var(--cobalt)" strokeWidth="1.5" fill="none" strokeDasharray="3 5" markerEnd="url(#arrow)" className={inView ? "flow" : ""} />
            <text x="462" y="186" fontFamily="var(--font-mono)" fontSize="10" fill="var(--cobalt)">
              getAttestation
            </text>
          </svg>
        </div>
      </div>
    </section>
  );
}

function Node({
  x,
  y,
  w,
  title,
  sub,
  gate,
  dashed,
}: {
  x: number;
  y: number;
  w: number;
  title: string;
  sub: string;
  gate?: boolean;
  dashed?: boolean;
}) {
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={w}
        height={70}
        rx={10}
        fill={gate ? "var(--bad-soft)" : "var(--paper)"}
        stroke={gate ? "var(--bad)" : "var(--line-2)"}
        strokeWidth="1.2"
        strokeDasharray={dashed ? "4 4" : undefined}
      />
      <text x={x + 14} y={y + 30} fontFamily="var(--font-display)" fontSize="14" fontWeight={600} fill="var(--ink)">
        {title}
      </text>
      <text x={x + 14} y={y + 50} fontFamily="var(--font-mono)" fontSize="10.5" fill="var(--mute)">
        {sub}
      </text>
    </g>
  );
}
