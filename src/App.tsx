import { lazy, Suspense } from "react";
import { HashRouter, Navigate, Route, Routes } from "react-router-dom";
import { composeProviderGroups } from "./lib/ProviderComposer";
import { StoreProvider } from "./context/StoreContext";
import { ThemeProvider } from "./context/ThemeContext";
import { LanguageProvider } from "./context/LanguageContext";
import { AuthProvider } from "./context/AuthContext";
import { AccountProvider } from "./context/AccountContext";
import { ToastProvider } from "./context/ToastContext";
import { SecurityProvider } from "./context/SecurityContext";
import { CommerceProvider } from "./context/CommerceContext";
import { QuickViewProvider } from "./context/QuickViewContext";
import { Layout } from "./components/Layout";
import { SiteSchema } from "./components/Seo";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { ProtectedRoute } from "./components/admin/ProtectedRoute";
import { flags } from "./lib/featureFlags";

/* ================================================================== */
/*  PROVIDER ARCHITECTURE                                              */
/* ------------------------------------------------------------------  */
/*  Organised by dependency groups. Enterprise platforms (Identity,    */
/*  Gateway, Communication, Observability, Data, Intelligence, BI)     */
/*  are lazy-mounted inside AdminLayout — they never mount on          */
/*  storefront pages, reducing unnecessary renders and bundle cost.    */
/*                                                                      */
/*  Group 0 — Foundation  (StoreProvider)                               */
/*  Group 1 — Core UI     (Language, Theme, Auth, Account)              */
/*  Group 2 — Utilities   (Toast)                                       */
/*  Group 3 — Commerce    (Commerce, QuickView)                         */
/* ================================================================== */

const AppProviders = composeProviderGroups(
  /* Group 0 – Foundation */
  [StoreProvider],

  /* Group 1 – Core UI: depend on StoreContext */
  [LanguageProvider, ThemeProvider, AuthProvider, AccountProvider],

  /* Group 2 – Utilities: no Store dependency */
  [SecurityProvider, ToastProvider],

  /* Group 3 – Commerce: Navbar/CartDrawer use useCommerce for badge counts */
  // CommerceProvider must be mounted even in affiliate-only mode because
  // Navbar, CartDrawer, ProductCard, and other storefront components call
  // useCommerce() on every page render. The /cart and /checkout routes are
  // guarded by ENABLE_ECOMMERCE flag — they redirect to /shop when disabled.
  [CommerceProvider, QuickViewProvider],
);

// Lazy-loaded storefront pages — only loaded when navigated to
const AdminLayout = lazy(() => import("./components/admin/AdminLayout"));
const Home = lazy(() => import("./pages/Home"));
const Shop = lazy(() => import("./pages/Shop"));
const ProductDetail = lazy(() => import("./pages/ProductDetail"));
const Cart = lazy(() => import("./pages/Cart"));
const Checkout = lazy(() => import("./pages/Checkout"));
const Wishlist = lazy(() => import("./pages/Wishlist"));
const Compare = lazy(() => import("./pages/Compare"));
const Account = lazy(() => import("./pages/Account"));
const Brands = lazy(() => import("./pages/Brands"));
const BrandDetail = lazy(() => import("./pages/BrandDetail"));
const Collections = lazy(() => import("./pages/Collections"));
const CollectionPage = lazy(() => import("./pages/CollectionPage"));
const RecentlyViewed = lazy(() => import("./pages/RecentlyViewed"));
const TrackOrder = lazy(() => import("./pages/TrackOrder"));
const LegalPage = lazy(() => import("./pages/LegalPage"));
const Journal = lazy(() => import("./pages/Journal"));
const ArticleDetail = lazy(() => import("./pages/ArticleDetail"));
const About = lazy(() => import("./pages/About"));
const FAQ = lazy(() => import("./pages/FAQ"));
const Contact = lazy(() => import("./pages/Contact"));
const ErrorPage = lazy(() => import("./pages/ErrorPage"));
const NotFound = lazy(() => import("./pages/NotFound"));
const CustomerAuth = lazy(() => import("./pages/CustomerAuth"));

