import { useState } from "react";
import { Sparkles, Brain, FileText, Tag, Search, Copy, CheckCheck, RefreshCw, ShoppingBag, BarChart3 } from "lucide-react";
import { useStore } from "../../context/StoreContext";
import { useToast } from "../../context/ToastContext";
import { Seo } from "../../components/Seo";
import { cn } from "@/utils/cn";

type AIFeature = "titles" | "descriptions" | "specs" | "faqs" | "meta" | "tags" | "pricing" | "forecast";

const FEATURES: { id: AIFeature; label: string; icon: any; desc: string }[] = [
  { id: "titles", label: "Product Titles", icon: FileText, desc: "Generate SEO-optimized product titles" },
  { id: "descriptions", label: "Descriptions", icon: FileText, desc: "Write compelling product descriptions" },
  { id: "specs", label: "Specifications", icon: Tag, desc: "Generate technical specification tables" },
  { id: "faqs", label: "FAQs", icon: Brain, desc: "Create product Q&A content" },
  { id: "meta", label: "Meta Tags", icon: Search, desc: "Generate meta titles & descriptions" },
  { id: "tags", label: "Product Tags", icon: Tag, desc: "Suggest relevant product tags" },
  { id: "pricing", label: "Pricing Suggestions", icon: ShoppingBag, desc: "AI-driven price optimization" },
  { id: "forecast", label: "Inventory Forecast", icon: BarChart3, desc: "Predict demand and stock needs" },
];

function getAISuggestion(feature: AIFeature, productName: string): string {
  const suggestions: Record<string, Record<string, string>> = {
    titles: {
      default: `• Premium ${productName} – Elevate Your Everyday\n• ${productName} | Handcrafted with Care\n• Discover the ${productName} Collection\n• ${productName} – Where Quality Meets Design\n• The Ultimate ${productName} Buying Guide`,
    },
    descriptions: {
      default: `Experience the exceptional craftsmanship of our ${productName}. Every detail has been thoughtfully designed to bring beauty and function to your daily routine.\n\nCrafted from premium, sustainably sourced materials, this piece represents the perfect balance of form and function. Whether you're treating yourself or searching for the perfect gift, ${productName} delivers an unparalleled experience.\n\nKey benefits:\n• Premium quality materials\n• Thoughtfully designed for everyday use\n• Sustainably crafted with care\n• Backed by our satisfaction guarantee`,
    },
    specs: {
      default: `• Material: Premium-grade materials\n• Dimensions: Standard fit\n• Weight: Lightweight yet durable\n• Color: Available in multiple finishes\n• Care: Easy maintenance\n• Origin: Artisan crafted`,
    },
    faqs: {
      default: `Q: What materials are used?\nA: Our products are crafted from premium, sustainably sourced materials to ensure durability and beauty.\n\nQ: How do I care for this product?\nA: We recommend following the included care instructions. Most products are easy to maintain.\n\nQ: What is the return policy?\nA: We offer a 30-day satisfaction guarantee on all products.\n\nQ: Is this product available in other colors?\nA: Yes, several color options are available. Check the product page for options.`,
    },
    meta: {
      default: `Meta Title: ${productName} | Premium Quality | ALAYA INSIDER\nMeta Description: Discover the ${productName} at ALAYA INSIDER. Premium quality, handcrafted with care. Free shipping on orders over $150. Shop now.`,
    },
    tags: {
      default: `${productName.toLowerCase().replace(/\s+/g, "-")}, premium, handcrafted, artisan, luxury, curated, gift-ideas, home-essentials, quality-crafted, sustainable`,
    },
    pricing: {
      default: `• Current Price Range: Competitive market position\n• Suggested Retail: $45 - $150 (based on category)\n• Recommended Margin: 35-50%\n• Competitor Analysis: Aligned with premium segment\n• Promotional Strategy: Bundle with complementary products\n• Flash Sale Candidate: Consider for seasonal promotions`,
    },
    forecast: {
      default: `• 30-Day Forecast: Steady demand expected\n• 90-Day Trend: Seasonal increase projected\n• Reorder Point: When stock reaches 15 units\n• Optimal Stock Level: 30-50 units\n• Lead Time Buffer: Account for 5-7 day supplier lead time\n• Recommendation: Maintain current stock levels, reorder in 2 weeks`,
    },
  };
  return suggestions[feature]?.default || `AI-generated ${feature} content for ${productName}`;
}

