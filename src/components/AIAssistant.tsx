import { useEffect, useRef, useState } from "react";
import { Bot, X, Send, Sparkles, MessageCircle, Minimize2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useStore } from "../context/StoreContext";
import { useEscapeKey, useLockBody } from "../lib/hooks";
import { cn } from "@/utils/cn";
import { formatPrice, hashToIndex } from "../lib/utils";
import type { Product } from "../lib/types";

interface Message {
  id: string;
  role: "assistant" | "user";
  text: string;
  products?: Product[];
  quickReplies?: string[];
}

const GREETINGS = [
  "Hello, I'm your ALAYA shopping assistant. I can help you find the perfect piece, answer questions about our products, or suggest something based on your taste. What are you looking for?",
];

const QUICK_REPLIES = [
  "What's trending this season?",
  "Find me a gift under $100",
  "Show me bestsellers",
  "What jewellery do you recommend?",
  "Need a leather bag",
  "Show me skincare products",
];

function generateResponse(input: string, products: Product[]): Message {
  const q = input.toLowerCase();

  // Gift under price
  if (q.includes("gift") || (q.includes("under") && /\d+/.test(q))) {
    const match = q.match(/(\d+)/);
    const maxPrice = match ? parseInt(match[1]) : 100;
    const results = products
      .filter((p) => (p.salePrice ?? p.price) <= maxPrice && !p.affiliate)
      .sort((a, b) => b.rating - a.rating)
      .slice(0, 4);
    if (results.length > 0) {
      return {
        id: `msg_${Date.now()}`,
        role: "assistant",
        text: `I found ${results.length} beautiful pieces under $${maxPrice}. Here are my top picks:`,
        products: results,
        quickReplies: ["Show me more options", "Something more luxurious", "Add best one to bag"],
      };
    }
  }

  // Specific category requests
  const categories = ["jewellery", "jewelry", "skincare", "bags", "home", "fashion", "accessories", "beauty", "fragrance"];
  const catMap: Record<string, string> = {
    jewellery: "jewelry", jewelry: "jewelry",
    skincare: "skincare", bags: "bags",
    home: "home", fashion: "fashion",
    accessories: "accessories", beauty: "beauty",
    fragrance: "fragrance",
  };
  for (const cat of categories) {
    if (q.includes(cat)) {
      const mappedCat = catMap[cat] || cat;
      const results = products
        .filter((p) => p.tags.some((t) => t.toLowerCase().includes(mappedCat)) || p.category.toLowerCase().includes(mappedCat))
        .sort((a, b) => b.rating - a.rating)
        .slice(0, 4);
      if (results.length > 0) {
        return {
          id: `msg_${Date.now()}`,
          role: "assistant",
          text: `Here are our top ${cat} picks, curated by our editors:`,
          products: results,
          quickReplies: ["Show me the most popular", "What's the price range?", "Any deals on these?"],
        };
      }
    }
  }

  // Bestsellers
  if (q.includes("bestseller") || q.includes("popular") || q.includes("trending") || q.includes("bestselling")) {
    const results = products.filter((p) => p.bestSeller).slice(0, 4);
    if (results.length > 0) {
      return {
        id: `msg_${Date.now()}`,
        role: "assistant",
        text: "These are our most-loved pieces this season — chosen by thousands of Insiders:",
        products: results,
        quickReplies: ["What makes these bestselling?", "Any new arrivals?", "Show me something similar"],
      };
    }
  }

  // Leather bags
  if (q.includes("leather") || q.includes("bag") || q.includes("tote")) {
    const results = products
      .filter((p) => p.name.toLowerCase().includes("leather") || p.tags.some((t) => t.toLowerCase().includes("bag") || t.toLowerCase().includes("leather")))
      .slice(0, 4);
    if (results.length > 0) {
      return {
        id: `msg_${Date.now()}`,
        role: "assistant",
        text: "Here are our leather pieces — each chosen for quality and enduring design:",
        products: results,
        quickReplies: ["Show me more bags", "What about totes?", "Any on sale?"],
      };
    }
  }

  // New arrivals
  if (q.includes("new") || q.includes("just landed") || q.includes("arrival")) {
    const results = [...products].sort((a, b) => b.createdAt - a.createdAt).slice(0, 4);
    return {
      id: `msg_${Date.now()}`,
      role: "assistant",
      text: "Here's what's just landed in our edit — fresh picks from our curators:",
      products: results,
      quickReplies: ["Show me all new arrivals", "What's most popular?", "Any deals on new items?"],
    };
  }

  // Sale / deals
  if (q.includes("sale") || q.includes("deal") || q.includes("discount") || q.includes("offer")) {
    const results = products.filter((p) => p.salePrice && p.salePrice < p.price).sort((a, b) => hashToIndex(a.id, 100) - hashToIndex(b.id, 100)).slice(0, 4);
    if (results.length > 0) {
      return {
        id: `msg_${Date.now()}`,
        role: "assistant",
        text: "Great timing! These pieces are currently on sale:",
        products: results,
        quickReplies: ["Best discounts", "Under $50", "Flash deals"],
      };
    }
  }

  // Product questions
  if (q.includes("recommend") || q.includes("suggest") || q.includes("what")) {
    const results = [...products].sort((a, b) => (b.rating * b.reviewCount) - (a.rating * a.reviewCount)).slice(0, 4);
    return {
      id: `msg_${Date.now()}`,
      role: "assistant",
      text: "Based on what our editors love most, here are my top recommendations:",
      products: results,
      quickReplies: ["Something under $200", "Best for gifting", "Customer favourites"],
    };
  }

  // Default fallback
  const fallbacks = [
    "I'd love to help you find something special. Could you tell me more about what you're looking for? A budget, a category, or a style?",
    "I'm here to help you discover pieces you'll love. Try asking me about bestsellers, new arrivals, or a specific category like jewellery or skincare.",
    "Let me help you find the perfect piece. Try saying \"gift under $100\", \"show me bestsellers\", or \"what's new?\"",
  ];
  return {
    id: `msg_${Date.now()}`,
    role: "assistant",
    text: fallbacks[hashToIndex(input, fallbacks.length)],
    quickReplies: QUICK_REPLIES,
  };
}

