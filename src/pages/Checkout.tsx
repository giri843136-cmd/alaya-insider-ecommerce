import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, ArrowLeft, Check, Lock, Truck, Zap, ShieldCheck, PartyPopper, Tag, CreditCard } from "lucide-react";

const ORCHESTRATOR_API = "/api/v1/orchestrator";
import { useCommerce } from "../context/CommerceContext";
import { useStore } from "../context/StoreContext";
import { useToast } from "../context/ToastContext";
import { Seo } from "../components/Seo";
import { Money, EmptyState, Breadcrumbs } from "../components/ui";
import { COUNTRY_OPTIONS, formatPrice, isEmail } from "../lib/utils";
import { cn } from "@/utils/cn";
import type { Order } from "../lib/types";

type Step = 1 | 2 | 3;

interface FormState {
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  address: string;
  city: string;
  country: string;
  zip: string;
  shippingMethod: "standard" | "express";
  cardName: string;
  cardNumber: string;
  cardExpiry: string;
  cardCvc: string;
  gateway: string;
  notes: string;
  giftMessage: string;
}

const STEPS = ["Information", "Delivery & payment", "Review"];

export default function Checkout() {
  const { detailedLines, subtotal, clearCart } = useCommerce();
  const { settings, placeOrder, validateCoupon, gatewaysFor, resolveSupplier, screenFraud, sendEmail } = useStore();
  const { toast } = useToast();
  const [step, setStep] = useState<Step>(1);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [placed, setPlaced] = useState<Order | null>(null);
  const [couponInput, setCouponInput] = useState("");
  const [appliedCode, setAppliedCode] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>({
    email: "", firstName: "", lastName: "", phone: "", address: "", city: "",
    country: "United States", zip: "", shippingMethod: "standard",
    cardName: "", cardNumber: "", cardExpiry: "", cardCvc: "",
    gateway: "", notes: "", giftMessage: "",
  });

  const gateways = gatewaysFor(form.country);
  const [selectedGateway, setSelectedGateway] = useState<string>("");
  const activeGateway = gateways.find((g) => g.code === selectedGateway) ?? gateways[0];

  const set = (k: keyof FormState, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const hasPhysical = detailedLines.some((d) => d.product.type !== "digital");
  const expressFee = 25;
  const baseShipping = !hasPhysical ? 0 : subtotal >= settings.shipping.freeOver ? 0 : settings.shipping.flatRate;
  const shipping = form.shippingMethod === "express" && hasPhysical ? expressFee : baseShipping;
  const couponResult = settings.features.coupons && appliedCode ? validateCoupon(appliedCode, subtotal) : null;
  const discount = couponResult?.ok ? couponResult.discount : 0;
  const taxableBase = Math.max(0, subtotal - discount);
  const tax = taxableBase * settings.taxRate;
  const total = Math.max(0, subtotal - discount + shipping + tax);

  const applyCoupon = () => {
    if (!couponInput.trim()) return;
    const res = validateCoupon(couponInput.trim(), subtotal);
    if (res.ok) {
      setAppliedCode(res.coupon!.code);
      toast.success("Coupon applied", `${res.coupon!.code} saved you $${res.discount.toFixed(2)}.`);
    } else {
      setAppliedCode(null);
      toast.error("Couldn't apply coupon", res.message);
    }
  };
  const removeCoupon = () => {
    setAppliedCode(null);
    setCouponInput("");
  };

  const validateStep = (s: Step): boolean => {
    const e: Record<string, string> = {};
    if (s === 1) {
      if (!isEmail(form.email)) e.email = "Valid email required";
      if (form.firstName.trim().length < 2) e.firstName = "Required";
      if (form.lastName.trim().length < 2) e.lastName = "Required";
      if (hasPhysical) {
        if (form.address.trim().length < 4) e.address = "Required";
        if (form.city.trim().length < 2) e.city = "Required";
        if (form.zip.trim().length < 3) e.zip = "Required";
      }
    }
    if (s === 2 && subtotal > 0) {
      if (form.cardName.trim().length < 2) e.cardName = "Required";
      if (form.cardNumber.replace(/\s/g, "").length < 15) e.cardNumber = "Enter a valid card number";
      if (!/^\d{2}\s?\/\s?\d{2}$/.test(form.cardExpiry.replace(/\s/g, "")) && form.cardExpiry.length < 4) e.cardExpiry = "MM/YY";
      if (form.cardCvc.replace(/\s/g, "").length < 3) e.cardCvc = "CVC";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const next = () => {
    if (!validateStep(step)) return;
    setStep((s) => (s < 3 ? ((s + 1) as Step) : s));
  };
  const back = () => setStep((s) => (s > 1 ? ((s - 1) as Step) : s));

  const placeOrderNow = () => {
    if (!validateStep(2)) {
      setStep(2);
      return;
    }
    const order = placeOrder({
      items: detailedLines.map((dl) => ({
        productId: dl.product.id,
        name: dl.product.name,
        image: dl.product.images[0],
        variant: dl.line.variantLabel ? parseVariant(dl.line.variantLabel) : undefined,
        price: dl.unitPrice,
        qty: dl.line.qty,
      })),
      discount,
      shipping,
      tax,
      couponCode: couponResult?.ok ? couponResult.coupon!.code : undefined,
      couponId: couponResult?.ok ? couponResult.coupon!.id : undefined,
      paymentMethod: activeGateway?.name,
      notes: form.notes,
      giftMessage: form.giftMessage || undefined,
      customer: {
        name: `${form.firstName} ${form.lastName}`.trim(),
        email: form.email,
        phone: form.phone,
        address: form.address,
        city: form.city,
        country: form.country,
        zip: form.zip,
      },
    });
    // patch totals (placeOrder sets subtotal; add shipping+tax)
    // Auto-resolve supplier for dropshipping fulfilment
    const supplier = resolveSupplier(form.country);
    // Fraud screening
    const fraud = screenFraud({ email: form.email, total });
    // Fire automated emails (confirmation + supplier dispatch + admin notice)
    sendEmail("order_confirmation", form.email, order.number);
    if (supplier) sendEmail("supplier_dispatch", supplier.email, `${order.number} → ${supplier.name}`);
    sendEmail("admin_order_notice", settings.supportEmail, `${order.number} · ${form.email} · ${settings.currency.symbol}${total.toFixed(2)}`);
    if (fraud.flagged) sendEmail("fraud_review", settings.supportEmail, `${order.number} · ${fraud.reasons.join("; ")}`);

    setPlaced({
      ...order,
      shipping,
      tax,
      total,
      supplierId: supplier?.id,
      courier: supplier ? `${supplier.name}` : undefined,
      estimatedDelivery: supplier ? Date.now() + supplier.handlingDays * 86400000 + 4 * 86400000 : undefined,
    });
    // Trigger the order fulfillment saga via the Orchestrator (PR-6)
    fetch(`${ORCHESTRATOR_API}/fulfill/${order.id}?orderNumber=${encodeURIComponent(order.number)}`, { method: "POST" })
      .then(res => res.json())
      .then(result => {
        if (result.success) {
          console.log(`[Orchestrator] Fulfillment saga completed: ${result.completedSteps?.length} steps`);
        } else {
          console.warn(`[Orchestrator] Fulfillment saga compensated after: ${result.failedStep}`, result.error);
        }
      })
      .catch(err => {
        console.warn("[Orchestrator] Fulfillment trigger failed (async):", err);
      });

    if (fraud.flagged) {
      toast.error("Order under review", "Our team will verify your order shortly.");
    }
    clearCart();
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Confirmation screen
  if (placed) {
    return (
      <>
        <Seo title="Order confirmed" path="/checkout" />
        <div className="container-edge py-20">
          <div className="mx-auto max-w-xl text-center">
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-success/15 text-success animate-scale-in">
              <PartyPopper className="h-8 w-8" />
            </div>
            <h1 className="mt-6 font-display text-3xl font-semibold sm:text-4xl">Thank you, {placed.customer.name.split(" ")[0]}!</h1>
            <p className="mt-3 text-muted">Your order <span className="font-semibold text-ink">{placed.number}</span> is confirmed. A receipt is on its way to {placed.customer.email}.</p>

            <div className="card mt-8 p-6 text-left">
              <div className="flex items-center justify-between border-b border-line pb-4">
                <span className="text-sm text-muted">Order total</span>
                <span className="text-xl font-semibold"><Money amount={placed.total} /></span>
              </div>
              <ul className="mt-4 space-y-3">
                {placed.items.map((it) => (
                  <li key={it.productId} className="flex items-center gap-3">
                    <img src={it.image} alt="" className="h-14 w-12 rounded-lg object-cover" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-ink">{it.name}</p>
                      <p className="text-xs text-muted">Qty {it.qty}</p>
                    </div>
                    <span className="text-sm font-medium"><Money amount={it.price * it.qty} /></span>
                  </li>
                ))}
              </ul>
              <div className="mt-5 grid gap-2 border-t border-line pt-4 text-sm sm:grid-cols-2">
                <p className="flex items-center gap-2 text-muted"><Truck className="h-4 w-4 text-accent" /> {placed.shipping === 0 ? "Free delivery" : "Express delivery"}</p>
                <p className="flex items-center gap-2 text-muted"><ShieldCheck className="h-4 w-4 text-accent" /> Secure payment confirmed</p>
              </div>
            </div>

            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link to="/shop" className="btn-primary btn-md">Continue shopping <ArrowRight className="h-4 w-4" /></Link>
              <Link to={`/track-order`} className="btn-outline btn-md">Track this order</Link>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (detailedLines.length === 0) {
    return (
      <div className="container-edge py-20">
        <EmptyState
          icon={<Lock className="h-6 w-6" />}
          title="Nothing to check out"
          description="Your bag is empty — add a few pieces and come back."
          action={<Link to="/shop" className="btn-primary btn-md">Browse the edit</Link>}
        />
      </div>
    );
  }

  return (
    <>
      <Seo title="Checkout" path="/checkout" />
      <div className="container-edge py-8">
        <Breadcrumbs items={[{ label: "Home", to: "/" }, { label: "Bag", to: "/cart" }, { label: "Checkout" }]} />
      </div>

      <section className="container-edge pb-20">
        <h1 className="font-display text-4xl font-semibold text-ink sm:text-5xl">Checkout</h1>

        {/* Stepper */}
        <ol className="mt-8 flex items-center gap-2">
          {STEPS.map((label, i) => {
            const n = (i + 1) as Step;
            const done = step > n;
            const active = step === n;
            return (
              <li key={label} className="flex flex-1 items-center gap-2">
                <span className={cn("grid h-8 w-8 shrink-0 place-items-center rounded-full border text-sm font-semibold transition-colors",
                  done ? "border-accent bg-accent text-accent-ink" : active ? "border-accent text-accent" : "border-line text-muted")}>
                  {done ? <Check className="h-4 w-4" /> : n}
                </span>
                <span className={cn("hidden text-sm font-medium sm:block", active ? "text-ink" : "text-muted")}>{label}</span>
                {i < STEPS.length - 1 && <span className="ml-1 h-px flex-1 bg-line" />}
              </li>
            );
          })}
        </ol>

        <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_380px]">
          <div>
            {step === 1 && (
              <div className="space-y-5 animate-fade-in">
                <Field label="Email" error={errors.email}>
                  <input className="input-field" type="email" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="you@example.com" />
                </Field>
                <div className="grid gap-5 sm:grid-cols-2">
                  <Field label="First name" error={errors.firstName}><input className="input-field" value={form.firstName} onChange={(e) => set("firstName", e.target.value)} /></Field>
                  <Field label="Last name" error={errors.lastName}><input className="input-field" value={form.lastName} onChange={(e) => set("lastName", e.target.value)} /></Field>
                </div>
                <Field label="Phone (optional)"><input className="input-field" value={form.phone} onChange={(e) => set("phone", e.target.value)} /></Field>
                {hasPhysical && (
                  <>
                    <Field label="Address" error={errors.address}><input className="input-field" value={form.address} onChange={(e) => set("address", e.target.value)} /></Field>
                    <div className="grid gap-5 sm:grid-cols-2">
                      <Field label="City" error={errors.city}><input className="input-field" value={form.city} onChange={(e) => set("city", e.target.value)} /></Field>
                      <Field label="Postal code" error={errors.zip}><input className="input-field" value={form.zip} onChange={(e) => set("zip", e.target.value)} /></Field>
                    </div>
                    <Field label="Country">
                      <select className="input-field" value={form.country} onChange={(e) => set("country", e.target.value)}>
                        {COUNTRY_OPTIONS.map((c) => <option key={c}>{c}</option>)}
                      </select>
                    </Field>
                  </>
                )}
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6 animate-fade-in">
                <div>
                  <p className="label-field">Delivery method</p>
                  <div className="space-y-3">
                    <OptionCard
                      active={form.shippingMethod === "standard"}
                      onClick={() => set("shippingMethod", "standard")}
                      icon={<Truck className="h-5 w-5" />}
                      title="Standard delivery"
                      desc="3–6 business days"
                      price={baseShipping === 0 ? "Free" : formatPrice(baseShipping, settings.currency)}
                    />
                    {hasPhysical && (
                      <OptionCard
                        active={form.shippingMethod === "express"}
                        onClick={() => set("shippingMethod", "express")}
                        icon={<Zap className="h-5 w-5" />}
                        title="Express delivery"
                        desc="1–2 business days"
                        price={formatPrice(expressFee, settings.currency)}
                      />
                    )}
                  </div>
                </div>

                {/* Payment method */}
                <div>
                  <p className="label-field">Payment method</p>
                  <div className="flex flex-wrap gap-2">
                    {gateways.map((g) => (
                      <button
                        key={g.id}
                        type="button"
                        onClick={() => setSelectedGateway(g.code)}
                        className={cn(
                          "flex items-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-medium transition-all",
                          activeGateway?.code === g.code ? "border-accent bg-accent-soft text-accent" : "border-line text-ink hover:border-accent"
                        )}
                      >
                        <CreditCard className="h-4 w-4" />
                        {g.name}
                        {g.mode === "sandbox" && <span className="badge bg-warning/15 text-warning">Test</span>}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Order notes + gift */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Order notes (optional)"><input className="input-field" value={form.notes} onChange={(e) => set("notes", e.target.value)} placeholder="Delivery instructions…" /></Field>
                  <Field label="Gift message (optional)"><input className="input-field" value={form.giftMessage} onChange={(e) => set("giftMessage", e.target.value)} placeholder="Add a handwritten note…" /></Field>
                </div>

                <div className="rounded-xl border border-line bg-surface p-5">
                  <p className="flex items-center gap-2 text-sm font-semibold text-ink"><Lock className="h-4 w-4 text-accent" /> Payment details</p>
                  <p className="mt-1 text-xs text-muted">Encrypted & secure. This is a demonstration checkout — no real charge is made.</p>
                  <div className="mt-4 space-y-4">
                    <Field label="Name on card" error={errors.cardName}><input className="input-field" value={form.cardName} onChange={(e) => set("cardName", e.target.value)} /></Field>
                    <Field label="Card number" error={errors.cardNumber}><input className="input-field" inputMode="numeric" value={form.cardNumber} onChange={(e) => set("cardNumber", formatCard(e.target.value))} placeholder="4242 4242 4242 4242" /></Field>
                    <div className="grid grid-cols-2 gap-4">
                      <Field label="Expiry" error={errors.cardExpiry}><input className="input-field" value={form.cardExpiry} onChange={(e) => set("cardExpiry", formatExpiry(e.target.value))} placeholder="MM/YY" /></Field>
                      <Field label="CVC" error={errors.cardCvc}><input className="input-field" inputMode="numeric" value={form.cardCvc} onChange={(e) => set("cardCvc", e.target.value.replace(/\D/g, "").slice(0, 4))} placeholder="123" /></Field>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6 animate-fade-in">
                <div className="card p-5">
                  <h3 className="text-sm font-semibold text-ink">Contact & delivery</h3>
                  <p className="mt-2 text-sm text-muted">{form.firstName} {form.lastName} · {form.email}</p>
                  {hasPhysical && <p className="text-sm text-muted">{form.address}, {form.city}, {form.zip}, {form.country}</p>}
                </div>
                <div className="card p-5">
                  <h3 className="text-sm font-semibold text-ink">Items ({detailedLines.length})</h3>
                  <ul className="mt-3 space-y-3">
                    {detailedLines.map((dl) => (
                      <li key={dl.key} className="flex items-center gap-3">
                        <img src={dl.product.images[0]} alt="" className="h-12 w-10 rounded-lg object-cover" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-ink">{dl.product.name}</p>
                          <p className="text-xs text-muted">Qty {dl.line.qty}{dl.line.variantLabel ? ` · ${dl.line.variantLabel}` : ""}</p>
                        </div>
                        <span className="text-sm font-medium"><Money amount={dl.lineTotal} /></span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* Nav */}
            <div className="mt-8 flex items-center justify-between">
              {step > 1 ? (
                <button onClick={back} className="btn-ghost btn-md"><ArrowLeft className="h-4 w-4" /> Back</button>
              ) : (
                <Link to="/cart" className="btn-ghost btn-md"><ArrowLeft className="h-4 w-4" /> Back to bag</Link>
              )}
              {step < 3 ? (
                <button onClick={next} className="btn-primary btn-md">Continue <ArrowRight className="h-4 w-4" /></button>
              ) : (
                <button onClick={placeOrderNow} className="btn-primary btn-lg">Pay <Money amount={total} /></button>
              )}
            </div>
          </div>

          {/* Summary */}
          <aside className="lg:sticky lg:top-28 lg:self-start">
            <div className="card p-6">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted">Summary</h2>

              {settings.features.coupons && (
                <div className="mt-4">
                  {couponResult?.ok ? (
                    <div className="flex items-center justify-between rounded-xl bg-success/10 px-3 py-2.5">
                      <span className="flex items-center gap-2 text-sm font-medium text-success"><Tag className="h-4 w-4" /> {appliedCode}</span>
                      <button onClick={removeCoupon} className="text-xs text-muted hover:text-danger">Remove</button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <input value={couponInput} onChange={(e) => setCouponInput(e.target.value)} placeholder="Promo code" className="input-field" />
                      <button onClick={applyCoupon} className="btn-outline btn-md shrink-0">Apply</button>
                    </div>
                  )}
                  <p className="mt-1.5 text-xs text-muted">Try <button onClick={() => { setCouponInput("WELCOME10"); }} className="font-medium text-accent">WELCOME10</button> for 10% off.</p>
                </div>
              )}

              <dl className="mt-4 space-y-3 text-sm">
                <div className="flex justify-between"><dt className="text-muted">Subtotal</dt><dd className="font-medium"><Money amount={subtotal} /></dd></div>
                {discount > 0 && <div className="flex justify-between"><dt className="text-success">Discount</dt><dd className="font-medium text-success">−<Money amount={discount} /></dd></div>}
                <div className="flex justify-between"><dt className="text-muted">Shipping</dt><dd className="font-medium">{shipping === 0 ? "Free" : <Money amount={shipping} />}</dd></div>
                <div className="flex justify-between"><dt className="text-muted">Tax</dt><dd className="font-medium"><Money amount={tax} /></dd></div>
                <div className="flex justify-between border-t border-line pt-3 text-base"><dt className="font-semibold">Total</dt><dd className="font-semibold"><Money amount={total} /></dd></div>
              </dl>
              <p className="mt-4 flex items-center gap-1.5 text-xs text-muted"><Lock className="h-3.5 w-3.5" /> 256-bit SSL encrypted</p>
            </div>
          </aside>
        </div>
      </section>
    </>
  );
}

function parseVariant(label: string): Record<string, string> {
  const out: Record<string, string> = {};
  label.split(" · ").forEach((pair) => {
    const [k, v] = pair.split(": ");
    if (k && v) out[k.trim()] = v.trim();
  });
  return out;
}

function formatCard(v: string) {
  return v.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim();
}
function formatExpiry(v: string) {
  const d = v.replace(/\D/g, "").slice(0, 4);
  return d.length >= 3 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="label-field">{label}</label>
      {children}
      {error && <p className="mt-1 text-xs text-danger">{error}</p>}
    </div>
  );
}

function OptionCard({ active, onClick, icon, title, desc, price }: { active: boolean; onClick: () => void; icon: React.ReactNode; title: string; desc: string; price: string }) {
  return (
    <button onClick={onClick} className={cn("flex w-full items-center gap-3 rounded-xl border p-4 text-left transition-all", active ? "border-accent bg-accent-soft" : "border-line hover:border-accent")}>
      <span className={cn("grid h-10 w-10 place-items-center rounded-full", active ? "bg-accent text-accent-ink" : "bg-surface2 text-ink")}>{icon}</span>
      <span className="flex-1">
        <span className="block text-sm font-semibold text-ink">{title}</span>
        <span className="block text-xs text-muted">{desc}</span>
      </span>
      <span className="text-sm font-semibold text-ink">{price}</span>
      <span className={cn("grid h-5 w-5 place-items-center rounded-full border", active ? "border-accent bg-accent text-accent-ink" : "border-line")}>{active && <Check className="h-3 w-3" />}</span>
    </button>
  );
}
