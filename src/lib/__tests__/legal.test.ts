import { describe, it, expect } from "vitest";
import { LEGAL_DOCS, LEGAL_NAV } from "../legal";

describe("LEGAL_NAV", () => {
  it("includes all editorial trust pages", () => {
    const slugs = LEGAL_NAV.map((item) => item.to);
    expect(slugs).toContain("/legal/editorial-policy");
    expect(slugs).toContain("/legal/review-methodology");
    expect(slugs).toContain("/legal/how-we-test");
    expect(slugs).toContain("/legal/how-we-make-money");
    expect(slugs).toContain("/legal/corrections");
    expect(slugs).toContain("/legal/affiliate");
    expect(slugs).toContain("/legal/privacy");
    expect(slugs).toContain("/legal/terms");
  });

  it("editorial policy is listed before policies in nav", () => {
    const navLabels = LEGAL_NAV.map((item) => item.label);
    const editorialIdx = navLabels.indexOf("Editorial Policy");
    const privacyIdx = navLabels.indexOf("Privacy Policy");
    expect(editorialIdx).toBeLessThan(privacyIdx);
  });

  it("every nav item has a corresponding document", () => {
    for (const item of LEGAL_NAV) {
      const slug = item.to.replace("/legal/", "");
      expect(LEGAL_DOCS[slug.replace(/-/g, "_")] || LEGAL_DOCS[slug]).toBeDefined();
    }
  });
});

describe("LEGAL_DOCS", () => {
  it("contains all required editorial trust documents", () => {
    expect(LEGAL_DOCS.editorial_policy).toBeDefined();
    expect(LEGAL_DOCS.review_methodology).toBeDefined();
    expect(LEGAL_DOCS.how_we_test).toBeDefined();
    expect(LEGAL_DOCS.how_we_make_money).toBeDefined();
    expect(LEGAL_DOCS.corrections).toBeDefined();
  });

  it("every document has required fields", () => {
    for (const [, doc] of Object.entries(LEGAL_DOCS)) {
      expect(doc.slug).toBeTruthy();
      expect(doc.title).toBeTruthy();
      expect(doc.intro).toBeTruthy();
      expect(doc.updated).toBeTruthy();
      expect(Array.isArray(doc.sections)).toBe(true);
      expect(doc.sections.length).toBeGreaterThan(0);
    }
  });

  it("every section has a heading and body", () => {
    for (const doc of Object.values(LEGAL_DOCS)) {
      for (const section of doc.sections) {
        expect(typeof section.heading).toBe("string");
        expect(section.heading.length).toBeGreaterThan(0);
        expect(Array.isArray(section.body)).toBe(true);
        expect(section.body.length).toBeGreaterThan(0);
        for (const paragraph of section.body) {
          expect(typeof paragraph).toBe("string");
          expect(paragraph.length).toBeGreaterThan(10);
        }
      }
    }
  });

  it("editorial policy has editorial independence section", () => {
    const doc = LEGAL_DOCS.editorial_policy;
    const hasIndependence = doc.sections.some((s) =>
      s.heading.toLowerCase().includes("independence")
    );
    expect(hasIndependence).toBe(true);
  });

  it("review methodology describes scoring system", () => {
    const doc = LEGAL_DOCS.review_methodology;
    const hasScoring = doc.sections.some((s) =>
      s.heading.toLowerCase().includes("scoring") || s.body.some((b) => b.includes("rating"))
    );
    expect(hasScoring).toBe(true);
  });

  it("how-we-make-money explains affiliate commissions", () => {
    const doc = LEGAL_DOCS.how_we_make_money;
    const hasCommissions = doc.sections.some((s) =>
      s.body.some((b) => b.toLowerCase().includes("commission"))
    );
    expect(hasCommissions).toBe(true);
  });

  it("corrections policy has reporting process", () => {
    const doc = LEGAL_DOCS.corrections;
    const hasReporting = doc.sections.some((s) =>
      s.heading.toLowerCase().includes("reporting") || s.heading.toLowerCase().includes("process")
    );
    expect(hasReporting).toBe(true);
  });

  it("all documents have unique slugs", () => {
    const slugs = Object.values(LEGAL_DOCS).map((d) => d.slug);
    const uniqueSlugs = new Set(slugs);
    expect(uniqueSlugs.size).toBe(slugs.length);
  });

  it("every slug matches its key pattern", () => {
    const slugs = Object.values(LEGAL_DOCS).map((d) => d.slug);
    for (const slug of slugs) {
      expect(slug).toMatch(/^[a-z0-9-]+$/);
    }
  });

  it("dates are formatted correctly", () => {
    for (const doc of Object.values(LEGAL_DOCS)) {
      expect(doc.updated).toMatch(/^(January|February|March|April|May|June|July|August|September|October|November|December) \d{4}$/);
    }
  });
});

describe("Editorial trust content quality", () => {
  it("editorial policy contains detailed sections", () => {
    expect(LEGAL_DOCS.editorial_policy.sections.length).toBeGreaterThanOrEqual(4);
  });

  it("review methodology is comprehensive", () => {
    expect(LEGAL_DOCS.review_methodology.sections.length).toBeGreaterThanOrEqual(4);
  });

  it("how we test has category-specific content", () => {
    const doc = LEGAL_DOCS.how_we_test;
    const hasTech = doc.sections.some((s) =>
      s.heading.toLowerCase().includes("tech") || s.body.some((b) => b.includes("tech"))
    );
    const hasBeauty = doc.sections.some((s) =>
      s.heading.toLowerCase().includes("beauty")
    );
    expect(hasTech || hasBeauty).toBe(true);
  });
});
