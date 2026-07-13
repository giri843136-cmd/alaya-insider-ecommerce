import { useEffect, useState } from "react";

/** Compact HH:MM:SS countdown for promotional sections. */
export function CountdownBar({ endsAt }: { endsAt: number }) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const diff = Math.max(0, endsAt - now);
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  const pad = (n: number) => String(n).padStart(2, "0");
  const blocks = [pad(h), pad(m), pad(s)];

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs font-medium uppercase tracking-wider text-canvas/60">Ends in</span>
      <div className="flex items-center gap-1">
        {blocks.map((b, i) => (
          <span key={i} className="flex items-center gap-1">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-white/10 font-mono text-sm font-bold tabular-nums text-canvas">
              {b}
            </span>
            {i < blocks.length - 1 && <span className="text-canvas/50">:</span>}
          </span>
        ))}
      </div>
    </div>
  );
}
