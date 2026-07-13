import { createContext, useCallback, useContext, useMemo, type ReactNode } from "react";
import { useLocalStorage } from "../lib/hooks";
import type { Language } from "../lib/types";

/**
 * Lightweight internationalization layer.
 * Demonstrates a multi-language architecture: add a language by extending LANGUAGES
 * and the dictionary. Consumer strings resolve via t(key).
 *
 * Note: full catalogue content (products/articles) remains in English by design;
 * this layer governs the global UI chrome and is fully extensible.
 */
type Dict = Record<string, string>;

const LANGUAGES: { code: Language; label: string; flag: string }[] = [
  { code: "en", label: "English", flag: "🇬🇧" },
  { code: "es", label: "Español", flag: "🇪🇸" },
  { code: "fr", label: "Français", flag: "🇫🇷" },
  { code: "de", label: "Deutsch", flag: "🇩🇪" },
  { code: "it", label: "Italiano", flag: "🇮🇹" },
  { code: "hi", label: "हिन्दी", flag: "🇮🇳" },
];

const en: Dict = {
  "nav.shop": "Shop",
  "nav.collections": "Collections",
  "nav.brands": "Brands",
  "nav.journal": "Journal",
  "nav.edit": "The Edit",
  "nav.help": "Help",
  "nav.account": "Account",
  "action.addToBag": "Add to bag",
  "action.getNow": "Get it now",
  "action.shopPartner": "Shop partner",
  "action.checkout": "Checkout",
  "action.viewBag": "View bag",
  "action.continueShopping": "Continue shopping",
  "action.subscribe": "Subscribe",
  "action.search": "Search",
  "cart.empty": "Your bag is empty",
  "cart.subtotal": "Subtotal",
  "common.freeShipping": "Free shipping",
  "common.secureCheckout": "Secure checkout",
  "common.bestseller": "Bestseller",
  "common.new": "New",
  "common.sale": "Sale",
};

const es: Dict = {
  "nav.shop": "Tienda",
  "nav.collections": "Colecciones",
  "nav.brands": "Marcas",
  "nav.journal": "Diario",
  "nav.edit": "Edición",
  "nav.help": "Ayuda",
  "nav.account": "Cuenta",
  "action.addToBag": "Añadir a la bolsa",
  "action.getNow": "Comprar ahora",
  "action.shopPartner": "Comprar socio",
  "action.checkout": "Finalizar compra",
  "action.viewBag": "Ver bolsa",
  "action.continueShopping": "Seguir comprando",
  "action.subscribe": "Suscribirse",
  "action.search": "Buscar",
  "cart.empty": "Tu bolsa está vacía",
  "cart.subtotal": "Subtotal",
  "common.freeShipping": "Envío gratis",
  "common.secureCheckout": "Pago seguro",
  "common.bestseller": "Más vendido",
  "common.new": "Nuevo",
  "common.sale": "Oferta",
};

const fr: Dict = {
  "nav.shop": "Boutique",
  "nav.collections": "Collections",
  "nav.brands": "Marques",
  "nav.journal": "Journal",
  "nav.edit": "Sélection",
  "nav.help": "Aide",
  "nav.account": "Compte",
  "action.addToBag": "Ajouter au panier",
  "action.getNow": "Acheter",
  "action.shopPartner": "Voir le partenaire",
  "action.checkout": "Paiement",
  "action.viewBag": "Voir le panier",
  "action.continueShopping": "Continuer mes achats",
  "action.subscribe": "S'abonner",
  "action.search": "Rechercher",
  "cart.empty": "Votre panier est vide",
  "cart.subtotal": "Sous-total",
  "common.freeShipping": "Livraison offerte",
  "common.secureCheckout": "Paiement sécurisé",
  "common.bestseller": "Best-seller",
  "common.new": "Nouveau",
  "common.sale": "Solde",
};

const de: Dict = {
  "nav.shop": "Shop",
  "nav.collections": "Kollektionen",
  "nav.brands": "Marken",
  "nav.journal": "Magazin",
  "nav.edit": "Auswahl",
  "nav.help": "Hilfe",
  "nav.account": "Konto",
  "action.addToBag": "In den Warenkorb",
  "action.getNow": "Jetzt kaufen",
  "action.shopPartner": "Zum Partner",
  "action.checkout": "Kasse",
  "action.viewBag": "Warenkorb ansehen",
  "action.continueShopping": "Weiter einkaufen",
  "action.subscribe": "Abonnieren",
  "action.search": "Suche",
  "cart.empty": "Ihr Warenkorb ist leer",
  "cart.subtotal": "Zwischensumme",
  "common.freeShipping": "Kostenloser Versand",
  "common.secureCheckout": "Sicherer Checkout",
  "common.bestseller": "Bestseller",
  "common.new": "Neu",
  "common.sale": "Sale",
};

const it: Dict = {
  "nav.shop": "Negozio",
  "nav.collections": "Collezioni",
  "nav.brands": "Marchi",
  "nav.journal": "Diario",
  "nav.edit": "Selezione",
  "nav.help": "Aiuto",
  "nav.account": "Account",
  "action.addToBag": "Aggiungi alla borsa",
  "action.getNow": "Acquista ora",
  "action.shopPartner": "Vai al partner",
  "action.checkout": "Checkout",
  "action.viewBag": "Vedi borsa",
  "action.continueShopping": "Continua lo shopping",
  "action.subscribe": "Iscriviti",
  "action.search": "Cerca",
  "cart.empty": "La tua borsa è vuota",
  "cart.subtotal": "Subtotale",
  "common.freeShipping": "Spedizione gratuita",
  "common.secureCheckout": "Pagamento sicuro",
  "common.bestseller": "Più venduto",
  "common.new": "Nuovo",
  "common.sale": "Saldi",
};

const hi: Dict = {
  "nav.shop": "खरीदें",
  "nav.collections": "संग्रह",
  "nav.brands": "ब्रांड्स",
  "nav.journal": "पत्रिका",
  "nav.edit": "चयन",
  "nav.help": "सहायता",
  "nav.account": "खाता",
  "action.addToBag": "बैग में डालें",
  "action.getNow": "अभी खरीदें",
  "action.shopPartner": "पार्टनर पर जाएँ",
  "action.checkout": "चेकआउट",
  "action.viewBag": "बैग देखें",
  "action.continueShopping": "खरीदारी जारी रखें",
  "action.subscribe": "सदस्यता लें",
  "action.search": "खोजें",
  "cart.empty": "आपका बैग खाली है",
  "cart.subtotal": "उप-योग",
  "common.freeShipping": "मुफ्त शिपिंग",
  "common.secureCheckout": "सुरक्षित भुगतान",
  "common.bestseller": "बेस्टसेलर",
  "common.new": "नया",
  "common.sale": "छूट",
};

const DICTS: Record<Language, Dict> = { en, es, fr, de, it, hi };

interface LanguageContextValue {
  language: Language;
  setLanguage: (l: Language) => void;
  t: (key: string) => string;
  languages: typeof LANGUAGES;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useLocalStorage<Language>("alaya_lang", "en");

  const setLanguage = useCallback((l: Language) => setLanguageState(l), [setLanguageState]);
  const t = useCallback((key: string) => DICTS[language]?.[key] ?? DICTS.en[key] ?? key, [language]);

  const value = useMemo(
    () => ({ language, setLanguage, t, languages: LANGUAGES }),
    [language, setLanguage, t]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within <LanguageProvider>");
  return ctx;
}