export function AIAssistant() {
  const { products, settings } = useStore();
  const [open, setOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEscapeKey(() => setOpen(false), open && !minimized);
  useLockBody(open && !minimized);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    if (open && messages.length === 0) {
      // Add greeting after a brief delay
      const t = setTimeout(() => {
        setMessages([{ id: "greeting", role: "assistant", text: GREETINGS[0], quickReplies: QUICK_REPLIES }]);
      }, 400);
      return () => clearTimeout(t);
    }
  }, [open, messages.length]);

  useEffect(() => {
    if (open && !minimized) {
      const t = setTimeout(() => inputRef.current?.focus(), 500);
      return () => clearTimeout(t);
    }
  }, [open, minimized]);

  const sendMessage = (text: string) => {
    if (!text.trim()) return;
    const userMsg: Message = { id: `user_${Date.now()}`, role: "user", text: text.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    setTimeout(() => {
      const response = generateResponse(text.trim(), products);
      setMessages((prev) => [...prev, response]);
      setLoading(false);
    }, 400 + Math.random() * 300);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-[110] grid h-14 w-14 place-items-center rounded-full bg-accent text-accent-ink shadow-[var(--shadow-float)] transition-all duration-300 hover:scale-110 active:scale-95"
        aria-label="Open AI shopping assistant"
      >
        <MessageCircle className="h-6 w-6" />
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-[150] flex items-end justify-center sm:items-end sm:justify-end sm:pb-6 sm:pr-6">
      {/* Backdrop */}
      {!minimized && (
        <div
          className="absolute inset-0 bg-black/30 backdrop-blur-sm animate-fade-in sm:hidden"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}

      <div
        className={cn(
          "relative z-10 flex flex-col bg-canvas shadow-[var(--shadow-float)] transition-all duration-300",
          minimized
            ? "h-14 w-14 rounded-full cursor-pointer"
            : "h-[85vh] w-full max-w-md rounded-t-3xl sm:h-[70vh] sm:rounded-3xl overflow-hidden animate-slide-up border border-line"
        )}
        onClick={minimized ? () => setMinimized(false) : undefined}
        role="dialog"
        aria-modal={!minimized}
        aria-label="AI Shopping Assistant"
      >
        {!minimized && (
          <>
            {/* Header */}
            <div className="flex items-center justify-between border-b border-line bg-luxe px-5 py-4">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-full bg-accent text-accent-ink animate-floaty">
                  <Bot className="h-5 w-5" />
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-ink">ALAYA Assistant</h3>
                    <span className="badge bg-success/15 text-success text-[0.55rem]">Online</span>
                  </div>
                  <p className="text-xs text-muted">AI-powered shopping guide</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setMinimized(true)}
                  aria-label="Minimize"
                  className="grid h-8 w-8 place-items-center rounded-full text-muted hover:bg-surface2 hover:text-ink"
                >
                  <Minimize2 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setOpen(false)}
                  aria-label="Close"
                  className="grid h-8 w-8 place-items-center rounded-full text-muted hover:bg-surface2 hover:text-ink"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-5 py-4">
              {messages.map((msg) => (
                <div key={msg.id} className={cn("mb-4 animate-fade-in", msg.role === "user" ? "text-right" : "")}>
                  {msg.role === "assistant" && (
                    <div className="flex items-center gap-2 mb-2">
                      <span className="grid h-6 w-6 place-items-center rounded-full bg-accent-soft text-accent">
                        <Bot className="h-3.5 w-3.5" />
                      </span>
                      <span className="text-xs font-medium text-accent">ALAYA Assistant</span>
                    </div>
                  )}
                  <div
                    className={cn(
                      "inline-block max-w-[85%] rounded-2xl px-4 py-3 text-left",
                      msg.role === "user"
                        ? "bg-accent text-accent-ink rounded-br-md"
                        : "bg-surface2 text-ink rounded-bl-md"
                    )}
                  >
                    <p className="text-sm leading-relaxed">{msg.text}</p>
                  </div>

                  {/* Product recommendations */}
                  {msg.products && msg.products.length > 0 && (
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      {msg.products.map((p) => (
                        <Link
                          key={p.id}
                          to={`/product/${p.slug}`}
                          className="group flex flex-col rounded-xl border border-line bg-surface overflow-hidden transition-all hover:border-accent hover:shadow-[var(--shadow-card)]"
                        >
                          <div className="aspect-[4/5] overflow-hidden bg-surface2">
                            <img
                              src={p.images[0]}
                              alt={p.name}
                              loading="lazy"
                              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                            />
                          </div>
                          <div className="p-2.5">
                            <p className="truncate text-xs font-medium text-ink">{p.name}</p>
                            <p className="text-xs text-muted">
                              {formatPrice(p.salePrice ?? p.price, settings.currency)}
                            </p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}

                  {/* Quick replies */}
                  {msg.quickReplies && msg.quickReplies.length > 0 && (
                    <div className="mt-2.5 flex flex-wrap gap-1.5">
                      {msg.quickReplies.map((qr) => (
                        <button
                          key={qr}
                          onClick={() => sendMessage(qr)}
                          className="inline-flex items-center gap-1 rounded-full border border-line bg-surface px-3 py-1.5 text-xs font-medium text-muted transition-colors hover:border-accent hover:text-accent"
                        >
                          {qr}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              {loading && (
                <div className="mb-4 animate-fade-in">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="grid h-6 w-6 place-items-center rounded-full bg-accent-soft text-accent">
                      <Bot className="h-3.5 w-3.5" />
                    </span>
                    <span className="text-xs font-medium text-accent">ALAYA Assistant</span>
                  </div>
                  <div className="inline-flex items-center gap-2 rounded-2xl rounded-bl-md bg-surface2 px-4 py-3">
                    <span className="flex gap-1">
                      <span className="h-2 w-2 animate-bounce rounded-full bg-accent/40" style={{ animationDelay: "0ms" } as React.CSSProperties} />
                      <span className="h-2 w-2 animate-bounce rounded-full bg-accent/60" style={{ animationDelay: "150ms" } as React.CSSProperties} />
                      <span className="h-2 w-2 animate-bounce rounded-full bg-accent" style={{ animationDelay: "300ms" } as React.CSSProperties} />
                    </span>
                    <span className="text-xs text-muted">Thinking…</span>
                  </div>
                </div>
              )}

              <div ref={chatEndRef} />
            </div>

            {/* Input */}
            <div className="border-t border-line px-5 py-4">
              <form onSubmit={handleSubmit} className="flex items-center gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask me anything…"
                  className="input-field flex-1"
                  disabled={loading}
                />
                <button
                  type="submit"
                  disabled={loading || !input.trim()}
                  className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-accent text-accent-ink transition-all hover:brightness-110 disabled:opacity-50"
                  aria-label="Send message"
                >
                  <Send className="h-4 w-4" />
                </button>
              </form>
              <p className="mt-2 flex items-center gap-1 text-[0.6rem] text-muted">
                <Sparkles className="h-3 w-3" />
                AI-generated recommendations · Always verify details on product pages
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
