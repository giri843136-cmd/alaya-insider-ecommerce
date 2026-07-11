import { useMemo, useState } from "react";
import { ChevronDown, LifeBuoy } from "lucide-react";
import { useStore } from "../context/StoreContext";
import { Seo } from "../components/Seo";
import { Reveal } from "../components/Reveal";
import { Breadcrumbs } from "../components/ui";
import { cn } from "@/utils/cn";

interface QA {
  q: string;
  a: string;
}

const GROUPS: { title: string; items: QA[] }[] = [
  {
    title: "Orders & shipping",
    items: [
      { q: "How long does delivery take?", a: "Standard delivery arrives in 3–6 business days worldwide. Express options (1–2 days) are available at checkout in supported regions." },
      { q: "Do you ship internationally?", a: "Yes — we ship to the United States, Canada, the United Kingdom, Australia, India, Germany, France, Italy and Spain, with more regions arriving soon." },
      { q: "Is shipping free?", a: "Complimentary shipping is included on orders over $150. Below that, a flat rate applies. Digital guides are delivered instantly with no shipping fee." },
      { q: "Can I track my order?", a: "Absolutely. You'll receive a tracking link by email as soon as your order ships, and you can view status in your account." },
    ],
  },
  {
    title: "Returns & refunds",
    items: [
      { q: "What is your return policy?", a: "Physical items can be returned within 30 days of delivery for a full refund, provided they're unused and in original packaging." },
      { q: "Are digital products refundable?", a: "Due to their nature, digital guides and courses are non-refundable once downloaded. If something's wrong, contact us and we'll make it right." },
      { q: "How long do refunds take?", a: "Refunds are processed within 3–5 business days of us receiving your return, back to your original payment method." },
    ],
  },
  {
    title: "Account & wishlist",
    items: [
      { q: "Do I need an account to order?", a: "No — you can check out as a guest. Creating an account lets you track orders, save a wishlist and earn Insider rewards." },
      { q: "How does the wishlist work?", a: "Tap the heart on any product to save it. Your wishlist is stored on your device and synced when you create an account." },
      { q: "What are Insider rewards?", a: "Earn points on every order and redeem them for discounts on future purchases. The more you shop, the more you save." },
    ],
  },
  {
    title: "Affiliate program",
    items: [
      { q: "What are affiliate products?", a: "Some pieces are curated from our retail partners. We may earn a commission when you shop them — at no extra cost to you. They're always clearly labelled." },
      { q: "Can I become an ALAYA affiliate?", a: "Yes. Creators and publishers can apply to our affiliate program and earn commission on referred sales. Contact us to learn more." },
      { q: "Are affiliate links safe?", a: "They open directly on our partners' secure sites. We only partner with retailers we trust." },
    ],
  },
];

export default function FAQ() {
  const { settings } = useStore();
  const [open, setOpen] = useState<string>("");

  const schema = useMemo(
    () => ({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: GROUPS.flatMap((g) =>
        g.items.map((it) => ({
          "@type": "Question",
          name: it.q,
          acceptedAnswer: { "@type": "Answer", text: it.a },
        }))
      ),
    }),
    []
  );

  return (
    <>
      <Seo title="Help & FAQ" description="Answers to common questions about orders, shipping, returns, accounts and our affiliate program." path="/faq" schema={schema} />
      <div className="container-edge py-8">
        <Breadcrumbs items={[{ label: "Home", to: "/" }, { label: "Help & FAQ" }]} />
      </div>

      <section className="container-edge pb-24">
        <div className="mx-auto max-w-3xl">
          <Reveal>
            <span className="eyebrow mb-3">Help centre</span>
            <h1 className="font-display text-4xl font-semibold text-ink sm:text-5xl">How can we help?</h1>
            <p className="mt-4 text-muted">Everything you need to know about shopping with {settings.storeName}. Can't find an answer? <a href="/#/contact" className="text-accent hover:underline">Contact us</a>.</p>
          </Reveal>

          <div className="mt-10 space-y-10">
            {GROUPS.map((g) => (
              <Reveal key={g.title}>
                <h2 className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-accent">{g.title}</h2>
                <div className="divide-y divide-line rounded-[var(--radius-xl2)] border border-line bg-surface">
                  {g.items.map((it) => {
                    const id = `${g.title}-${it.q}`;
                    const isOpen = open === id;
                    return (
                      <div key={id}>
                        <button
                          onClick={() => setOpen(isOpen ? "" : id)}
                          aria-expanded={isOpen}
                          className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                        >
                          <span className="font-medium text-ink">{it.q}</span>
                          <ChevronDown className={cn("h-5 w-5 shrink-0 text-muted transition-transform", isOpen && "rotate-180")} />
                        </button>
                        {isOpen && <p className="px-5 pb-5 text-sm text-muted animate-fade-in">{it.a}</p>}
                      </div>
                    );
                  })}
                </div>
              </Reveal>
            ))}
          </div>

          <div className="mt-12 flex items-center gap-4 rounded-[var(--radius-xl2)] border border-line bg-surface2/50 p-6">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-accent-soft text-accent"><LifeBuoy className="h-6 w-6" /></span>
            <div>
              <p className="font-semibold text-ink">Still need a hand?</p>
              <p className="text-sm text-muted">Our care team replies within one business day.</p>
            </div>
            <a href={`mailto:${settings.contactEmail}`} className="btn-outline btn-sm ml-auto">Email us</a>
          </div>
        </div>
      </section>
    </>
  );
}
