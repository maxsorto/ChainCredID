"use client";

import { useTyped } from "./motion";

export type TermLine = {
  /** Step at which this line appears. */
  at: number;
  /** Text to render. Prompt lines type out; result lines appear at once. */
  text: string;
  kind?: "prompt" | "out" | "ok" | "bad" | "warn" | "mute" | "event";
};

export function Terminal({
  title,
  lines,
  step,
  className = "",
}: {
  title: string;
  lines: TermLine[];
  step: number;
  className?: string;
}) {
  const visible = lines.filter((l) => l.at <= step);
  const lastPromptIdx = visible.reduce((acc, l, i) => (l.kind === "prompt" ? i : acc), -1);
  return (
    <div className={`term overflow-hidden ${className}`}>
      <div className="flex items-center gap-2 border-b border-white/10 px-3 py-2 text-[11px] text-terminal-mute">
        <span className="inline-block size-2 rounded-full bg-white/20" />
        <span className="inline-block size-2 rounded-full bg-white/20" />
        <span className="inline-block size-2 rounded-full bg-white/20" />
        <span className="ml-2">{title}</span>
      </div>
      <div className="min-h-[9.5rem] space-y-0.5 px-3.5 py-3">
        {visible.map((l, i) => (
          <Line key={`${l.at}-${i}`} line={l} live={i === lastPromptIdx && l.at === step} />
        ))}
        {visible.length === 0 && <span className="caret" />}
      </div>
    </div>
  );
}

function Line({ line, live }: { line: TermLine; live: boolean }) {
  const isPrompt = line.kind === "prompt";
  const { shown, typing } = useTyped(line.text, 70);
  const text = isPrompt ? shown : line.text;
  const cls =
    line.kind === "ok"
      ? "ok"
      : line.kind === "bad"
        ? "bad"
        : line.kind === "warn"
          ? "warn"
          : line.kind === "mute" || line.kind === "event"
            ? "m"
            : "";
  return (
    <div className={`whitespace-pre-wrap break-words ${cls}`}>
      {isPrompt && <span className="m">$ </span>}
      {line.kind === "event" && <span className="m">event </span>}
      {text}
      {isPrompt && (typing || live) && <span className="caret" />}
    </div>
  );
}
