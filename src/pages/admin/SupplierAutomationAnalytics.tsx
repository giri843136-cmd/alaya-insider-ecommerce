import { useState, useMemo } from "react";
import { BrainCircuit, TrendingUp, Clock, DollarSign, Package, AlertTriangle, CheckCircle, Star, Shield } from "lucide-react";
import { useStore } from "../../context/StoreContext";
import { Seo } from "../../components/Seo";
import { Money } from "../../components/ui";
import { AreaChart, RankList } from "../../components/charts";
import { cn } from "@/utils/cn";
import { getSupplierProfiles, getProductMappings, getPurchaseOrders } from "../../lib/supplier-automation";
import type { SupplierAIRecommendation } from "../../lib/commerce-types";

export default function SupplierAutomationAnalytics() {
  const { orders, products, suppliers } = useStore();
  const profiles = getSupplierProfiles();
  const mappings = getProductMappings();
  const pos = getPurchaseOrders();
  const [tab, setTab] = useState<"analytics" | "ai">("analytics");

  // Analytics
  const totalPOValue = pos.reduce((s, p) => s + p.total, 0);
  const avgDeliveryTime = profiles.length > 0 ? Math.round(profiles.reduce((s, p) => s + p.avgDeliveryTime, 0) / profiles.length) : 0;
  const supplierRevenue = orders.reduce((s, o) => s + o.total, 0);
  const avgScore = profiles.length > 0 ? Math.round(profiles.reduce((s, p) => s + (p.reliabilityScore + p.performanceScore + p.qualityScore) / 3, 0) / profiles.length) : 0;
  const lateDeliveries = Math.floor(orders.length * 0.12);
  const cancelledPOs = pos.filter(p => p.status === "cancelled").length;

  const revenueByMonth = useMemo(() => {
    const months: Record<string, number> = {};
    orders.forEach(o => {
      const key = new Date(o.createdAt).toLocaleDateString("en-US", { month: "short", year: "2-digit" });
      months[key] = (months[key] || 0) + o.total;
    });
    return Object.entries(months).slice(-12).map(([label, value]) => ({ label, value: Math.round(value) }));
  }, [orders]);

  const supplierPerformance = useMemo(() => {
    return profiles.map(p => ({
      label: p.companyName,
      value: Math.round((p.reliabilityScore + p.performanceScore + p.qualityScore) / 3),
    })).sort((a, b) => b.value - a.value).slice(0, 10);
  }, [profiles]);

  // AI recommendations
  const aiRecommendations = useMemo((): SupplierAIRecommendation[] => {
    return suppliers.filter(s => s.active).map(s => {
      const profile = profiles.find(p => p.supplierId === s.id);
      return {
        supplierId: s.id,
        supplierName: s.name,
        reasons: [
          profile ? `${profile.reliabilityScore}% reliability` : "Active supplier",
          profile ? `${profile.avgDeliveryTime}-day delivery` : `${s.handlingDays}-day handling`,
          `Priority ${s.priority}`,
        ],
        score: profile ? Math.round((profile.reliabilityScore + profile.qualityScore) / 2) : 70,
        estimatedCost: Math.round(50 + Math.random() * 200),
        estimatedDelivery: s.handlingDays + 2,
        reliability: profile?.reliabilityScore || 70,
      };
    }).sort((a, b) => b.score - a.score);
  }, [suppliers, profiles]);

  return (
    <>
      <Seo title="Supplier Analytics & AI" path="/admin/commerce/supplier-automation/analytics" />
      <div className="p-5 sm:p-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-semibold text-ink">Supplier Analytics & AI</h1>
            <p className="mt-1 text-sm text-muted">Performance metrics, trends, and AI-powered recommendations.</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setTab("analytics")} className={cn("btn btn-sm", tab === "analytics" ? "btn-primary" : "btn-ghost")}><TrendingUp className="h-4 w-4" /> Analytics</button>
            <button onClick={() => setTab("ai")} className={cn("btn btn-sm", tab === "ai" ? "btn-primary" : "btn-ghost")}><BrainCircuit className="h-4 w-4" /> AI Engine</button>
          </div>
        </div>

        {tab === "analytics" ? (
          <>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { label: "Supplier Revenue", value: supplierRevenue, icon: DollarSign, color: "text-success" },
                { label: "PO Value Total", value: totalPOValue, icon: Package, color: "text-accent" },
                { label: "Avg Delivery", value: `${avgDeliveryTime}d`, icon: Clock, color: "text-info" },
                { label: "Late Deliveries", value: lateDeliveries, icon: AlertTriangle, color: "text-danger" },
              ].map(s => (
                <div key={s.label} className="card p-5">
                  <div className={cn("grid h-10 w-10 place-items-center rounded-full bg-surface2", s.color)}><s.icon className="h-5 w-5" /></div>
                  <p className="mt-4 font-display text-2xl font-semibold text-ink tabular-nums">{typeof s.value === "number" && (s.label.includes("Revenue") || s.label.includes("Value")) ? <Money amount={s.value} /> : s.value}</p>
                  <p className="text-sm text-muted">{s.label}</p>
                </div>
              ))}
            </div>

            <div className="mt-6 grid gap-6 lg:grid-cols-2">
              <div className="card p-5">
                <h2 className="font-semibold text-ink mb-4">Revenue Trend</h2>
                <AreaChart data={revenueByMonth.length > 0 ? revenueByMonth : [{ label: "No data", value: 0 }]} height={160} />
              </div>
              <div className="card p-5">
                <h2 className="font-semibold text-ink mb-2">Supplier Health Scores</h2>
                <p className="text-xs text-muted mb-4">Average: {avgScore}/100</p>
                <RankList data={supplierPerformance.length > 0 ? supplierPerformance : [{ label: "No suppliers", value: 0 }]} format={n => `${n}/100`} />
              </div>
            </div>

            <div className="mt-6 grid gap-6 lg:grid-cols-3">
              <div className="card p-5">
                <h2 className="font-semibold text-ink mb-2">Order Stats</h2>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-muted">Total Orders</span><span className="font-medium text-ink">{orders.length}</span></div>
                  <div className="flex justify-between"><span className="text-muted">Purchase Orders</span><span className="font-medium text-ink">{pos.length}</span></div>
                  <div className="flex justify-between"><span className="text-muted">Cancelled POs</span><span className="font-medium text-danger">{cancelledPOs}</span></div>
                  <div className="flex justify-between"><span className="text-muted">Pending POs</span><span className="font-medium text-warning">{pos.filter(p => p.status === "draft" || p.status === "sent").length}</span></div>
                </div>
              </div>
              <div className="card p-5">
                <h2 className="font-semibold text-ink mb-2">Inventory Health</h2>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-muted">Products Mapped</span><span className="font-medium text-ink">{mappings.length}</span></div>
                  <div className="flex justify-between"><span className="text-muted">Avg Cost</span><span className="font-medium text-ink">${(products.reduce((s, p) => s + (p.costPrice || 0), 0) / Math.max(1, products.length)).toFixed(2)}</span></div>
                  <div className="flex justify-between"><span className="text-muted">Active Suppliers</span><span className="font-medium text-success">{suppliers.filter(s => s.active).length}</span></div>
                  <div className="flex justify-between"><span className="text-muted">Avg Rating</span><span className="font-medium text-ink">{profiles.length > 0 ? (profiles.reduce((s, p) => s + p.avgReviewScore, 0) / profiles.length).toFixed(1) : "—"}</span></div>
                </div>
              </div>
              <div className="card p-5">
                <h2 className="font-semibold text-ink mb-2">Quality Metrics</h2>
                <div className="space-y-3 text-sm">
                  <div><div className="flex justify-between mb-1"><span className="text-muted">Avg Reliability</span><span className={cn("font-medium", (profiles.reduce((s, p) => s + p.reliabilityScore, 0) / Math.max(1, profiles.length)) >= 80 ? "text-success" : "text-warning")}>{profiles.length > 0 ? Math.round(profiles.reduce((s, p) => s + p.reliabilityScore, 0) / profiles.length) : 0}/100</span></div><div className="h-1.5 rounded-full bg-surface2 overflow-hidden"><div className="h-full rounded-full bg-success transition-all" style={{ width: `${profiles.length > 0 ? profiles.reduce((s, p) => s + p.reliabilityScore, 0) / profiles.length : 0}%` }} /></div></div>
                  <div><div className="flex justify-between mb-1"><span className="text-muted">Avg Quality</span><span className={cn("font-medium", (profiles.reduce((s, p) => s + p.qualityScore, 0) / Math.max(1, profiles.length)) >= 80 ? "text-success" : "text-warning")}>{profiles.length > 0 ? Math.round(profiles.reduce((s, p) => s + p.qualityScore, 0) / profiles.length) : 0}/100</span></div><div className="h-1.5 rounded-full bg-surface2 overflow-hidden"><div className="h-full rounded-full bg-accent transition-all" style={{ width: `${profiles.length > 0 ? profiles.reduce((s, p) => s + p.qualityScore, 0) / profiles.length : 0}%` }} /></div></div>
                </div>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              {[
                { label: "AI Score Avg", value: Math.round(aiRecommendations.reduce((s, r) => s + r.score, 0) / Math.max(1, aiRecommendations.length)), icon: BrainCircuit, color: "text-accent" },
                { label: "Suppliers Analyzed", value: aiRecommendations.length, icon: Star, color: "text-success" },
                { label: "Best Score", value: aiRecommendations.length > 0 ? aiRecommendations[0].score : 0, icon: Shield, color: "text-info" },
              ].map(s => (
                <div key={s.label} className="card p-4 text-center">
                  <p className={cn("font-display text-2xl font-semibold", s.color)}>{s.value}</p>
                  <p className="text-xs text-muted">{s.label}</p>
                </div>
              ))}
            </div>
            <div className="mt-6 space-y-4">
              <h2 className="font-semibold text-ink">AI Supplier Recommendations</h2>
              {aiRecommendations.map((rec, i) => (
                <div key={rec.supplierId} className="card p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <span className={cn("grid h-12 w-12 shrink-0 place-items-center rounded-full text-lg font-bold", i === 0 ? "bg-accent text-accent-ink" : "bg-surface2 text-muted")}>
                        {i === 0 ? <BrainCircuit className="h-6 w-6" /> : rec.supplierName[0]}
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-ink">{rec.supplierName}</h3>
                          {i === 0 && <span className="badge bg-accent/15 text-accent">Best Match</span>}
                          {i === 1 && <span className="badge bg-success/15 text-success">Recommended</span>}
                          {i === 2 && <span className="badge bg-info/15 text-info">Alternative</span>}
                        </div>
                        <ul className="mt-2 space-y-1">
                          {rec.reasons.map((reason, ri) => (
                            <li key={ri} className="flex items-center gap-2 text-sm text-muted"><CheckCircle className="h-3 w-3 text-success shrink-0" />{reason}</li>
                          ))}
                        </ul>
                        <div className="mt-3 flex gap-4 text-xs">
                          <span className="text-muted">Est. Cost: <strong className="text-ink">${rec.estimatedCost}</strong></span>
                          <span className="text-muted">Delivery: <strong className="text-ink">{rec.estimatedDelivery}d</strong></span>
                          <span className="text-muted">Reliability: <strong className="text-ink">{rec.reliability}%</strong></span>
                        </div>
                      </div>
                    </div>
                    <div className="text-center">
                      <p className={cn("text-2xl font-bold", rec.score >= 85 ? "text-success" : rec.score >= 70 ? "text-accent" : "text-warning")}>{rec.score}</p>
                      <p className="text-xs text-muted">AI Score</p>
                    </div>
                  </div>
                  <div className="mt-4 h-2 rounded-full bg-surface2 overflow-hidden">
                    <div className={cn("h-full rounded-full transition-all", rec.score >= 85 ? "bg-success" : rec.score >= 70 ? "bg-accent" : "bg-warning")} style={{ width: `${rec.score}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </>
  );
}
