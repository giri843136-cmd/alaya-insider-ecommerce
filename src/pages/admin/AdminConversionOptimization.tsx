/**
 * ALAYA INSIDER — Conversion Optimization Admin (PART 3.5)
 * ------------------------------------------------------------------
 * Conversion tracking, click analytics, A/B testing, funnel analysis,
 * CTA optimization, and trust badge management.
 */
import { useState, useMemo } from "react";
import {
  BarChart3, MousePointerClick, Plus,
  Play, Pause, Check, Trash2, X, TrendingUp, Eye,
} from "lucide-react";
import { Seo } from "../../components/Seo";
import { Badge, EmptyState, Dialog } from "../../components/ui";
import { cn } from "@/utils/cn";
import {
  getABTests, addABTest, updateABTest, deleteABTest,
  getClickEvents, getConversionFunnel, getConversionRate,
  type ABTest,
} from "../../lib/affiliateCommerce";

const EMPTY_AB_TEST: Partial<ABTest> = {
  name: "", description: "", elementType: "cta",
  variants: [
    { id: "a", label: "Variant A", config: {}, impressions: 0, clicks: 0, conversions: 0, revenue: 0 },
    { id: "b", label: "Variant B", config: {}, impressions: 0, clicks: 0, conversions: 0, revenue: 0 },
  ],
  status: "draft",
};

