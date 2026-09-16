"use client";

import type { ReactNode } from "react";

/**
 * Frame for one concrete example: a short brief on the left, the animated stage on the right.
 * `index` is the credential type the scene demonstrates, not a step number.
 */
export function Scene({
  stageRef,
  credential,
  title,
  brief,
  detail,
  onReplay,
  done,
  children,
}: {
  stageRef: React.RefObject<HTMLDivElement | null>;
  credential: string;
  title: string;
  brief: ReactNode;
  detail?: ReactNode;
  onReplay: () => void;
  done: boolean;
  children: ReactNode;
}) {
  return (
    <section className="grid gap-8 py-14 md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] md:gap-12 [&>*]:min-w-0">
      <div className="max-w-md">
        <p className="eyebrow">{credential}</p>
        <h3 className="mt-3 text-2xl font-semibold leading-tight md:text-[1.75rem]">{title}</h3>
        <p className="mt-4 text-[15px] leading-relaxed text-ink-2">{brief}</p>
        {detail && <p className="mt-3 text-sm leading-relaxed text-mute">{detail}</p>}
        <button
          type="button"
          onClick={onReplay}
          className="mt-6 inline-flex items-center gap-2 rounded-md border border-line-2 px-3 py-1.5 font-mono text-xs text-ink-2 transition hover:border-ink hover:text-ink"
        >
          <span aria-hidden>↻</span> {done ? "Replay" : "Restart"}
        </button>
      </div>
      <div ref={stageRef} className="min-w-0">
        {children}
      </div>
    </section>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-xl border border-line bg-panel p-4 shadow-[0_1px_0_rgba(15,22,38,0.04)] ${className}`}>{children}</div>;
}

export const SUBJECT = "0x7099…79C8";
export const SUBJECT_FULL = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8";
export const UID_1 = "0x7a4c…6690";
export const UID_2 = "0x3e91…b2d4";
