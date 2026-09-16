"use client";

/**
 * The attestation seal. A credential that is active gets stamped; a revoked one keeps the seal
 * but takes a strike; an expired one fades to amber with a broken ring. One motif, three truths.
 */
export type SealState = "none" | "active" | "revoked" | "expired";

export function Seal({
  state,
  label = "ATTESTED",
  size = 112,
  className = "",
}: {
  state: SealState;
  label?: string;
  size?: number;
  className?: string;
}) {
  if (state === "none") return <div style={{ width: size, height: size }} className={className} aria-hidden />;
  const color = state === "active" ? "var(--ok)" : state === "revoked" ? "var(--bad)" : "var(--warn)";
  const ring = state === "expired" ? "6 5" : undefined;
  const text = `${label} · EAS · CHAINCREDID ·`;
  return (
    <div
      className={`seal-in relative ${className}`}
      style={{ width: size, height: size, color }}
      role="img"
      aria-label={`${label.toLowerCase()} ${state}`}
    >
      <svg viewBox="0 0 120 120" width={size} height={size} className="block">
        <defs>
          <path id="sealPath" d="M60,60 m-44,0 a44,44 0 1,1 88,0 a44,44 0 1,1 -88,0" />
        </defs>
        <circle cx="60" cy="60" r="56" fill="none" stroke="currentColor" strokeWidth="2.5" strokeDasharray={ring} />
        <circle cx="60" cy="60" r="34" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.8" />
        <text fontFamily="var(--font-mono)" fontSize="9.5" letterSpacing="1.6" fill="currentColor" fontWeight={500}>
          <textPath href="#sealPath" startOffset="0" textLength="274" lengthAdjust="spacing">
            {text}
          </textPath>
        </text>
        {state === "active" && (
          <path
            d="M44 61 l11 11 l22 -24"
            fill="none"
            stroke="currentColor"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}
        {state === "expired" && (
          <g fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round">
            <circle cx="60" cy="60" r="14" strokeWidth="2.5" />
            <path d="M60 50 v10 l7 5" />
          </g>
        )}
        {state === "revoked" && (
          <path d="M48 48 l24 24 M72 48 l-24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
        )}
      </svg>
      {state === "revoked" && (
        <div
          aria-hidden
          className="strike-in absolute left-[-6%] top-1/2 h-[9%] w-[112%] rounded-sm"
          style={{ background: "var(--bad)", opacity: 0.9 }}
        />
      )}
    </div>
  );
}

/** Small inline status chip that mirrors the seal color language. */
export function Status({ state }: { state: SealState | "loading" }) {
  const map = {
    loading: ["bg-line text-ink-2", "reading"],
    none: ["bg-line text-ink-2", "not issued"],
    active: ["bg-ok-soft text-ok", "active"],
    revoked: ["bg-bad-soft text-bad", "revoked"],
    expired: ["bg-warn-soft text-warn", "expired"],
  } as const;
  const [cls, label] = map[state];
  return (
    <span className={`rounded px-1.5 py-0.5 font-mono text-[10px] font-medium uppercase tracking-wider ${cls}`}>
      {label}
    </span>
  );
}
