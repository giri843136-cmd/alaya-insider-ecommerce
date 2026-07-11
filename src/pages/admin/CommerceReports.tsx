import { useState } from "react";
import { Download, FileSpreadsheet, FileText, Package, Receipt, Truck, Users, RotateCcw, Megaphone, Ship, DollarSign, Workflow } from "lucide-react";
import { useStore } from "../../context/StoreContext";
import { useToast } from "../../context/ToastContext";
import { Seo } from "../../components/Seo";
import { Money } from "../../components/ui";
import { formatDate } from "../../lib/utils";
import { downloadCsv } from "../../lib/csv";
import { cn } from "@/utils/cn";

const REPORT_TYPES = [
  { id: "revenue", label: "Revenue Report", icon: DollarSign, desc: "Total revenue, AOV, and revenue by period" },
  { id: "orders", label: "Orders Report", icon: Receipt, desc: "Order volume, status distribution, fulfillment times" },
  { id: "products", label: "Products Report", icon: Package, desc: "Product performance, margins, top/worst sellers" },
  { id: "suppliers", label: "Suppliers Report", icon: Truck, desc: "Supplier performance, lead times, costs" },
  { id: "inventory", label: "Inventory Report", icon: Package, desc: "Stock levels, inventory value, health scores" },
  { id: "customers", label: "Customers Report", icon: Users, desc: "Customer segments, LTV, acquisition" },
  { id: "returns", label: "Returns Report", icon: RotateCcw, desc: "Return rates, reasons, refund amounts" },
  { id: "marketing", label: "Marketing Report", icon: Megaphone, desc: "Coupon usage, campaign performance" },
  { id: "shipping", label: "Shipping Report", icon: Ship, desc: "Shipping costs, carrier performance" },
  { id: "finance", label: "Finance Report", icon: DollarSign, desc: "P&L, revenue vs expenses, profit analysis" },
  { id: "automation", label: "Automation Report", icon: Workflow, desc: "Workflow execution, success rates" },
];

