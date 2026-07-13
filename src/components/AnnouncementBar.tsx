import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { useStore } from "../context/StoreContext";

/** A single rotating announcement with optional live countdown. */
function Countdown({ endsAt }: { endsAt: number }) {
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
  return (
    <span className="ml-2 inline-flex items-center gap-0.5 font-mono text-[0.7rem] tabular-nums">
      {pad(h)}:{pad(m)}:{pad(s)}
    </span>
  );
}

export function AnnouncementBar() {
  const { settings } = useStore();
  const { announcement, announcements } = settings;

  const items = announcements?.length
    ? announcements
    : announcement.enabled
      ? [{ id: "single", text: announcement.text, link: announcement.link }]
      : [];

  const [i, setI] = useState(0);

  useEffect(() => {
    if (items.length <= 1) return;
    const t = setInterval(() => setI((p) => (p + 1) % items.length), 4000);
    return () => clearInterval(t);
  }, [items.length]);

  if (items.length === 0) return null;
  const item = items[i];

  const inner = (
    <span className="inline-flex items-center gap-2 text-[0.72rem] font-medium tracking-[0.12em]">
      <span className="h-1 w-1 rounded-full bg-accent" />
      {item.text}
      {item.endsAt && item.endsAt > Date.now() && <Countdown endsAt={item.endsAt} />}
      {item.link && <ChevronRight className="h-3.5 w-3.5" />}
    </span>
  );

  return (
    <div className="bg-ink text-canvas">
      <div className="container-edge flex h-9 items-center justify-center overflow-hidden py-2 text-center">
        <div key={item.id} className="animate-fade-in">{item.link ? (
          <Link to={item.link} className="transition-opacity hover:opacity-80">{inner}</Link>
        ) : inner}</div>
        {items.length > 1 && (
          <div className="absolute right-4 hidden items-center gap-1 sm:flex">
            {items.map((it, idx) => (
              <button
                key={it.id}
                onClick={() => setI(idx)}
                aria-label={`Announcement ${idx + 1}`}
                className={`h-1.5 rounded-full transition-all ${idx === i ? "w-4 bg-accent" : "w-1.5 bg-canvas/30"}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