// Lazy-loaded admin pages
const AdminLogin = lazy(() => import("./pages/admin/AdminLogin"));
const Dashboard = lazy(() => import("./pages/admin/Dashboard"));
const AdminProducts = lazy(() => import("./pages/admin/AdminProducts"));
const AdminCategories = lazy(() => import("./pages/admin/AdminCategories"));
const AdminBrands = lazy(() => import("./pages/admin/AdminBrands"));
const AdminOrders = lazy(() => import("./pages/admin/AdminOrders"));
const AdminCoupons = lazy(() => import("./pages/admin/AdminCoupons"));
const AdminArticles = lazy(() => import("./pages/admin/AdminArticles"));
const AdminAffiliates = lazy(() => import("./pages/admin/AdminAffiliates"));
const AdminMerchants = lazy(() => import("./pages/admin/AdminMerchants"));
const AdminMerchantImport = lazy(() => import("./pages/admin/AdminMerchantImport"));
const AdminCommercePlatform = lazy(() => import("./pages/admin/AdminCommercePlatform"));
const CommerceDashboard = lazy(() => import("./pages/admin/CommerceDashboard"));
const CommerceProducts = lazy(() => import("./pages/admin/CommerceProducts"));
const CommerceOrders = lazy(() => import("./pages/admin/CommerceOrders"));
const CommerceInventory = lazy(() => import("./pages/admin/CommerceInventory"));
const CommerceSuppliers = lazy(() => import("./pages/admin/CommerceSuppliers"));
const CommerceWarehouses = lazy(() => import("./pages/admin/CommerceWarehouses"));
const CommerceShipping = lazy(() => import("./pages/admin/CommerceShipping"));
const CommercePricing = lazy(() => import("./pages/admin/CommercePricing"));
const CommerceCustomers = lazy(() => import("./pages/admin/CommerceCustomers"));
const CommerceReturns = lazy(() => import("./pages/admin/CommerceReturns"));
const CommerceMarketing = lazy(() => import("./pages/admin/CommerceMarketing"));
const CommerceAutomation = lazy(() => import("./pages/admin/CommerceAutomation"));
const CommerceReports = lazy(() => import("./pages/admin/CommerceReports"));
const CommerceFinance = lazy(() => import("./pages/admin/CommerceFinance"));
const CommerceAI = lazy(() => import("./pages/admin/CommerceAI"));
const CommerceSettings = lazy(() => import("./pages/admin/CommerceSettings"));
const AdminMarketingPlatform = lazy(() => import("./pages/admin/AdminMarketingPlatform"));
const AdminGlobalizationPlatform = lazy(() => import("./pages/admin/AdminGlobalizationPlatform"));
const AdminGovernancePlatform = lazy(() => import("./pages/admin/AdminGovernancePlatform"));
const AdminDeveloperPlatform = lazy(() => import("./pages/admin/AdminDeveloperPlatform"));
const AdminTestingPlatform = lazy(() => import("./pages/admin/AdminTestingPlatform"));
const AdminOperationsPlatform = lazy(() => import("./pages/admin/AdminOperationsPlatform"));
const AdminSuppliers = lazy(() => import("./pages/admin/AdminSuppliers"));
const AdminGateways = lazy(() => import("./pages/admin/AdminGateways"));
const AdminReturns = lazy(() => import("./pages/admin/AdminReturns"));
const AdminCustomers = lazy(() => import("./pages/admin/AdminCustomers"));
const AdminReviews = lazy(() => import("./pages/admin/AdminReviews"));
const AdminActivity = lazy(() => import("./pages/admin/AdminActivity"));
const AdminHomepage = lazy(() => import("./pages/admin/AdminHomepage"));
const AdminSEO = lazy(() => import("./pages/admin/AdminSEO"));
const AdminMarketing = lazy(() => import("./pages/admin/AdminMarketing"));
const AdminAnalytics = lazy(() => import("./pages/admin/AdminAnalytics"));
const AdminSystem = lazy(() => import("./pages/admin/AdminSystem"));
const AdminSecurity = lazy(() => import("./pages/admin/AdminSecurity"));
const AdminAI = lazy(() => import("./pages/admin/AdminAI"));
const AdminAIPlatform = lazy(() => import("./pages/admin/AdminAIPlatform"));
const AdminDesignStudio = lazy(() => import("./pages/admin/AdminDesignStudio"));
const AdminWorkflows = lazy(() => import("./pages/admin/AdminWorkflows"));
const AdminWorkflowsBpm = lazy(() => import("./pages/admin/AdminWorkflowsBpm"));
const AdminCRM = lazy(() => import("./pages/admin/AdminCRM"));
const AdminCustomerExperience = lazy(() => import("./pages/admin/AdminCustomerExperience"));
const AdminContentPlatform = lazy(() => import("./pages/admin/AdminContentPlatform"));
const AdminMedia = lazy(() => import("./pages/admin/AdminMedia"));
const AdminDAM = lazy(() => import("./pages/admin/AdminDAM"));
const AdminDeveloper = lazy(() => import("./pages/admin/AdminDeveloper"));
const AdminDevOps = lazy(() => import("./pages/admin/AdminDevOps"));
const AdminSettings = lazy(() => import("./pages/admin/AdminSettings"));
const AdminNavigation = lazy(() => import("./pages/admin/AdminNavigation"));
const AdminTaxonomy = lazy(() => import("./pages/admin/AdminTaxonomy"));
const AdminRecommendations = lazy(() => import("./pages/admin/AdminRecommendations"));
const AdminDiscovery = lazy(() => import("./pages/admin/AdminDiscovery"));
const AdminSearchPlatform = lazy(() => import("./pages/admin/AdminSearchPlatform"));
const AdminEditorial = lazy(() => import("./pages/admin/AdminEditorial"));
const AdminAuthorProfiles = lazy(() => import("./pages/admin/AdminAuthorProfiles"));
const AdminCollectionBuilder = lazy(() => import("./pages/admin/AdminCollectionBuilder"));
const AdminAffiliateAnalytics = lazy(() => import("./pages/admin/AdminAffiliateAnalytics"));
const AdminMarketplaceRegistry = lazy(() => import("./pages/admin/AdminMarketplaceRegistry"));
const AdminCommissionEngine = lazy(() => import("./pages/admin/AdminCommissionEngine"));
const AdminPriceIntelligence = lazy(() => import("./pages/admin/AdminPriceIntelligence"));
const AdminRevenueIntelligence = lazy(() => import("./pages/admin/AdminRevenueIntelligence"));
const AdminConversionOptimization = lazy(() => import("./pages/admin/AdminConversionOptimization"));
const AdminExecutiveCenter = lazy(() => import("./pages/admin/AdminExecutiveCenter"));
const AdminOperationsCenter = lazy(() => import("./pages/admin/AdminOperationsCenter"));
const AdminNotificationsCenter = lazy(() => import("./pages/admin/AdminNotificationsCenter"));
const AdminReportingPlatform = lazy(() => import("./pages/admin/AdminReportingPlatform"));
const AdminAIAdminCenter = lazy(() => import("./pages/admin/AdminAIAdminCenter"));
const AdminDeveloperTools = lazy(() => import("./pages/admin/AdminDeveloperTools"));
const AdminOperationsQueues = lazy(() => import("./pages/admin/AdminOperationsQueues"));
const AdminAdministration = lazy(() => import("./pages/admin/AdminAdministration"));
const AdminAiWorkspaceDashboard = lazy(() => import("./pages/admin/AdminAiWorkspaceDashboard"));
const AdminAiAgentRegistry = lazy(() => import("./pages/admin/AdminAiAgentRegistry"));
const AdminAiTaskManager = lazy(() => import("./pages/admin/AdminAiTaskManager"));
const AdminAiKnowledgePlatform = lazy(() => import("./pages/admin/AdminAiKnowledgePlatform"));
const AdminAiObservability = lazy(() => import("./pages/admin/AdminAiObservability"));
const AdminAiBusinessOps = lazy(() => import("./pages/admin/AdminAiBusinessOps"));
const AdminExecutiveIntelligence = lazy(() => import("./pages/admin/AdminExecutiveIntelligence"));
const AdminBusinessHealth = lazy(() => import("./pages/admin/AdminBusinessHealth"));
const AdminForecastingCenter = lazy(() => import("./pages/admin/AdminForecastingCenter"));
const AdminDecisionIntelligence = lazy(() => import("./pages/admin/AdminDecisionIntelligence"));
const AdminDigitalTwin = lazy(() => import("./pages/admin/AdminDigitalTwin"));
const AdminExecutiveReports = lazy(() => import("./pages/admin/AdminExecutiveReports"));
const AdminExecutiveAI = lazy(() => import("./pages/admin/AdminExecutiveAI"));
const AdminMobileExperience = lazy(() => import("./pages/admin/AdminMobileExperience"));
const AdminPwaDashboard = lazy(() => import("./pages/admin/AdminPwaDashboard"));
const AdminSynchronization = lazy(() => import("./pages/admin/AdminSynchronization"));
const AdminPerformanceDashboard = lazy(() => import("./pages/admin/AdminPerformanceDashboard"));
const AdminAuthCenter = lazy(() => import("./pages/admin/AdminAuthCenter"));
const AdminAuthSettings = lazy(() => import("./pages/admin/AdminAuthSettings"));
const AdminRecoveryCenter = lazy(() => import("./pages/admin/AdminRecoveryCenter"));
const AdminIntegrationsCenter = lazy(() => import("./pages/admin/AdminIntegrationsCenter"));
const AdminNotificationDashboard = lazy(() => import("./pages/admin/AdminNotificationDashboard"));
const AdminPaymentDashboard = lazy(() => import("./pages/admin/AdminPaymentDashboard"));
const AdminPaymentTransactions = lazy(() => import("./pages/admin/AdminPaymentTransactions"));
const AdminPaymentRefunds = lazy(() => import("./pages/admin/AdminPaymentRefunds"));
const AdminPaymentDisputes = lazy(() => import("./pages/admin/AdminPaymentDisputes"));
const AdminPaymentWebhooks = lazy(() => import("./pages/admin/AdminPaymentWebhooks"));
const AdminPaymentSettlements = lazy(() => import("./pages/admin/AdminPaymentSettlements"));
const AdminPaymentSettings = lazy(() => import("./pages/admin/AdminPaymentSettings"));
const AdminShippingDashboard = lazy(() => import("./pages/admin/AdminShippingDashboard"));
const AdminCarrierManager = lazy(() => import("./pages/admin/AdminCarrierManager"));
const AdminShipmentManager = lazy(() => import("./pages/admin/AdminShipmentManager"));
const AdminTrackingCenter = lazy(() => import("./pages/admin/AdminTrackingCenter"));
const AdminShippingAnalytics = lazy(() => import("./pages/admin/AdminShippingAnalytics"));
const AdminCarrierHealth = lazy(() => import("./pages/admin/AdminCarrierHealth"));
const AdminOrderOrchestrator = lazy(() => import("./pages/admin/AdminOrderOrchestrator"));
const AdminAutomationDashboard = lazy(() => import("./pages/admin/AdminAutomationDashboard"));