export default function CommerceAI() {
  const { products } = useStore();
  const { toast } = useToast();
  const [feature, setFeature] = useState<AIFeature>("titles");
  const [selectedProduct, setSelectedProduct] = useState(products[0]?.id || "");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const product = products.find(p => p.id === selectedProduct);

  const generate = () => {
    if (!product) return toast.error("Select a product");
    setLoading(true);
    setTimeout(() => {
      setOutput(getAISuggestion(feature, product.name));
      setLoading(false);
    }, 600);
  };

  const copyOutput = async () => {
    try { await navigator.clipboard.writeText(output); setCopied(true); setTimeout(() => setCopied(false), 2000); toast.success("Copied to clipboard"); } catch {}
  };

  return (
    <>
      <Seo title="AI Commerce" path="/admin/commerce/ai" />
      <div className="p-5 sm:p-8">
        <h1 className="font-display text-3xl font-semibold text-ink flex items-center gap-3">
          <Brain className="h-8 w-8 text-accent" />
          AI Commerce
        </h1>
        <p className="mt-1 text-sm text-muted">Generate product content, pricing suggestions, and forecasts with AI.</p>

        <div className="mt-6 grid gap-4 sm:grid-cols-4">
          {FEATURES.map(f => (
            <button key={f.id} onClick={() => { setFeature(f.id); setOutput(""); }} className={cn("card p-4 text-left transition-all", feature === f.id && "ring-1 ring-accent/40 bg-accent-soft/10")}>
              <span className={cn("grid h-9 w-9 place-items-center rounded-full", feature === f.id ? "bg-accent text-accent-ink" : "bg-accent-soft text-accent")}>
                <f.icon className="h-4 w-4" />
              </span>
              <h3 className="mt-3 font-semibold text-ink text-sm">{f.label}</h3>
              <p className="mt-1 text-xs text-muted">{f.desc}</p>
            </button>
          ))}
        </div>

        <div className="mt-8 card p-5">
          <div className="flex flex-wrap items-end gap-4">
            <div className="flex-1 min-w-[200px]">
              <label className="label-field">Select Product</label>
              <select className="input-field" value={selectedProduct} onChange={e => setSelectedProduct(e.target.value)}>
                {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label-field">&nbsp;</label>
              <button onClick={generate} disabled={loading} className="btn-primary btn-md">
                {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                {loading ? "Generating…" : `Generate ${FEATURES.find(f => f.id === feature)?.label}`}
              </button>
            </div>
          </div>

          {product && (
            <div className="mt-4 flex items-center gap-3 rounded-xl bg-surface2/50 p-3">
              <img src={product.images[0]} alt="" className="h-12 w-10 rounded-lg object-cover" />
              <div>
                <p className="font-medium text-ink">{product.name}</p>
                <p className="text-xs text-muted">{product.category} · ${product.price}</p>
              </div>
            </div>
          )}

          {output && (
            <div className="mt-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-ink">Generated {FEATURES.find(f => f.id === feature)?.label}</h3>
                <button onClick={copyOutput} className="btn-ghost btn-sm">
                  {copied ? <CheckCheck className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
                  {copied ? "Copied" : "Copy"}
                </button>
              </div>
              <textarea readOnly rows={10} className="input-field w-full resize-none font-mono text-xs" value={output} />
              <div className="mt-3 flex gap-2">
                <button onClick={generate} className="btn-accent-soft btn-sm"><RefreshCw className="h-3.5 w-3.5" /> Regenerate</button>
                <button onClick={() => { setOutput(""); }} className="btn-ghost btn-sm">Clear</button>
              </div>
            </div>
          )}
        </div>

        {/* AI Tools Overview */}
        <div className="mt-6 card p-5 bg-accent-soft/10 border-accent/10">
          <h3 className="flex items-center gap-2 font-semibold text-ink"><Sparkles className="h-4 w-4 text-accent" /> AI Commerce Capabilities</h3>
          <div className="mt-4 grid gap-4 sm:grid-cols-3 text-sm">
            <div><h4 className="font-medium text-ink">Content Generation</h4><p className="text-xs text-muted mt-1">Product titles, descriptions, specifications, FAQs, buying guides, comparison tables, schema markup</p></div>
            <div><h4 className="font-medium text-ink">SEO Optimization</h4><p className="text-xs text-muted mt-1">Meta titles, meta descriptions, product tags, alt text, structured data, canonical URLs</p></div>
            <div><h4 className="font-medium text-ink">Intelligence</h4><p className="text-xs text-muted mt-1">Supplier recommendations, pricing suggestions, inventory forecasting, sales predictions, trend analysis</p></div>
          </div>
        </div>
      </div>
    </>
  );
}
