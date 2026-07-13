import { useEffect, useState } from "react";
import { NavLink, Navigate, Outlet, Link, useNavigate } from "react-router-dom";
import { CommandPalette } from "./CommandPalette";
import { useSecurity } from "../../context/SecurityContext";
import {
  LayoutDashboard,
  LayoutTemplate,
  Package,
  Tags,
  Gem,
  Receipt,
  Ticket,
  Newspaper,
  Handshake,
  ScrollText,
  Settings as SettingsIcon,
  LogOut,
  ShoppingBag,
  Menu,
  Warehouse as WarehouseIcon,
  PackageOpen,
  Calculator,
  Ship,
  FileBarChart,
  Banknote,
  Settings2,
  BrainCircuit,
  Sun,
  Moon,
  ExternalLink,
  Search,
  RotateCcw,
  Users,
  Truck,
  CreditCard,
  Star,
  Megaphone,
  BarChart3,
  Server,
  ShieldCheck,
  Sparkles,
  Brain,
  Palette,
  Zap,
  BookOpen,
  Image as ImageIcon,
  Code2,
  Activity,
  Fingerprint,
  Network,
  Radio,
  Eye,
  TrendingUp,
  Globe, Shield, FlaskConical, Monitor,
  Database as DatabaseIcon,
  Workflow,  Wrench,
  Smile,
  Layers,
  DollarSign,
  MousePointerClick,
  Bell,
  Bot,
  Target,
  Smartphone,
  ShieldAlert,
  MapPin,
  Play,
  AlertTriangle,
  Calendar,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { useStore } from "../../context/StoreContext";
import { cn } from "@/utils/cn";
import { BackendStatusDot } from "./BackendStatusDot";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAdmin } = useAuth();
  if (!isAdmin) return <Navigate to="/admin/login" replace />;
  return <>{children}</>;
}