// Supplier Automation
const SupplierAutomationDashboard = lazy(() => import("./pages/admin/SupplierAutomationDashboard"));
const SupplierAutomationDirectory = lazy(() => import("./pages/admin/SupplierAutomationDirectory"));
const SupplierAutomationCommunications = lazy(() => import("./pages/admin/SupplierAutomationCommunications"));
const SupplierAutomationMapping = lazy(() => import("./pages/admin/SupplierAutomationMapping"));
const SupplierAutomationPurchaseOrders = lazy(() => import("./pages/admin/SupplierAutomationPurchaseOrders"));
const SupplierAutomationTracking = lazy(() => import("./pages/admin/SupplierAutomationTracking"));
const SupplierAutomationFailover = lazy(() => import("./pages/admin/SupplierAutomationFailover"));
const SupplierAutomationAnalytics = lazy(() => import("./pages/admin/SupplierAutomationAnalytics"));
const SupplierAutomationControlCenter = lazy(() => import("./pages/admin/SupplierAutomationControlCenter"));

// Identity, Gateway, Communications, Observability, Data, Intelligence
const AdminIdentity = lazy(() => import("./pages/admin/AdminIdentity"));
const AdminGateway = lazy(() => import("./pages/admin/AdminGateway"));
const AdminCommunications = lazy(() => import("./pages/admin/AdminCommunications"));
const AdminObservability = lazy(() => import("./pages/admin/AdminObservability"));
const AdminData = lazy(() => import("./pages/admin/AdminData"));
const AdminIntelligence = lazy(() => import("./pages/admin/AdminIntelligence"));
const AdminBusinessIntelligence = lazy(() => import("./pages/admin/AdminBusinessIntelligence"));

