import { useState } from "react";
import { Mail, Phone, MapPin, Clock, Send, Check, MessageCircle } from "lucide-react";
import { useStore } from "../context/StoreContext";
import { useToast } from "../context/ToastContext";
import { Seo } from "../components/Seo";
import { Reveal } from "../components/Reveal";
import { Breadcrumbs } from "../components/ui";
import { isEmail } from "../lib/utils";

export default function Contact() {
  const { settings } = useStore();
  const { toast } = useToast();
  const [form, setForm] = useState({ name: "", email: "", subject: "General enquiry", message: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [sent, setSent] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (form.name.trim().length < 2) errs.name = "Please enter your name.";
    if (!isEmail(form.email)) errs.email = "Enter a valid email.";
    if (form.message.trim().length < 10) errs.message = "Tell us a little more.";
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setSent(true);
    toast.success("Message sent", "We'll be in touch within one business day.");
    setForm({ name: "", email: "", subject: "General enquiry", message: "" });
  };

  const INFO = [
    { icon: Mail, label: "Email", value: settings.contactEmail, href: `mailto:${settings.contactEmail}` },
    { icon: Phone, label: "Phone", value: settings.contactPhone, href: `tel:${settings.contactPhone.replace(/\s/g, "")}` },
    { icon: MapPin, label: "Studios", value: settings.address },
    { icon: Clock, label: "Hours", value: "Mon–Fri · 9am–6pm (EST)" },
  ];

  return (
    <>
      <Seo title="Contact" description="Get in touch with the ALAYA INSIDER care team." path="/contact" />
      <div className="container-edge py-8">
        <Breadcrumbs items={[{ label: "Home", to: "/" }, { label: "Contact" }]} />
      </div>

      <section className="container-edge pb-24">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
          <Reveal>
            <span className="eyebrow mb-3">We'd love to hear from you</span>
            <h1 className="font-display text-4xl font-semibold text-ink sm:text-5xl text-balance">Let's talk.</h1>
            <p className="mt-4 max-w-md text-muted">Questions about an order, a product, or partnering with us? Our team is here to help.</p>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {INFO.map((it) => (
                <div key={it.label} className="card p-5">
                  <span className="grid h-10 w-10 place-items-center rounded-full bg-accent-soft text-accent"><it.icon className="h-5 w-5" /></span>
                  <p className="mt-3 text-xs font-semibold uppercase tracking-wider text-muted">{it.label}</p>
                  {it.href ? (
                    <a href={it.href} className="mt-0.5 block font-medium text-ink hover:text-accent">{it.value}</a>
                  ) : (
                    <p className="mt-0.5 font-medium text-ink">{it.value}</p>
                  )}
                </div>
              ))}
            </div>
          </Reveal>

          <Reveal delay={120}>
            {sent ? (
              <div className="card flex h-full flex-col items-center justify-center p-10 text-center">
                <span className="grid h-14 w-14 place-items-center rounded-full bg-success/15 text-success"><Check className="h-7 w-7" /></span>
                <h2 className="mt-4 text-xl font-semibold text-ink">Message received</h2>
                <p className="mt-2 text-sm text-muted">Thank you for reaching out. We'll reply to your email within one business day.</p>
                <button onClick={() => setSent(false)} className="btn-outline btn-md mt-6">Send another</button>
              </div>
            ) : (
              <form onSubmit={submit} noValidate className="card p-6 sm:p-8">
                <h2 className="flex items-center gap-2 text-lg font-semibold text-ink"><MessageCircle className="h-5 w-5 text-accent" /> Send a message</h2>
                <div className="mt-5 space-y-4">
                  <div>
                    <label className="label-field" htmlFor="c-name">Name</label>
                    <input id="c-name" className="input-field" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                    {errors.name && <p className="mt-1 text-xs text-danger">{errors.name}</p>}
                  </div>
                  <div>
                    <label className="label-field" htmlFor="c-email">Email</label>
                    <input id="c-email" type="email" className="input-field" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                    {errors.email && <p className="mt-1 text-xs text-danger">{errors.email}</p>}
                  </div>
                  <div>
                    <label className="label-field" htmlFor="c-subject">Subject</label>
                    <select id="c-subject" className="input-field" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })}>
                      <option>General enquiry</option>
                      <option>Order support</option>
                      <option>Returns & refunds</option>
                      <option>Affiliate partnership</option>
                      <option>Press</option>
                    </select>
                  </div>
                  <div>
                    <label className="label-field" htmlFor="c-message">Message</label>
                    <textarea id="c-message" rows={5} className="input-field resize-none" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
                    {errors.message && <p className="mt-1 text-xs text-danger">{errors.message}</p>}
                  </div>
                  <button type="submit" className="btn-primary btn-md w-full">Send message <Send className="h-4 w-4" /></button>
                </div>
              </form>
            )}
          </Reveal>
        </div>
      </section>
    </>
  );
}