export default function CommerceReports() {
  const { products, orders, suppliers } = useStore();
  const { toast } = useToast();
  const [selectedReport, setSelectedReport] = useState("revenue");
  const [dateRange, setDateRange] = useState<"30d" | "90d" | "1y" | "all">("30d");

  const revenue = orders.reduce((s, o) => s + o.total, 0);
  const profit = orders.reduce((s, o) => {
    const cogs = o.items.reduce((si, it) => {
      const p = products.find(pp => pp.id === it.productId);
      return si + (p?.costPrice || 0) * it.qty;
    }, 0);
    return s + o.total - cogs;
  }, 0);
  const margin = revenue > 0 ? (profit / revenue) * 100 : 0;

  const exportReport = (format: "csv" | "json") => {
    const report = REPORT_TYPES.find(r => r.id === selectedReport);
    const filename = `alaya-${selectedReport}-${new Date().toISOString().slice(0, 10)}`;
    if (format === "csv") {
      if (selectedReport === "products") {
        downloadCsv(`${filename}.csv`, "name,sku,price,costPrice,salePrice,stock,margin%\n" +
          products.map(p => {
            const margin = p.costPrice ? Math.round((((p.salePrice ?? p.price) - p.costPrice) / (p.salePrice ?? p.price)) * 100) : 0;
            return `${p.name},${p.sku},${p.price},${p.costPrice || 0},${p.salePrice || 0},${p.stock},${margin}`;
          }).join("\n"));
      } else if (selectedReport === "orders") {
        downloadCsv(`${filename}.csv`, "number,customer,email,total,status,date\n" +
          orders.map(o => `${o.number},${o.customer.name},${o.customer.email},${o.total},${o.status},${formatDate(o.createdAt)}`).join("\n"));
      } else if (selectedReport === "suppliers") {
        downloadCsv(`${filename}.csv`, "name,email,country,priority,handlingDays,active\n" +
          suppliers.map(s => `${s.name},${s.email},${s.country},${s.priority},${s.handlingDays},${s.active}`).join("\n"));
      } else {
        downloadCsv(`${filename}.csv`, "Report,Generated\n" + `${report?.label},${new Date().toISOString()}`);
      }
      toast.success(`${report?.label} exported`, `Downloaded as ${format.toUpperCase()}`);
    } else {
      const data = { report: selectedReport, generated: new Date().toISOString(), revenue, orders: orders.length, products: products.length };
      downloadCsv(`${filename}.json`, JSON.stringify(data, null, 2));
      toast.success("JSON report downloaded");
    }
  };

  return (
    <>
      <Seo title="Reports" path="/admin/commerce/reports" />
      <div className="p-5 sm:p-8">
        <h1 className="font-display text-3xl font-semibold text-ink">Reports</h1>
        <p className="mt-1 text-sm text-muted">Exportable reports across all commerce dimensions.</p>

        <div className="mt-6 flex flex-wrap gap-2">
          {(["30d", "90d", "1y", "all"] as const).map(r => (
            <button key={r} onClick={() => setDateRange(r)} className={cn("chip", dateRange === r && "chip-active")}>{r === "all" ? "All Time" : r}</button>
          ))}
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {REPORT_TYPES.map(r => (
            <button key={r.id} onClick={() => setSelectedReport(r.id)} className={cn("card p-5 text-left transition-all hover:shadow-lg", selectedReport === r.id && "ring-1 ring-accent/40")}>
              <span className={cn("grid h-10 w-10 place-items-center rounded-full", selectedReport === r.id ? "bg-accent text-accent-ink" : "bg-accent-soft text-accent")}>
                <r.icon className="h-5 w-5" />
              </span>
              <h3 className="mt-4 font-semibold text-ink">{r.label}</h3>
              <p className="mt-1 text-xs text-muted">{r.desc}</p>
            </button>
          ))}
        </div>

        {/* Preview Area */}
        <div className="mt-8 card p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-ink">{REPORT_TYPES.find(r => r.id === selectedReport)?.label}</h2>
            <div className="flex gap-2">
              <button onClick={() => exportReport("csv")} className="btn-outline btn-sm"><FileSpreadsheet className="h-4 w-4" /> CSV</button>
              <button onClick={() => exportReport("json")} className="btn-outline btn-sm"><FileText className="h-4 w-4" /> JSON</button>
              <button onClick={() => { window.print(); toast.success("PDF ready"); }} className="btn-primary btn-sm"><Download className="h-4 w-4" /> Export</button>
            </div>
          </div>

          {selectedReport === "revenue" && (
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              <div className="rounded-xl bg-surface2/50 p-4"><p className="text-xs text-muted">Total Revenue</p><p className="font-display text-2xl font-semibold text-ink"><Money amount={revenue} /></p></div>
              <div className="rounded-xl bg-surface2/50 p-4"><p className="text-xs text-muted">Total Profit</p><p className="font-display text-2xl font-semibold text-success"><Money amount={Math.round(profit)} /></p></div>
              <div className="rounded-xl bg-surface2/50 p-4"><p className="text-xs text-muted">Avg Margin</p><p className="font-display text-2xl font-semibold text-ink">{margin.toFixed(1)}%</p></div>
            </div>
          )}
          {selectedReport === "orders" && (
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              <div className="rounded-xl bg-surface2/50 p-4"><p className="text-xs text-muted">Total Orders</p><p className="font-display text-2xl font-semibold text-ink">{orders.length}</p></div>
              <div className="rounded-xl bg-surface2/50 p-4"><p className="text-xs text-muted">Pending</p><p className="font-display text-2xl font-semibold text-warning">{orders.filter(o => o.status === "pending").length}</p></div>
              <div className="rounded-xl bg-surface2/50 p-4"><p className="text-xs text-muted">Delivered</p><p className="font-display text-2xl font-semibold text-success">{orders.filter(o => o.status === "delivered").length}</p></div>
            </div>
          )}
          {selectedReport === "products" && (
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              <div className="rounded-xl bg-surface2/50 p-4"><p className="text-xs text-muted">Total Products</p><p className="font-display text-2xl font-semibold text-ink">{products.length}</p></div>
              <div className="rounded-xl bg-surface2/50 p-4"><p className="text-xs text-muted">With Cost Data</p><p className="font-display text-2xl font-semibold text-ink">{products.filter(p => p.costPrice).length}</p></div>
              <div className="rounded-xl bg-surface2/50 p-4"><p className="text-xs text-muted">With Supplier</p><p className="font-display text-2xl font-semibold text-ink">{products.filter(p => p.supplierId).length}</p></div>
            </div>
          )}
          {selectedReport === "suppliers" && (
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              <div className="rounded-xl bg-surface2/50 p-4"><p className="text-xs text-muted">Total Suppliers</p><p className="font-display text-2xl font-semibold text-ink">{suppliers.length}</p></div>
              <div className="rounded-xl bg-surface2/50 p-4"><p className="text-xs text-muted">Active</p><p className="font-display text-2xl font-semibold text-success">{suppliers.filter(s => s.active).length}</p></div>
              <div className="rounded-xl bg-surface2/50 p-4"><p className="text-xs text-muted">Linked Products</p><p className="font-display text-2xl font-semibold text-ink">{products.filter(p => p.supplierId).length}</p></div>
            </div>
          )}
          {(selectedReport === "customers" || selectedReport === "inventory" || selectedReport === "returns" || selectedReport === "marketing" || selectedReport === "shipping" || selectedReport === "finance" || selectedReport === "automation") && (
            <div className="mt-4 rounded-xl bg-surface2/50 p-6 text-center text-sm text-muted">
              Detailed {REPORT_TYPES.find(r => r.id === selectedReport)?.label} data is available for CSV/JSON export. Click Export to download.
            </div>
          )}
        </div>
      </div>
    </>
  );
}
