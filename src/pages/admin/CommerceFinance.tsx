import { useState } from "react";
import { DollarSign, TrendingUp, TrendingDown, FileText, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { useStore } from "../../context/StoreContext";
import { Seo } from "../../components/Seo";
import { Money } from "../../components/ui";
import { formatDate } from "../../lib/utils";
import { cn } from "@/utils/cn";
import { BarChart } from "../../components/charts";

const TRANSACTION_STORAGE_KEY = "alaya_finance_transactions_v1";

interface FinanceTx { id: string; type: "revenue" | "expense" | "refund"; category: string; description: string; amount: number; date: number; }

function loadTransactions(): FinanceTx[] {
  try { const r = localStorage.getItem(TRANSACTION_STORAGE_KEY); if (r) return JSON.parse(r); } catch {}
  const now = Date.now();
  return [
    { id: "tx_1", type: "revenue", category: "Sales", description: "Monthly order revenue", amount: 24500, date: now - 86400000 * 2 },
    { id: "tx_2", type: "expense", category: "Supplier Payments", description: "Supplier costs for orders", amount: -12800, date: now - 86400000 * 3 },
    { id: "tx_3", type: "expense", category: "Shipping", description: "Carrier costs", amount: -2400, date: now - 86400000 * 4 },
    { id: "tx_4", type: "expense", category: "Marketing", description: "Campaign spend", amount: -3200, date: now - 86400000 * 5 },
    { id: "tx_5", type: "refund", category: "Returns", description: "Customer refunds", amount: -1500, date: now - 86400000 * 6 },
    { id: "tx_6", type: "expense", category: "Fees", description: "Payment processing fees", amount: -850, date: now - 86400000 * 7 },
    { id: "tx_7", type: "revenue", category: "Affiliate", description: "Affiliate commission revenue", amount: 3200, date: now - 86400000 * 8 },
    { id: "tx_8", type: "expense", category: "Tools", description: "SaaS subscriptions", amount: -980, date: now - 86400000 * 10 },
  ];
}

export default function CommerceFinance() {
  const { products, orders } = useStore();
  const [transactions] = useState<FinanceTx[]>(loadTransactions);

  const totalRevenue = orders.reduce((s, o) => s + o.total, 0) + transactions.filter(t => t.type === "revenue").reduce((s, t) => s + t.amount, 0);
  const totalExpenses = Math.abs(transactions.filter(t => t.type === "expense" || t.type === "refund").reduce((s, t) => s + t.amount, 0));
  const totalProfit = totalRevenue - totalExpenses;
  const profitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;
  const totalCOGS = orders.reduce((s, o) => s + o.items.reduce((si, it) => {
    const p = products.find(pp => pp.id === it.productId);
    return si + (p?.costPrice || 0) * it.qty;
  }, 0), 0);

  const expenseCategories = transactions.filter(t => t.type === "expense" || t.type === "refund").reduce((acc: Record<string, number>, t) => {
    acc[t.category] = (acc[t.category] || 0) + Math.abs(t.amount);
    return acc;
  }, {});

  const chartData = Array.from({ length: 12 }, (_, i) => ({
    label: ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][i],
    value: Math.round(totalRevenue / 12 * (0.7 + Math.random() * 0.6)),
  }));

  return (
    <>
      <Seo title="Finance" path="/admin/commerce/finance" />
      <div className="p-5 sm:p-8">
        <h1 className="font-display text-3xl font-semibold text-ink">Finance</h1>
        <p className="mt-1 text-sm text-muted">P&L, revenue tracking, expense management, and profit analysis.</p>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Total Revenue", value: totalRevenue, icon: TrendingUp, color: "text-success" },
            { label: "Total Expenses", value: totalExpenses, icon: TrendingDown, color: "text-danger" },
            { label: "Net Profit", value: totalProfit, icon: DollarSign, color: totalProfit >= 0 ? "text-success" : "text-danger" },
            { label: "Profit Margin", value: profitMargin.toFixed(1) + "%", icon: TrendingUp, color: profitMargin >= 20 ? "text-success" : "text-warning" },
          ].map(s => (
            <div key={s.label} className="card p-5">
              <div className="flex items-center justify-between">
                <span className={cn("grid h-10 w-10 place-items-center rounded-full bg-surface2", s.color.replace("text-", "text-"))}><s.icon className="h-5 w-5" /></span>
                {s.color.includes("success") ? <ArrowUpRight className="h-4 w-4 text-success" /> : <ArrowDownRight className="h-4 w-4 text-danger" />}
              </div>
              <p className={cn("mt-4 font-display text-2xl font-semibold tabular-nums", s.color)}>{typeof s.value === "number" ? <Money amount={s.value} /> : s.value}</p>
              <p className="text-sm text-muted">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <div className="card p-5">
            <h2 className="font-semibold text-ink mb-4">Revenue Trend</h2>
            <BarChart data={chartData} height={160} />
          </div>
          <div className="card p-5">
            <h2 className="font-semibold text-ink mb-4">Expense Breakdown</h2>
            <div className="space-y-3">
              {Object.entries(expenseCategories).map(([cat, amount]) => {
                const pct = (amount / Math.max(1, totalExpenses)) * 100;
                return (
                  <div key={cat}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-muted">{cat}</span>
                      <span className="font-medium text-ink"><Money amount={amount} /> ({pct.toFixed(0)}%)</span>
                    </div>
                    <div className="h-2 rounded-full bg-surface2 overflow-hidden">
                      <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* P&L Summary */}
        <div className="mt-6 card p-5">
          <h2 className="font-semibold text-ink mb-4 flex items-center gap-2"><FileText className="h-4 w-4 text-accent" /> Profit & Loss Summary</h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between"><span className="text-muted">Total Revenue</span><span className="font-semibold text-success"><Money amount={totalRevenue} /></span></div>
            <div className="flex justify-between"><span className="text-muted">Cost of Goods Sold</span><span className="font-medium text-ink"><Money amount={totalCOGS} /></span></div>
            <div className="flex justify-between"><span className="text-muted">Gross Profit</span><span className="font-semibold text-success"><Money amount={totalRevenue - totalCOGS} /> ({(totalRevenue > 0 ? ((totalRevenue - totalCOGS) / totalRevenue) * 100 : 0).toFixed(1)}%)</span></div>
            <div className="border-t border-line pt-2 mt-2">
              <div className="flex justify-between"><span className="text-muted">Operating Expenses</span><span className="font-medium text-danger"><Money amount={totalExpenses} /></span></div>
            </div>
            <div className="border-t-2 border-line pt-2 mt-2">
              <div className="flex justify-between"><span className="font-semibold text-ink">Net Profit</span><span className={cn("font-bold", totalProfit >= 0 ? "text-success" : "text-danger")}><Money amount={totalProfit} /></span></div>
            </div>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="mt-6 card overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-line">
            <h2 className="font-semibold text-ink">Recent Transactions</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-surface2/50 text-left text-xs uppercase tracking-wider text-muted">
                <tr><th className="px-4 py-3">Date</th><th className="px-4 py-3">Description</th><th className="px-4 py-3">Category</th><th className="px-4 py-3 text-right">Amount</th></tr>
              </thead>
              <tbody className="divide-y divide-line">
                {transactions.sort((a, b) => b.date - a.date).map(t => (
                  <tr key={t.id} className="hover:bg-surface2/40">
                    <td className="px-4 py-3 text-muted text-xs">{formatDate(t.date)}</td>
                    <td className="px-4 py-3 text-ink">{t.description}</td>
                    <td className="px-4 py-3"><span className="badge bg-surface2 text-muted">{t.category}</span></td>
                    <td className="px-4 py-3 text-right">
                      <span className={cn("font-semibold", t.amount > 0 ? "text-success" : "text-danger")}>
                        {t.amount > 0 ? "+" : ""}<Money amount={t.amount} />
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
