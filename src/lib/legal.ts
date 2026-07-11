/**
 * ALAYA INSIDER — Legal / policy page content.
 * Centralised so policies are consistent and editable in one place.
 * (In production these render from the CMS / Admin; here they're typed copy.)
 */
export interface LegalSection {
  heading: string;
  body: string[];
}

export interface LegalDoc {
  slug: string;
  title: string;
  intro: string;
  updated: string;
  sections: LegalSection[];
}

export const LEGAL_DOCS: Record<string, LegalDoc> = {
  privacy: {
    slug: "privacy",
    title: "Privacy Policy",
    intro:
      "Your privacy matters to us. This policy explains what we collect, why, and the choices you have.",
    updated: "January 2026",
    sections: [
      { heading: "Information we collect", body: ["We collect information you provide directly — such as your name, email, shipping address and payment details at checkout — plus analytics data about how you use our site.", "For affiliate orders, the partner retailer processes your transaction on their own platform under their privacy policy."] },
      { heading: "How we use it", body: ["To fulfil orders, provide support, prevent fraud, and improve your shopping experience. We never sell your personal data."] },
      { heading: "Cookies", body: ["We use essential cookies for cart and session function, and optional analytics cookies you can accept or decline at any time."] },
      { heading: "Your rights", body: ["You may request access to, correction of, or deletion of your personal data by contacting care@alayainsider.com. EU/UK and California residents have additional statutory rights."] },
    ],
  },
  terms: {
    slug: "terms",
    title: "Terms of Service",
    intro: "By using ALAYA INSIDER you agree to these terms. Please read them carefully.",
    updated: "January 2026",
    sections: [
      { heading: "Using our site", body: ["You agree to use our site lawfully and not to misuse, reverse-engineer, or attempt to disrupt it. Accounts are personal and must not be shared."] },
      { heading: "Pricing & availability", body: ["We aim for accuracy in pricing and stock. Errors may occur; we reserve the right to correct them and to cancel orders where necessary, with a full refund."] },
      { heading: "Intellectual property", body: ["All content — imagery, copy and design — is owned by ALAYA INSIDER or licensed to us. You may not reproduce it without permission."] },
      { heading: "Liability", body: ["Our site is provided 'as is'. To the extent permitted by law, we are not liable for indirect or consequential losses arising from its use."] },
    ],
  },
  refund: {
    slug: "refund",
    title: "Refund Policy",
    intro: "We want you to love every piece. If something isn't right, here's how refunds work.",
    updated: "January 2026",
    sections: [
      { heading: "30-day returns", body: ["Physical products can be returned within 30 days of delivery for a full refund, provided they are unused and in original packaging."] },
      { heading: "Digital products", body: ["Digital guides and courses are non-refundable once downloaded, due to their nature. If a file is faulty, contact us for a replacement or refund."] },
      { heading: "Affiliate orders", body: ["Items purchased from our affiliate partners are subject to that retailer's own return policy. Refunds are handled directly by the partner."] },
      { heading: "Refund timing", body: ["Approved refunds are processed to your original payment method within 3–5 business days of us receiving the return."] },
    ],
  },
  shipping: {
    slug: "shipping",
    title: "Shipping Policy",
    intro: "We ship worldwide. Here's what to expect.",
    updated: "January 2026",
    sections: [
      { heading: "Delivery times", body: ["Standard delivery arrives in 3–6 business days. Express options (1–2 days) are available at checkout in supported regions."] },
      { heading: "Free shipping", body: ["Complimentary shipping is included on orders over $150. Below that, a flat rate applies. Digital guides are delivered instantly."] },
      { heading: "Regions", body: ["We currently ship to the US, Canada, UK, Australia, India, Germany, France, Italy and Spain, with more regions arriving soon."] },
      { heading: "Duties & taxes", body: ["International orders may incur import duties or taxes on delivery, determined by your local customs authority."] },
    ],
  },
  affiliate: {
    slug: "affiliate",
    title: "Affiliate Disclosure",
    intro: "Transparency is a core value. This disclosure explains our affiliate relationships.",
    updated: "January 2026",
    sections: [
      { heading: "How affiliate links work", body: ["Some products are curated from our retail partners. When you shop them via our links, we may earn a commission — at no additional cost to you."] },
      { heading: "Editorial independence", body: ["Commission never influences what we recommend. Our editors select products on merit; affiliate relationships simply help fund our work."] },
      { heading: "Labelling", body: ["Affiliate products are always clearly labelled across the site so you can make informed choices."] },
    ],
  },
  accessibility: {
    slug: "accessibility",
    title: "Accessibility Statement",
    intro: "We're committed to making ALAYA INSIDER usable by everyone.",
    updated: "January 2026",
    sections: [
      { heading: "Our commitment", body: ["We design to WCAG 2.2 AA, with semantic HTML, keyboard navigation, visible focus states, and respects for reduced-motion preferences."] },
      { heading: "Compatibility", body: ["Our site is tested across modern browsers and devices. If something isn't accessible to you, please tell us."] },
      { heading: "Feedback", body: ["Email care@alayainsider.com with any accessibility issues and we'll prioritise resolving them."] },
    ],
  },
  cookie: {
    slug: "cookie",
    title: "Cookie Policy",
    intro: "How and why we use cookies.",
    updated: "January 2026",
    sections: [
      { heading: "Essential cookies", body: ["Required for the cart, wishlist and secure session to function. These cannot be disabled."] },
      { heading: "Optional cookies", body: ["Analytics and preference cookies help us improve. You can accept or decline these at any time."] },
      { heading: "Managing cookies", body: ["You can clear cookies in your browser settings. Note this may reset your bag and preferences."] },
    ],
  },
};

export const LEGAL_NAV = [
  { to: "/legal/privacy", label: "Privacy Policy" },
  { to: "/legal/terms", label: "Terms of Service" },
  { to: "/legal/refund", label: "Refund Policy" },
  { to: "/legal/shipping", label: "Shipping Policy" },
  { to: "/legal/affiliate", label: "Affiliate Disclosure" },
  { to: "/legal/accessibility", label: "Accessibility Statement" },
  { to: "/legal/cookie", label: "Cookie Policy" },
];
