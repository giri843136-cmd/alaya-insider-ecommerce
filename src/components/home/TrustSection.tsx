import { ShieldCheck, RefreshCw, Headphones, Eye, CreditCard, Truck, Award, Lock } from "lucide-react";
import { Reveal } from "../Reveal";
import { useStore } from "../../context/StoreContext";

const TRUST = [
  { icon: ShieldCheck, title: "Trusted recommendations", text: "Every pick is editor-vetted, never paid placement" },
  { icon: RefreshCw, title: "30-day returns", text: "Merchant-backed returns on eligible purchases" },
  { icon: Headphones, title: "Real human support", text: "Care team replies within a day" },
  { icon: Eye, title: "Affiliate transparency", text: "Always clearly labelled, never hidden" },
  { icon: Award, title: "Trusted brands", text: "Curated makers, vetted by editors" },
  { icon: Truck, title: "Worldwide shipping", text: "Free over $150, to 9 countries" },
  { icon: CreditCard, title: "Flexible payments", text: "Cards, Apple Pay, Google Pay & more" },
  { icon: Lock, title: "Privacy first", text: "Your data is never sold, ever" },
];

export function TrustSection() {
  const { settings } = useStore();
  return (
    <section className="container-edge py-20">
      <Reveal>
        <div className="mx-auto max-w-2xl text-center">
          <span className="eyebrow mb-3">Why trust our picks</span>
          <h2 className="text-display-m text-ink">Recommendations you can rely on</h2>
          <p className="mt-3 text-muted">
            Every detail of {settings.storeName} is designed around editorial integrity — from honest reviews to transparent affiliate partnerships.
          </p>
        </div>
      </Reveal>
      <div className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {TRUST.map((t, i) => (
          <Reveal key={t.title} delay={(i % 4) * 60}>
            <div className="card flex h-full flex-col items-center p-6 text-center">
              <span className="grid h-12 w-12 place-items-center rounded-full bg-accent-soft text-accent">
                <t.icon className="h-6 w-6" />
              </span>
              <h3 className="mt-4 text-sm font-semibold text-ink">{t.title}</h3>
              <p className="mt-1.5 text-xs text-muted">{t.text}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
