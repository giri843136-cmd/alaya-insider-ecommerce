/**
 * ALAYA INSIDER — lightweight, dependency-free SVG charts for the BI dashboard.
 * No external charting library; renders crisp, interactive, responsive charts.
 */

interface Point {
  label: string;
  value: number;
}

/** Smooth area + line chart for revenue/trends. */
export function AreaChart({ data, height = 180, color = "var(--c-accent)" }: { data: Point[]; height?: number; color?: string }) {
  const width = 600;
  const pad = { top: 12, right: 8, bottom: 24, left: 8 };
  const w = width - pad.left - pad.right;
  const h = height - pad.top - pad.bottom;
  const max = Math.max(1, ...data.map((d) => d.value));
  const step = data.length > 1 ? w / (data.length - 1) : w;

  const points = data.map((d, i) => ({
    x: pad.left + i * step,
    y: pad.top + h - (d.value / max) * h,
    ...d,
  }));

  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ");
  const areaPath = `${linePath} L ${points[points.length - 1].x.toFixed(1)} ${pad.top + h} L ${points[0].x.toFixed(1)} ${pad.top + h} Z`;
  const gid = `area-${Math.random().toString(36).slice(2, 8)}`;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full" preserveAspectRatio="none" style={{ height }}>
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.28" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#${gid})`} />
      <path d={linePath} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {points.map((p, i) => (
        <g key={i} className="group">
          <circle cx={p.x} cy={p.y} r="3.5" fill={color} className="opacity-0 transition-opacity group-hover:opacity-100" />
          <title>{`${p.label}: ${p.value.toLocaleString()}`}</title>
        </g>
      ))}
    </svg>
  );
}

/** Vertical bar chart. */
export function BarChart({ data, height = 180, color = "var(--c-accent)" }: { data: Point[]; height?: number; color?: string }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div className="flex items-end gap-2" style={{ height }}>
      {data.map((d) => (
        <div key={d.label} className="group flex flex-1 flex-col items-center justify-end" title={`${d.label}: ${d.value.toLocaleString()}`}>
          <div
            className="w-full max-w-[2.5rem] rounded-t-md transition-all duration-500 group-hover:brightness-110"
            style={{ height: `${(d.value / max) * (height - 28)}px`, background: color, minHeight: 4 }}
          />
          <span className="mt-2 truncate text-[0.6rem] text-muted">{d.label}</span>
        </div>
      ))}
    </div>
  );
}

/** Horizontal bar list (for rankings: top products, brands, etc). */
export function RankList({ data, format }: { data: Point[]; format?: (n: number) => string }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <ul className="space-y-2.5">
      {data.map((d, i) => (
        <li key={d.label} className="group">
          <div className="mb-1 flex items-center justify-between text-xs">
            <span className="flex items-center gap-2 truncate text-ink">
              <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-surface2 text-[0.6rem] font-bold text-muted">{i + 1}</span>
              {d.label}
            </span>
            <span className="shrink-0 font-medium text-ink">{format ? format(d.value) : d.value.toLocaleString()}</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-surface2">
            <div className="h-full rounded-full bg-accent transition-all duration-700 group-hover:brightness-110" style={{ width: `${(d.value / max) * 100}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}

/** Donut chart for distributions (traffic sources, devices, status). */
export function DonutChart({ data, size = 160 }: { data: { label: string; value: number; color: string }[]; size?: number }) {
  const total = Math.max(1, data.reduce((s, d) => s + d.value, 0));
  const radius = size / 2 - 12;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0">
        <circle cx={cx} cy={cy} r={radius} fill="none" stroke="var(--c-surface2)" strokeWidth="14" />
        {data.map((d) => {
          const pct = d.value / total;
          const dash = pct * circumference;
          const seg = (
            <circle
              key={d.label}
              cx={cx}
              cy={cy}
              r={radius}
              fill="none"
              stroke={d.color}
              strokeWidth="14"
              strokeDasharray={`${dash} ${circumference - dash}`}
              strokeDashoffset={-offset}
              transform={`rotate(-90 ${cx} ${cy})`}
              className="transition-all duration-500"
            >
              <title>{`${d.label}: ${d.value.toLocaleString()} (${Math.round(pct * 100)}%)`}</title>
            </circle>
          );
          offset += dash;
          return seg;
        })}
        <text x={cx} y={cy - 4} textAnchor="middle" className="fill-ink font-display text-lg font-semibold">{total.toLocaleString()}</text>
        <text x={cx} y={cy + 14} textAnchor="middle" className="fill-muted text-[0.6rem]">total</text>
      </svg>
      <ul className="grid w-full grid-cols-2 gap-2 sm:grid-cols-1">
        {data.map((d) => (
          <li key={d.label} className="flex items-center gap-2 text-xs">
            <span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ background: d.color }} />
            <span className="flex-1 truncate text-muted">{d.label}</span>
            <span className="font-medium text-ink">{Math.round((d.value / total) * 100)}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
