import { useMemo, useState } from "react";
import { Truck, Zap, Calculator } from "lucide-react";
import { useStore } from "../../context/StoreContext";
import { COUNTRY_OPTIONS, formatPrice } from "../../lib/utils";
import { cn } from "@/utils/cn";

/** Estimates shipping cost + delivery dates based on destination and product. */
export function ShippingCalculator({ price, weightKg = 0.5 }: { price: number; weightKg?: number }) {
  const { settings } = useStore();
  const [country, setCountry] = useState("United States");
  const [zip, setZip] = useState("");
  const [show, setShow] = useState(false);

  const estimates = useMemo(() => {
    const isDigital = weightKg === 0;
    const freeShip = price >= settings.shipping.freeOver;
    const standard = freeShip ? 0 : settings.shipping.flatRate + Math.round(weightKg * 2);
    const express = freeShip ? 12 : 25 + Math.round(weightKg * 4);
    const base = new Date();
    const std = new Date(base.getTime() + (3 + (country === "United States" ? 0 : 2)) * 86400000);
    const exp = new Date(base.getTime() + (country === "United States" ? 1 : 2) * 86400000);
    const fmt = (d: Date) => d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
    return {
      standard,
      express,
      stdDate: fmt(std),
      expDate: fmt(exp),
      isDigital,
      location: zip ? `${zip}, ${country}` : country,
    };
  }, [country, zip, price, weightKg, settings.shipping.freeOver, settings.shipping.flatRate]);

  return (
    <div className="rounded-xl border border-line bg-surface2/40 p-4">
      <button onClick={() => setShow((s) => !s)} className="flex w-full items-center justify-between gap-2 text-left">
        <span className="flex items-center gap-2 text-sm font-semibold text-ink"><Calculator className="h-4 w-4 text-accent" /> Estimate delivery</span>
        <span className="text-xs text-muted">{show ? "Hide" : "Calculate"}</span>
      </button>

      {show && (
        <div className="mt-4 animate-fade-in">
          <div className="grid grid-cols-2 gap-3">
            <select value={country} onChange={(e) => setCountry(e.target.value)} className="input-field !py-2.5 text-sm" aria-label="Country">
              {COUNTRY_OPTIONS.map((c) => <option key={c}>{c}</option>)}
            </select>
            <input value={zip} onChange={(e) => setZip(e.target.value)} placeholder="Postal code" className="input-field !py-2.5 text-sm" aria-label="Postal code" />
          </div>

          {estimates.isDigital ? (
            <p className="mt-3 flex items-center gap-2 text-sm text-success"><Zap className="h-4 w-4" /> Instant digital delivery to your inbox</p>
          ) : (
            <div className="mt-3 space-y-2">
              <Option
                active
                icon={<Truck className="h-4 w-4" />}
                title="Standard"
                eta={estimates.stdDate}
                cost={estimates.standard === 0 ? "Free" : formatPrice(estimates.standard, settings.currency)}
              />
              <Option
                icon={<Zap className="h-4 w-4" />}
                title="Express"
                eta={estimates.expDate}
                cost={formatPrice(estimates.express, settings.currency)}
              />
              <p className="text-xs text-muted">Delivering to {estimates.location}. Duties may apply internationally.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Option({ active, icon, title, eta, cost }: { active?: boolean; icon: React.ReactNode; title: string; eta: string; cost: string }) {
  return (
    <div className={cn("flex items-center gap-3 rounded-lg border p-2.5", active ? "border-accent bg-accent-soft" : "border-line")}>
      <span className="grid h-8 w-8 place-items-center rounded-full bg-surface text-accent">{icon}</span>
      <div className="flex-1">
        <p className="text-sm font-medium text-ink">{title}</p>
        <p className="text-xs text-muted">Arrives by {eta}</p>
      </div>
      <span className="text-sm font-semibold text-ink">{cost}</span>
    </div>
  );
}