export default function AdminConversionOptimization() {
  const [tests, setTests] = useState(getABTests());
  const [editing, setEditing] = useState<Partial<ABTest> | null>(null);
  const [toDelete, setToDelete] = useState<ABTest | null>(null);
  const [tab, setTab] = useState<"ab_tests" | "funnel" | "clicks">("ab_tests");

  const refresh = () => setTests(getABTests());
  const funnel = useMemo(() => getConversionFunnel(), []);
  const clickEvents = useMemo(() => getClickEvents(50), []);
  const conversionRate = useMemo(() => getConversionRate(), []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing?.name?.trim()) return;
    if (editing.id) {
      updateABTest(editing.id, editing);
    } else {
      addABTest(editing as any);
    }
    setEditing(null);
    refresh();
  };

  return (
    <>
      <Seo title="Conversion Optimization" path="/admin/conversion-optimization" />
      <div className="p-5 pb-28 sm:p-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-semibold text-ink">Conversion Optimization</h1>
            <p className="mt-1 text-sm text-muted">A/B testing, click tracking, funnel analysis, and CTA optimisation for affiliate commerce.</p>
          </div>
          <button onClick={() => setEditing({ ...EMPTY_AB_TEST, variants: EMPTY_AB_TEST.variants!.map((v) => ({ ...v })) })} className="btn-primary btn-md"><Plus className="h-4 w-4" /> New A/B test</button>
        </div>

        {/* Summary */}
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="card p-4">
            <p className="text-xs font-semibold text-muted">A/B Tests</p>
            <p className="mt-1 text-2xl font-semibold text-ink">{tests.length}</p>
          </div>
          <div className="card p-4">
            <p className="text-xs font-semibold text-muted">Running</p>
            <p className="mt-1 text-2xl font-semibold text-ink">{tests.filter((t) => t.status === "running").length}</p>
          </div>
          <div className="card p-4">
            <p className="text-xs font-semibold text-muted">Conv. rate</p>
            <p className="mt-1 text-2xl font-semibold text-ink">{conversionRate}%</p>
          </div>
          <div className="card p-4">
            <p className="text-xs font-semibold text-muted">Click events</p>
            <p className="mt-1 text-2xl font-semibold text-ink">{clickEvents.length.toLocaleString()}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-6 flex gap-2 border-b border-line pb-2">
          {(["ab_tests", "funnel", "clicks"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)} className={cn("btn-sm capitalize", tab === t ? "btn-primary" : "btn-ghost")}>
              {t === "ab_tests" ? <BarChart3 className="h-4 w-4" /> : t === "funnel" ? <TrendingUp className="h-4 w-4" /> : <MousePointerClick className="h-4 w-4" />}
              {t.replace("_", " ")}
            </button>
          ))}
        </div>

        {tab === "ab_tests" && (
          <div className="mt-6 space-y-4">
            {tests.length === 0 ? (
              <EmptyState icon={<BarChart3 className="h-6 w-6" />} title="No A/B tests yet" description="Create your first A/B test to optimise conversions." />
            ) : (
              tests.map((test) => (
                <div key={test.id} className="card p-5">
                  <div className="flex items-start justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-ink">{test.name}</h3>
                        <span className={cn("badge", test.status === "running" ? "bg-success/15 text-success" : test.status === "completed" ? "bg-info/15 text-info" : test.status === "paused" ? "bg-warning/15 text-warning" : "bg-surface2 text-muted")}>{test.status}</span>
                      </div>
                      <p className="text-xs text-muted mt-0.5">{test.description}</p>
                    </div>
                    <div className="flex gap-1">
                      {test.status === "draft" && (
                        <button onClick={() => { updateABTest(test.id, { status: "running", startedAt: Date.now() }); refresh(); }} className="btn-ghost btn-sm"><Play className="h-3.5 w-3.5" /> Start</button>
                      )}
                      {test.status === "running" && (
                        <button onClick={() => { updateABTest(test.id, { status: "paused" }); refresh(); }} className="btn-ghost btn-sm"><Pause className="h-3.5 w-3.5" /> Pause</button>
                      )}
                      {test.status === "running" && (
                        <button onClick={() => { updateABTest(test.id, { status: "completed", completedAt: Date.now() }); refresh(); }} className="btn-ghost btn-sm"><Check className="h-3.5 w-3.5" /> End</button>
                      )}
                      <button onClick={() => setEditing({ ...test })} className="btn-ghost btn-sm"><Eye className="h-3.5 w-3.5" /></button>
                      <button onClick={() => setToDelete(test)} className="btn-ghost btn-sm text-danger"><Trash2 className="h-3.5 w-3.5" /></button>
                    </div>
                  </div>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    {test.variants.map((v) => {
                      const convRate = v.impressions > 0 ? ((v.conversions / v.impressions) * 100).toFixed(1) : "0.0";
                      const isWinner = test.status === "completed" && test.winner === v.id;
                      return (
                        <div key={v.id} className={cn("rounded-lg border p-3", isWinner ? "border-accent bg-accent-soft" : "border-line")}>
                          <div className="flex items-center justify-between">
                            <span className="flex items-center gap-2">
                              <span className={cn("grid h-7 w-7 place-items-center rounded-full text-xs font-bold", isWinner ? "bg-accent text-accent-ink" : "bg-surface2 text-muted")}>{v.label.toUpperCase()}</span>
                              <span className="text-sm font-medium text-ink">{v.label}</span>
                            </span>
                            <span className="text-sm font-semibold text-ink">{convRate}%</span>
                          </div>
                          <div className="mt-2 grid grid-cols-3 gap-2 text-xs text-muted">
                            <span>{v.impressions.toLocaleString()} imp.</span>
                            <span>{v.clicks.toLocaleString()} clicks</span>
                            <span>${v.revenue.toLocaleString()} rev.</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {tab === "funnel" && (
          <div className="mt-6 space-y-2">
            {funnel.map((stage, i) => {
              const width = funnel.length > 0 ? (stage.count / funnel[0].count) * 100 : 0;
              return (
                <div key={stage.stage} className="card p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-ink capitalize">{stage.stage}</span>
                    <span className="text-sm text-muted">{stage.count.toLocaleString()} · {Math.round(stage.rate * 100)}%</span>
                  </div>
                  <div className="h-4 w-full rounded-full bg-surface2 overflow-hidden">
                    <div className={cn("h-full rounded-full", i === funnel.length - 1 ? "bg-accent" : "bg-accent/40")} style={{ width: `${Math.max(width, 2)}%` }} />
                  </div>
                  {i > 0 && (
                    <p className="mt-1 text-xs text-danger">Drop-off: {stage.dropOff.toLocaleString()} ({Math.round((1 - stage.rate) * 100)}%)</p>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {tab === "clicks" && (
          <div className="mt-6">
            {clickEvents.length === 0 ? (
              <EmptyState icon={<MousePointerClick className="h-6 w-6" />} title="No click events recorded" description="Clicks will appear once affiliate links are clicked." />
            ) : (
              <div className="overflow-hidden rounded-xl border border-line">
                <table className="w-full text-sm">
                  <thead className="bg-surface2/60">
                    <tr><th className="px-4 py-2.5 text-left font-medium text-muted">Product</th><th className="px-4 py-2.5 text-left font-medium text-muted">Type</th><th className="px-4 py-2.5 text-center font-medium text-muted">Converted</th><th className="px-4 py-2.5 text-right font-medium text-muted">Value</th><th className="px-4 py-2.5 text-right font-medium text-muted">Time</th></tr>
                  </thead>
                  <tbody>
                    {clickEvents.map((e, i) => (
                      <tr key={e.id} className={cn("border-t border-line", i % 2 === 0 ? "bg-surface" : "bg-surface2/20")}>
                        <td className="px-4 py-3 font-medium text-ink truncate max-w-[200px]">{e.productName}</td>
                        <td className="px-4 py-3"><Badge variant="neutral">{e.linkType}</Badge></td>
                        <td className="px-4 py-3 text-center">{e.converted ? <Check className="mx-auto h-4 w-4 text-success" /> : <X className="mx-auto h-4 w-4 text-muted" />}</td>
                        <td className="px-4 py-3 text-right text-ink">{e.conversionValue ? `$${e.conversionValue}` : "-"}</td>
                        <td className="px-4 py-3 text-right text-muted text-xs">{new Date(e.timestamp).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {editing && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4" role="dialog">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in" onClick={() => setEditing(null)} />
          <form onSubmit={handleSave} className="card relative z-10 w-full max-w-lg p-6 animate-scale-in">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-ink">{editing.id ? "Edit A/B test" : "New A/B test"}</h2>
              <button type="button" onClick={() => setEditing(null)} aria-label="Close" className="grid h-9 w-9 place-items-center rounded-full hover:bg-surface2"><X className="h-5 w-5" /></button>
            </div>
            <div className="mt-5 space-y-4">
              <div><label className="label-field">Test name</label><input className="input-field" value={editing.name || ""} onChange={(e) => setEditing({ ...editing, name: e.target.value })} placeholder="CTA Button Colour Test" /></div>
              <div><label className="label-field">Description</label><input className="input-field" value={editing.description || ""} onChange={(e) => setEditing({ ...editing, description: e.target.value })} /></div>
              <div><label className="label-field">Element type</label>
                <select className="input-field" value={editing.elementType} onChange={(e) => setEditing({ ...editing, elementType: e.target.value as any })}>
                  {["cta", "button", "layout", "recommendation", "marketplace"].map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div><label className="label-field">Variants</label>
                {editing.variants?.map((v, i) => (
                  <div key={v.id} className="mt-2 flex items-center gap-2">
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-surface2 text-xs font-bold text-muted">{v.label.toUpperCase()}</span>
                    <input className="input-field flex-1" value={v.label} onChange={(e) => {
                      const variants = [...(editing.variants || [])];
                      variants[i] = { ...variants[i], label: e.target.value };
                      setEditing({ ...editing, variants });
                    }} placeholder={`Variant ${v.label.toUpperCase()}`} />
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={() => setEditing(null)} className="btn-ghost btn-md">Cancel</button>
              <button type="submit" className="btn-primary btn-md">{editing.id ? "Save" : "Create test"}</button>
            </div>
          </form>
        </div>
      )}

      <Dialog open={!!toDelete} onClose={() => setToDelete(null)} title="Delete A/B test"
        footer={<><button onClick={() => setToDelete(null)} className="btn-ghost btn-md">Cancel</button><button onClick={() => { if (toDelete) { deleteABTest(toDelete.id); setToDelete(null); refresh(); } }} className="btn btn-md bg-danger text-white hover:brightness-110">Delete</button></>}>
        Delete <strong>{toDelete?.name}</strong>? This cannot be undone.
      </Dialog>
    </>
  );
}