const NAV = [
  { to: "/admin", end: true, label: "Dashboard", icon: LayoutDashboard },
  { to: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/admin/business-intelligence", label: "BI Platform", icon: BarChart3 },
  { to: "/admin/homepage", label: "Homepage", icon: LayoutTemplate },
  { to: "/admin/design", label: "Design Studio", icon: Palette },
  { to: "/admin/media", label: "Media Library", icon: ImageIcon },
  { to: "/admin/dam", label: "DAM Suite", icon: Layers },
  { to: "/admin/content-platform", label: "Content Platform", icon: BookOpen },
  { to: "/admin/products", label: "Products", icon: Package },
  { to: "/admin/categories", label: "Categories", icon: Tags },
  { to: "/admin/brands", label: "Brands", icon: Gem },
  { to: "/admin/orders", label: "Orders", icon: Receipt },
  { to: "/admin/returns", label: "Returns", icon: RotateCcw },
  { to: "/admin/coupons", label: "Coupons", icon: Ticket },
  { to: "/admin/customers", label: "Customers", icon: Users },
  { to: "/admin/crm", label: "CRM", icon: Users },
  { to: "/admin/customer-experience", label: "CX Platform", icon: Smile },
  { to: "/admin/reviews", label: "Reviews", icon: Star },
  { to: "/admin/journal", label: "Journal", icon: Newspaper },
  { to: "/admin/affiliates", label: "Affiliates", icon: Handshake },
  { to: "/admin/suppliers", label: "Suppliers", icon: Truck },
  { to: "/admin/gateways", label: "Payments", icon: CreditCard },
  { to: "/admin/marketing", label: "Marketing", icon: Megaphone },
  { to: "/admin/marketing-platform", label: "Marketing Platform", icon: TrendingUp },
  { to: "/admin/globalization-platform", label: "Globalization", icon: Globe },
  { to: "/admin/governance-platform", label: "Governance", icon: Shield },
  { to: "/admin/developer-platform", label: "Developer", icon: Wrench },
  { to: "/admin/testing-platform", label: "Testing Platform", icon: FlaskConical },
  { to: "/admin/operations-platform", label: "Operations Center", icon: Monitor },
  { to: "/admin/seo", label: "SEO Studio", icon: Search },
  { to: "/admin/activity", label: "Activity log", icon: ScrollText },
  { to: "/admin/system", label: "System", icon: Server },
  { to: "/admin/gateway", label: "Gateway", icon: Network },
  { to: "/admin/communications", label: "Communications", icon: Radio },
  { to: "/admin/observability", label: "Observability", icon: Eye },
  { to: "/admin/data", label: "Data Platform", icon: DatabaseIcon },
  { to: "/admin/identity", label: "Identity", icon: Fingerprint },
  { to: "/admin/authentication", label: "Authentication", icon: ShieldCheck },
  { to: "/admin/session-manager", label: "Sessions", icon: Activity },
  { to: "/admin/recovery", label: "Recovery Center", icon: ShieldAlert },
  { to: "/admin/auth-settings", label: "Auth Settings", icon: ShieldCheck },
  { to: "/admin/devops", label: "DevOps", icon: Activity },
  { to: "/admin/security", label: "Security", icon: ShieldCheck },
  { to: "/admin/ai", label: "AI Workspace", icon: Sparkles },
  { to: "/admin/intelligence", label: "AI Platform", icon: Brain },
  { to: "/admin/ai-platform", label: "AI Commerce", icon: BrainCircuit },
  { to: "/admin/workflows", label: "Workflows", icon: Zap },
  { to: "/admin/workflows-bpm", label: "BPM Platform", icon: Workflow },
  /* ================ COMMERCE ================ */
  { to: "/admin/commerce", end: true, label: "Commerce Dashboard", icon: ShoppingBag },
  { to: "/admin/commerce/products", label: "Products", icon: Package },
  { to: "/admin/commerce/orders", label: "Orders", icon: Receipt },
  { to: "/admin/commerce/inventory", label: "Inventory", icon: PackageOpen },
  { to: "/admin/commerce/suppliers", label: "Suppliers", icon: Truck },
  { to: "/admin/commerce/warehouses", label: "Warehouses", icon: WarehouseIcon },
  { to: "/admin/commerce/shipping", label: "Profiles", icon: Ship },
  { to: "/admin/commerce/pricing", label: "Pricing Engine", icon: Calculator },
  { to: "/admin/commerce/customers", label: "Customers", icon: Users },
  { to: "/admin/commerce/returns", label: "Returns", icon: RotateCcw },
  { to: "/admin/commerce/marketing", label: "Marketing", icon: Megaphone },
  { to: "/admin/commerce/automation", label: "Automation", icon: Workflow },
  { to: "/admin/commerce/reports", label: "Reports", icon: FileBarChart },
  { to: "/admin/commerce/finance", label: "Finance", icon: Banknote },
  { to: "/admin/commerce/ai", label: "AI Commerce", icon: BrainCircuit },
  { to: "/admin/commerce/settings", label: "Settings", icon: Settings2 },
  /* === SUPPLIER AUTOMATION === */
  { to: "/admin/commerce/supplier-automation", end: true, label: "Supplier Automation", icon: Zap },
  { to: "/admin/commerce/supplier-automation/directory", label: "Directory", icon: Truck },
  { to: "/admin/commerce/supplier-automation/communications", label: "Communications", icon: Radio },
  { to: "/admin/commerce/supplier-automation/mapping", label: "Product Mapping", icon: Layers },
  { to: "/admin/commerce/supplier-automation/purchase-orders", label: "Purchase Orders", icon: Receipt },
  { to: "/admin/commerce/supplier-automation/tracking", label: "Tracking & Sync", icon: Activity },
  { to: "/admin/commerce/supplier-automation/failover", label: "Failover & Pricing", icon: Shield },
  { to: "/admin/commerce/supplier-automation/analytics", label: "Analytics & AI", icon: BrainCircuit },
  { to: "/admin/commerce/supplier-automation/control-center", label: "Control Center", icon: Settings2 },
  /* === SHIPPING & LOGISTICS (PR-5) === */
  { to: "/admin/shipping", end: true, label: "Shipping Dashboard", icon: Ship },
  { to: "/admin/shipping/carriers", label: "Carrier Manager", icon: Truck },
  { to: "/admin/shipping/shipments", label: "Shipment Manager", icon: Package },
  { to: "/admin/shipping/tracking", label: "Tracking Center", icon: MapPin },
  { to: "/admin/shipping/analytics", label: "Shipping Analytics", icon: BarChart3 },
  { to: "/admin/shipping/health", label: "Carrier Health", icon: Activity },
  /* === ORDER ORCHESTRATOR (PR-6) === */
  { to: "/admin/orchestrator", end: true, label: "Order Orchestrator", icon: Server },
  { to: "/admin/orchestrator/running", label: "Running", icon: Play },
  { to: "/admin/orchestrator/queues", label: "Queues", icon: Radio },
  { to: "/admin/orchestrator/events", label: "Events", icon: Zap },
  { to: "/admin/orchestrator/failures", label: "Failures", icon: AlertTriangle },
  /* === ENTERPRISE AUTOMATION (PR-7) === */
  { to: "/admin/automation", end: true, label: "Automation Platform", icon: Zap },
  { to: "/admin/automation/rules", label: "Rules", icon: Play },
  { to: "/admin/automation/jobs", label: "Jobs", icon: Radio },
  { to: "/admin/automation/workers", label: "Workers", icon: Users },
  { to: "/admin/automation/schedules", label: "Schedules", icon: Calendar },
  { to: "/admin/automation/logs", label: "Logs", icon: BookOpen },
  /* ================ END COMMERCE ================ */
  { to: "/admin/commerce-platform", label: "Commerce Platform", icon: ShoppingBag },
  { to: "/admin/developer", label: "Developer", icon: Code2 },
  { to: "/admin/editorial", label: "Editorial", icon: BookOpen },
  { to: "/admin/authors", label: "Authors", icon: BookOpen },
  { to: "/admin/navigation", label: "Navigation", icon: Globe },
  { to: "/admin/taxonomy", label: "Taxonomy", icon: Tags },
  { to: "/admin/recommendations", label: "Recommendations", icon: Sparkles },
  { to: "/admin/discovery", label: "Discovery", icon: Eye },
  { to: "/admin/search-platform", label: "Search Platform", icon: Search },
  { to: "/admin/collection-builder", label: "Collection Builder", icon: Layers },
  { to: "/admin/affiliate-analytics", label: "Affiliate Analytics", icon: BarChart3 },
  { to: "/admin/marketplace-registry", label: "Marketplace Registry", icon: Globe },
  { to: "/admin/commission-engine", label: "Commission Engine", icon: DollarSign },
  { to: "/admin/price-intelligence", label: "Price Intelligence", icon: TrendingUp },
  { to: "/admin/revenue-intelligence", label: "Revenue Intelligence", icon: BarChart3 },
  { to: "/admin/conversion-optimization", label: "Conversion Opt.", icon: MousePointerClick },
  { to: "/admin/executive-center", label: "Executive Center", icon: LayoutDashboard },
  { to: "/admin/operations-center", label: "Operations Center", icon: Activity },
  { to: "/admin/notifications", label: "Notifications", icon: Bell },
  { to: "/admin/notification-dashboard", label: "Notif. Dashboard", icon: BarChart3 },
  { to: "/admin/reporting", label: "Reporting", icon: BarChart3 },
  { to: "/admin/ai-admin", label: "AI Admin", icon: Sparkles },
  { to: "/admin/developer-tools", label: "Dev Tools", icon: Code2 },
  { to: "/admin/operations-queues", label: "Operations Queues", icon: Activity },
  { to: "/admin/administration", label: "Administration", icon: ShieldCheck },
  { to: "/admin/ai-workspace", label: "AI Workspace", icon: Sparkles },
  { to: "/admin/ai-agent-registry", label: "AI Agents", icon: Bot },
  { to: "/admin/ai-task-manager", label: "AI Tasks", icon: Target },
  { to: "/admin/ai-knowledge", label: "AI Knowledge", icon: Brain },
  { to: "/admin/ai-observability", label: "AI Monitor", icon: Activity },
  { to: "/admin/ai-business-ops", label: "AI Business", icon: TrendingUp },
  { to: "/admin/executive-intelligence", label: "Executive Intel", icon: LayoutDashboard },
  { to: "/admin/business-health", label: "Business Health", icon: Activity },
  { to: "/admin/forecasting", label: "Forecasting", icon: TrendingUp },
  { to: "/admin/decision-intelligence", label: "Decision Intel", icon: Shield },
  { to: "/admin/digital-twin", label: "Digital Twin", icon: Activity },
  { to: "/admin/executive-reports", label: "Exec Reports", icon: BarChart3 },
  { to: "/admin/executive-ai", label: "Exec AI", icon: Sparkles },
  { to: "/admin/mobile-experience", label: "Mobile Experience", icon: Smartphone },
  { to: "/admin/pwa-dashboard", label: "PWA Dashboard", icon: Monitor },
  { to: "/admin/synchronization", label: "Sync Manager", icon: RotateCcw },
  { to: "/admin/performance-dashboard", label: "Performance", icon: Activity },
  { to: "/admin/performance-platform", label: "Perf Platform", icon: TrendingUp },
  { to: "/admin/integrations", label: "Integrations", icon: Globe },
  { to: "/admin/settings", label: "Settings", icon: SettingsIcon },
];

export default function AdminLayout() {
  const { logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { settings } = useStore();
  const navigate = useNavigate();
  const { log: logSecurity } = useSecurity();
  const [open, setOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);

  const onLogout = () => {
    logSecurity("logout", "admin", "Signed out");
    logout();
    navigate("/admin/login");
  };

  // Cmd/Ctrl+K to open the command palette
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const Sidebar = (
    <>
      <div className="flex items-center gap-2 shrink-0 px-6 py-5">
        <Link to="/" className="flex flex-col leading-none">
          <span className="font-display text-lg font-semibold tracking-[0.28em] text-ink">{settings.storeShort}</span>
          <span className="text-[0.55rem] uppercase tracking-[0.4em] text-muted">Admin</span>
        </Link>
      </div>
      <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto overscroll-contain px-3 py-4" aria-label="Admin navigation">
        {NAV.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={() => setOpen(false)}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                isActive ? "bg-accent-soft text-accent" : "text-muted hover:bg-surface2 hover:text-ink hover:translate-x-0.5"
              )
            }
          >
            <item.icon className="h-4.5 w-4.5" style={{ width: 18, height: 18 }} />
            {item.label}
          </NavLink>
        ))}
      </nav>
      <div className="shrink-0 space-y-1 border-t border-line px-3 py-4">
        <Link to="/" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted transition-colors hover:bg-surface2 hover:text-ink">
          <ExternalLink className="h-[18px] w-[18px]" /> View store
        </Link>
        <button onClick={toggleTheme} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted transition-colors hover:bg-surface2 hover:text-ink">
          {theme === "dark" ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
          {theme === "dark" ? "Light mode" : "Dark mode"}
        </button>
        <button onClick={onLogout} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-danger transition-colors hover:bg-danger/10">
          <LogOut className="h-[18px] w-[18px]" /> Sign out
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-canvas">
      {/* Desktop sidebar - fixed position */}
      <aside className="fixed left-0 top-0 z-40 hidden h-screen w-[260px] flex-col overflow-hidden border-r border-line bg-surface lg:flex" style={{ position: 'fixed' }}>{Sidebar}</aside>

      {/* Mobile top bar */}
      <div className="sticky top-0 z-40 flex items-center justify-between border-b border-line bg-surface px-4 py-3 lg:hidden">
        <button onClick={() => setOpen(true)} aria-label="Open menu" className="grid h-10 w-10 place-items-center rounded-full hover:bg-surface2">
          <Menu className="h-5 w-5" />
        </button>
        <span className="font-display text-base font-semibold tracking-[0.25em]">{settings.storeShort}</span>
        <button onClick={toggleTheme} aria-label="Toggle theme" className="grid h-10 w-10 place-items-center rounded-full hover:bg-surface2">
          {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in" onClick={() => setOpen(false)} aria-hidden="true" />
          <aside className="absolute inset-y-0 left-0 flex h-full flex-col overflow-hidden w-72 bg-surface animate-drawer-left">{Sidebar}</aside>
        </div>
      )}

      <div className="flex min-h-screen flex-col lg:ml-[260px]">
        {/* Desktop top bar */}
        <header className="sticky top-0 z-30 hidden items-center justify-between gap-4 border-b border-line bg-surface/80 px-6 py-3 backdrop-blur lg:flex">
          <button onClick={() => setPaletteOpen(true)} className="group flex w-full max-w-md items-center gap-2 rounded-lg border border-line bg-surface2/60 px-3 py-2 text-sm text-muted transition-colors hover:border-accent">
            <Search className="h-4 w-4" />
            <span>Search or jump to…</span>
            <kbd className="ml-auto rounded border border-line bg-surface px-1.5 py-0.5 text-[0.65rem] text-muted">⌘K</kbd>
          </button>
          <div className="flex items-center gap-2">
            <BackendStatusDot />
            <Link to="/" target="_blank" rel="noopener" className="btn-ghost btn-sm"><ExternalLink className="h-4 w-4" /> View store</Link>
          </div>
        </header>

        <main className="min-h-screen flex-1">
          <Outlet />
        </main>
      </div>

      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </div>
  );
}