const PageLoader = () => (
  <div className="flex min-h-[60vh] items-center justify-center">
    <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
  </div>
);

export default function App() {
  return (
    <AppProviders>
      <ErrorBoundary>
        <HashRouter>
          <SiteSchema />
          <Routes>
            {/* Storefront */}
            <Route element={<Suspense fallback={<PageLoader />}><Layout /></Suspense>}>
              <Route path="/auth" element={<CustomerAuth />} />
              <Route path="/" element={<Home />} />
              <Route path="/shop" element={<Shop />} />
              <Route path="/product/:slug" element={<ProductDetail />} />
              <Route path="/cart" element={flags.ENABLE_ECOMMERCE ? <Cart /> : <Navigate to="/shop" replace />} />
              <Route path="/checkout" element={flags.ENABLE_ECOMMERCE ? <Checkout /> : <Navigate to="/shop" replace />} />
              <Route path="/wishlist" element={<Wishlist />} />
              <Route path="/compare" element={<Compare />} />
              <Route path="/account" element={<Account />} />
              <Route path="/brands" element={<Brands />} />
              <Route path="/brands/:slug" element={<BrandDetail />} />
              <Route path="/collections" element={<Collections />} />
              <Route path="/collections/:id" element={<CollectionPage />} />
              <Route path="/recently-viewed" element={<RecentlyViewed />} />
              <Route path="/track-order" element={<TrackOrder />} />
              <Route path="/journal" element={<Journal />} />
              <Route path="/journal/:slug" element={<ArticleDetail />} />
              <Route path="/legal/:slug" element={<LegalPage />} />
              <Route path="/about" element={<About />} />
              <Route path="/faq" element={<FAQ />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/error/:code" element={<ErrorPage />} />
              <Route path="*" element={<NotFound />} />
            </Route>

            {/* Admin */}
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route
              path="/admin"
              element={
                <ProtectedRoute>
                  <Suspense fallback={<PageLoader />}>
                    <AdminLayout />
                  </Suspense>
                </ProtectedRoute>
              }
            >
              <Route index element={<Dashboard />} />
              <Route path="products" element={<AdminProducts />} />
              <Route path="categories" element={<AdminCategories />} />
              <Route path="brands" element={<AdminBrands />} />
              <Route path="orders" element={<AdminOrders />} />
              <Route path="coupons" element={<AdminCoupons />} />
              <Route path="journal" element={<AdminArticles />} />
              <Route path="merchants" element={<AdminMerchants />} />
              <Route path="merchant-import" element={<AdminMerchantImport />} />
              <Route path="affiliates" element={<AdminAffiliates />} />
              <Route path="commerce-platform" element={<AdminCommercePlatform />} />
              <Route path="marketing-platform" element={<AdminMarketingPlatform />} />
              <Route path="globalization-platform" element={<AdminGlobalizationPlatform />} />
              <Route path="governance-platform" element={<AdminGovernancePlatform />} />
              <Route path="developer-platform" element={<AdminDeveloperPlatform />} />
              <Route path="testing-platform" element={<AdminTestingPlatform />} />
              <Route path="operations-platform" element={<AdminOperationsPlatform />} />
              <Route path="suppliers" element={<AdminSuppliers />} />
              <Route path="gateways" element={<AdminGateways />} />
              <Route path="returns" element={<AdminReturns />} />
              <Route path="customers" element={<AdminCustomers />} />
              <Route path="reviews" element={<AdminReviews />} />
              <Route path="activity" element={<AdminActivity />} />
              <Route path="homepage" element={<AdminHomepage />} />
              <Route path="seo" element={<AdminSEO />} />
              <Route path="marketing" element={<AdminMarketing />} />
              <Route path="analytics" element={<AdminAnalytics />} />
              <Route path="system" element={<AdminSystem />} />
              <Route path="security" element={<AdminSecurity />} />
              <Route path="ai" element={<AdminAI />} />
              <Route path="ai-platform" element={<AdminAIPlatform />} />
              <Route path="design" element={<AdminDesignStudio />} />
              <Route path="workflows" element={<AdminWorkflows />} />
              <Route path="workflows-bpm" element={<AdminWorkflowsBpm />} />
              <Route path="crm" element={<AdminCRM />} />
              <Route path="customer-experience" element={<AdminCustomerExperience />} />
              <Route path="content-platform" element={<AdminContentPlatform />} />
              <Route path="media" element={<AdminMedia />} />
              <Route path="dam" element={<AdminDAM />} />
              <Route path="developer" element={<AdminDeveloper />} />
              <Route path="devops" element={<AdminDevOps />} />
              <Route path="gateway" element={<AdminGateway />} />
              <Route path="communications" element={<AdminCommunications />} />
              <Route path="observability" element={<AdminObservability />} />
              <Route path="data" element={<AdminData />} />
              <Route path="intelligence" element={<AdminIntelligence />} />
              <Route path="business-intelligence" element={<AdminBusinessIntelligence />} />
              <Route path="identity" element={<AdminIdentity />} />
              <Route path="navigation" element={<AdminNavigation />} />
              <Route path="taxonomy" element={<AdminTaxonomy />} />
              <Route path="recommendations" element={<AdminRecommendations />} />
              <Route path="discovery" element={<AdminDiscovery />} />
              <Route path="search-platform" element={<AdminSearchPlatform />} />
              <Route path="editorial" element={<AdminEditorial />} />
              <Route path="authors" element={<AdminAuthorProfiles />} />
              <Route path="collection-builder" element={<AdminCollectionBuilder />} />
              <Route path="affiliate-analytics" element={<AdminAffiliateAnalytics />} />
              <Route path="marketplace-registry" element={<AdminMarketplaceRegistry />} />
              <Route path="commission-engine" element={<AdminCommissionEngine />} />
              <Route path="price-intelligence" element={<AdminPriceIntelligence />} />
              <Route path="revenue-intelligence" element={<AdminRevenueIntelligence />} />
              <Route path="conversion-optimization" element={<AdminConversionOptimization />} />
              <Route path="executive-center" element={<AdminExecutiveCenter />} />
              <Route path="operations-center" element={<AdminOperationsCenter />} />
              <Route path="notifications" element={<AdminNotificationsCenter />} />
              <Route path="notification-dashboard" element={<AdminNotificationDashboard />} />
              {/* Payment Routes */}
              <Route path="payments" element={<AdminPaymentDashboard />} />
              <Route path="payments/dashboard" element={<AdminPaymentDashboard />} />
              <Route path="payments/transactions" element={<AdminPaymentTransactions />} />
              <Route path="payments/transactions/:id" element={<AdminPaymentTransactions />} />
              <Route path="payments/refunds" element={<AdminPaymentRefunds />} />
              <Route path="payments/disputes" element={<AdminPaymentDisputes />} />
              <Route path="payments/webhooks" element={<AdminPaymentWebhooks />} />
              <Route path="payments/settlements" element={<AdminPaymentSettlements />} />
              <Route path="payments/settings" element={<AdminPaymentSettings />} />
              <Route path="reporting" element={<AdminReportingPlatform />} />
              <Route path="ai-admin" element={<AdminAIAdminCenter />} />
              <Route path="developer-tools" element={<AdminDeveloperTools />} />
              <Route path="operations-queues" element={<AdminOperationsQueues />} />
              <Route path="administration" element={<AdminAdministration />} />
              <Route path="ai-workspace" element={<AdminAiWorkspaceDashboard />} />
              <Route path="ai-agent-registry" element={<AdminAiAgentRegistry />} />
              <Route path="ai-task-manager" element={<AdminAiTaskManager />} />
              <Route path="ai-knowledge" element={<AdminAiKnowledgePlatform />} />
              <Route path="ai-observability" element={<AdminAiObservability />} />
              <Route path="ai-business-ops" element={<AdminAiBusinessOps />} />
              <Route path="executive-intelligence" element={<AdminExecutiveIntelligence />} />
              <Route path="business-health" element={<AdminBusinessHealth />} />
              <Route path="forecasting" element={<AdminForecastingCenter />} />
              <Route path="decision-intelligence" element={<AdminDecisionIntelligence />} />
              <Route path="digital-twin" element={<AdminDigitalTwin />} />
              <Route path="executive-reports" element={<AdminExecutiveReports />} />
              <Route path="executive-ai" element={<AdminExecutiveAI />} />
              <Route path="mobile-experience" element={<AdminMobileExperience />} />
              <Route path="pwa-dashboard" element={<AdminPwaDashboard />} />
              <Route path="synchronization" element={<AdminSynchronization />} />
              <Route path="performance-dashboard" element={<AdminPerformanceDashboard />} />
              <Route path="integrations" element={<AdminIntegrationsCenter />} />
              <Route path="authentication" element={<AdminAuthCenter />} />
              <Route path="auth-settings" element={<AdminAuthSettings />} />
              <Route path="session-manager" element={<AdminAuthCenter />} />
              {/* Shipping Routes */}
              <Route path="shipping" element={<AdminShippingDashboard />} />
              <Route path="shipping/carriers" element={<AdminCarrierManager />} />
              <Route path="shipping/shipments" element={<AdminShipmentManager />} />
              <Route path="shipping/tracking" element={<AdminTrackingCenter />} />
              <Route path="shipping/analytics" element={<AdminShippingAnalytics />} />
              <Route path="shipping/health" element={<AdminCarrierHealth />} />
              {/* Order Orchestrator Routes */}
              <Route path="orchestrator" element={<AdminOrderOrchestrator />} />
              <Route path="orchestrator/running" element={<AdminOrderOrchestrator />} />
              <Route path="orchestrator/queues" element={<AdminOrderOrchestrator />} />
              <Route path="orchestrator/events" element={<AdminOrderOrchestrator />} />
              <Route path="orchestrator/failures" element={<AdminOrderOrchestrator />} />
              {/* Automation Routes */}
              <Route path="automation" element={<AdminAutomationDashboard />} />
              <Route path="automation/rules" element={<AdminAutomationDashboard />} />
              <Route path="automation/jobs" element={<AdminAutomationDashboard />} />
              <Route path="automation/workers" element={<AdminAutomationDashboard />} />
              <Route path="automation/schedules" element={<AdminAutomationDashboard />} />
              <Route path="automation/logs" element={<AdminAutomationDashboard />} />
              <Route path="recovery" element={<AdminRecoveryCenter />} />
              {/* Commerce Routes */}
              <Route path="commerce" element={<CommerceDashboard />} />
              <Route path="commerce/products" element={<CommerceProducts />} />
              <Route path="commerce/orders" element={<CommerceOrders />} />
              <Route path="commerce/inventory" element={<CommerceInventory />} />
              <Route path="commerce/suppliers" element={<CommerceSuppliers />} />
              <Route path="commerce/warehouses" element={<CommerceWarehouses />} />
              <Route path="commerce/shipping" element={<CommerceShipping />} />
              <Route path="commerce/pricing" element={<CommercePricing />} />
              <Route path="commerce/customers" element={<CommerceCustomers />} />
              <Route path="commerce/returns" element={<CommerceReturns />} />
              <Route path="commerce/marketing" element={<CommerceMarketing />} />
              <Route path="commerce/automation" element={<CommerceAutomation />} />
              <Route path="commerce/reports" element={<CommerceReports />} />
              <Route path="commerce/finance" element={<CommerceFinance />} />
              <Route path="commerce/ai" element={<CommerceAI />} />
              <Route path="commerce/settings" element={<CommerceSettings />} />
              {/* Supplier Automation Routes */}
              <Route path="commerce/supplier-automation" element={<SupplierAutomationDashboard />} />
              <Route path="commerce/supplier-automation/directory" element={<SupplierAutomationDirectory />} />
              <Route path="commerce/supplier-automation/communications" element={<SupplierAutomationCommunications />} />
              <Route path="commerce/supplier-automation/mapping" element={<SupplierAutomationMapping />} />
              <Route path="commerce/supplier-automation/purchase-orders" element={<SupplierAutomationPurchaseOrders />} />
              <Route path="commerce/supplier-automation/tracking" element={<SupplierAutomationTracking />} />
              <Route path="commerce/supplier-automation/failover" element={<SupplierAutomationFailover />} />
              <Route path="commerce/supplier-automation/analytics" element={<SupplierAutomationAnalytics />} />
              <Route path="commerce/supplier-automation/control-center" element={<SupplierAutomationControlCenter />} />
              <Route path="settings" element={<AdminSettings />} />
              <Route path="*" element={<Navigate to="/admin" replace />} />
            </Route>
          </Routes>
        </HashRouter>
      </ErrorBoundary>
    </AppProviders>
  );
}
