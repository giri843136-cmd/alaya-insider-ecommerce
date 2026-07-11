import { useState } from "react";
import { MessageCircleQuestion, ThumbsUp, Search, BadgeCheck, CornerDownRight } from "lucide-react";
import { useStore } from "../../context/StoreContext";
import { useToast } from "../../context/ToastContext";
import { EmptyState } from "../ui";
import { formatDate, isEmail } from "../../lib/utils";
import type { Product } from "../../lib/types";

export function QuestionsAndAnswers({ product }: { product: Product }) {
  const { questionsFor, addQuestion, voteQuestion } = useStore();
  const { toast } = useToast();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", question: "" });
  const [err, setErr] = useState<Record<string, string>>({});

  const all = questionsFor(product.id);
  const filtered = query.trim()
    ? all.filter((q) => q.question.toLowerCase().includes(query.toLowerCase()) || (q.answer || "").toLowerCase().includes(query.toLowerCase()))
    : all;
  const sorted = [...filtered].sort((a, b) => Number(!!b.pinned) - Number(!!a.pinned) || b.helpful - a.helpful);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const e2: Record<string, string> = {};
    if (form.name.trim().length < 2) e2.name = "Enter your name";
    if (!isEmail(form.email)) e2.email = "Enter a valid email";
    if (form.question.trim().length < 5) e2.question = "Ask a complete question";
    setErr(e2);
    if (Object.keys(e2).length) return;
    addQuestion(product.id, form.name.trim(), form.question.trim());
    toast.success("Question submitted", "Our team or community will answer shortly.");
    setForm({ name: "", email: "", question: "" });
    setOpen(false);
  };

  return (
    <div id="questions" className="scroll-mt-24">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl font-semibold text-ink">Questions & answers</h2>
          <p className="text-sm text-muted">{all.length} {all.length === 1 ? "question" : "questions"} about this product</p>
        </div>
        <button onClick={() => setOpen((o) => !o)} className="btn-outline btn-sm">
          <MessageCircleQuestion className="h-4 w-4" /> Ask a question
        </button>
      </div>

      {all.length > 0 && (
        <div className="relative mt-4 max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search questions…" className="input-field pl-9" />
        </div>
      )}

      {open && (
        <form onSubmit={submit} noValidate className="card mt-4 p-5 animate-fade-in">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <input className="input-field" placeholder="Your name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              {err.name && <p className="mt-1 text-xs text-danger">{err.name}</p>}
            </div>
            <div>
              <input className="input-field" type="email" placeholder="Your email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              {err.email && <p className="mt-1 text-xs text-danger">{err.email}</p>}
            </div>
          </div>
          <div className="mt-3">
            <textarea rows={3} className="input-field resize-none" placeholder="Your question about this product…" value={form.question} onChange={(e) => setForm({ ...form, question: e.target.value })} />
            {err.question && <p className="mt-1 text-xs text-danger">{err.question}</p>}
          </div>
          <div className="mt-4 flex gap-3">
            <button type="button" onClick={() => setOpen(false)} className="btn-ghost btn-sm">Cancel</button>
            <button type="submit" className="btn-primary btn-sm">Submit question</button>
          </div>
        </form>
      )}

      <div className="mt-5 space-y-3">
        {sorted.length === 0 ? (
          <EmptyState icon={<MessageCircleQuestion className="h-6 w-6" />} title={all.length === 0 ? "No questions yet" : "No matches"} description={all.length === 0 ? "Be the first to ask about this product." : "Try a different search."} />
        ) : (
          sorted.map((q) => (
            <div key={q.id} className="card p-5">
              <div className="flex items-start justify-between gap-4">
                <p className="font-medium text-ink">{q.question}</p>
                <span className="shrink-0 text-xs text-muted">{formatDate(q.date)}</span>
              </div>
              <p className="mt-1 flex items-center gap-1.5 text-xs text-muted">
                <span className="font-medium text-ink">{q.author}</span> asked
              </p>

              {q.answer ? (
                <div className="mt-4 rounded-xl bg-surface2/50 p-4">
                  <p className="flex items-center gap-1.5 text-xs font-semibold text-accent"><BadgeCheck className="h-3.5 w-3.5" /> {q.answeredBy || "ALAYA Care"}</p>
                  <p className="mt-1.5 flex gap-2 text-sm text-ink"><CornerDownRight className="mt-0.5 h-4 w-4 shrink-0 text-muted" /> {q.answer}</p>
                </div>
              ) : (
                <p className="mt-3 text-xs text-muted">Awaiting an answer…</p>
              )}

              <div className="mt-3 flex items-center gap-4 border-t border-line pt-3">
                <button onClick={() => voteQuestion(q.id)} className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-accent">
                  <ThumbsUp className="h-3.5 w-3.5" /> Helpful ({q.helpful})
                </button>
                {q.pinned && <span className="badge bg-accent-soft text-accent">Pinned</span>}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
