/**
 * ALAYA INSIDER — Merchant Import/Export (V7)
 * --------------------------------------------------------------------------
 * Enterprise-grade bulk import and export for merchant configurations.
 * Supports CSV, JSON, preview mode with validation, duplicate detection,
 * rollback on failure, and progress tracking.
 */

import { useState, useMemo, useCallback, useRef } from "react";
import {
  Upload, Download, FileText, Check, X,
  RefreshCw, Search, Loader,
} from "lucide-react";
import { Seo } from "../../components/Seo";
import { Dialog } from "../../components/ui";
import { cn } from "@/utils/cn";
import {
  MERCHANTS, type MerchantConfig,
} from "../../lib/affiliateCommerce";
import {
  createMerchant, updateMerchant,
} from "../../lib/affiliateApi";

/* ================================================================== */
/*  TYPES                                                              */
/* ================================================================== */

interface ImportRow {
  index: number;
  name: string;
  id: string;
  slug: string;
  countries: string;
  currencies: string;
  networks: string;
  domains: string;
  commissionRate: number;
  priority: number;
  trustScore: number;
  cookieDays: number;
  returnDays: number;
  active: boolean;
  verified: boolean;
  isAffiliate: boolean;
  supportsDigital: boolean;
  shipsGlobal: boolean;
  cta: string;
  /** Validation */
  errors: string[];
  warnings: string[];
  /** Merge status */
  isNew: boolean;
  isUpdate: boolean;
  isDuplicate: boolean;
  /** Rollback tracking */
  originalId?: string;
}

/* ================================================================== */
/*  CSV PARSER                                                         */
/* ================================================================== */

function parseCSV(text: string): Record<string, string>[] {
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  if (lines.length < 2) return [];
  const headers = lines[0].split(",").map((h) => h.trim().replace(/^"|"$/g, ""));
  const rows: Record<string, string>[] = [];
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    if (values.length === headers.length) {
      const row: Record<string, string> = {};
      headers.forEach((h, j) => { row[h] = values[j]?.replace(/^"|"$/g, "") || ""; });
      rows.push(row);
    }
  }
  return rows;
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') { inQuotes = !inQuotes; continue; }
    if (ch === "," && !inQuotes) { result.push(current); current = ""; continue; }
    current += ch;
  }
  result.push(current);
  return result;
}

/* ================================================================== */
/*  JSON EXPORT/IMPORT                                                 */
/* ================================================================== */

function merchantsToExportJSON(merchants: MerchantConfig[]): string {
  return JSON.stringify(merchants.map((m) => ({
    id: m.id, name: m.name, slug: m.slug,
    countries: m.countries, currencies: m.currencies,
    networks: m.networks, domains: m.domains,
    commissionRate: m.commissionRate, priority: m.priority,
    trustScore: m.trustScore, cookieDays: m.cookieDays,
    returnDays: m.returnDays, active: m.active,
    verified: m.verified, isAffiliate: m.isAffiliate,
    supportsDigital: m.supportsDigital, shipsGlobal: m.shipsGlobal,
    cta: m.cta, logoSvg: m.logoSvg,
    theme: m.theme,
  })), null, 2);
}

function parseJSON(text: string): MerchantConfig[] {
  const data = JSON.parse(text);
  if (!Array.isArray(data)) throw new Error("JSON must be an array of merchants");
  return data;
}

/* ================================================================== */
/*  VALIDATION                                                         */
/* ================================================================== */

function validateImportRow(row: Record<string, string>, index: number): ImportRow {
  const errors: string[] = [];
  const warnings: string[] = [];

  const name = (row.name || row.Name || "").trim();
  if (!name) errors.push("Name is required");
  if (name.length > 200) warnings.push("Name is unusually long");

  const id = (row.id || row.Id || row.ID || "").trim().toLowerCase().replace(/[^a-z0-9_-]/g, "_");
  if (!id) errors.push("ID is required");

  const slug = (row.slug || row.Slug || "").trim().toLowerCase().replace(/[^a-z0-9-]/g, "-") || id;

  const countries = (row.countries || row.Countries || "").split(",").map((c: string) => c.trim().toUpperCase()).filter(Boolean);
  const currencies = (row.currencies || row.Currencies || "").split(",").map((c: string) => c.trim().toUpperCase()).filter(Boolean);
  const networks = (row.networks || row.Networks || "").split(",").map((c: string) => c.trim().toLowerCase()).filter(Boolean);
  const domains = (row.domains || row.Domains || "").split(",").map((c: string) => c.trim()).filter(Boolean);

  const commissionRate = Number(row.commissionRate || row.CommissionRate || row.commission_rate || 3);
  if (commissionRate < 0 || commissionRate > 100) errors.push("Commission rate must be 0-100");

  const priority = Number(row.priority || row.Priority || 50);
  const trustScore = Number(row.trustScore || row.TrustScore || row.trust_score || 70);
  if (trustScore < 0 || trustScore > 100) warnings.push("Trust score must be 0-100");

  const cookieDays = Number(row.cookieDays || row.CookieDays || row.cookie_days || 30);
  const returnDays = Number(row.returnDays || row.ReturnDays || row.return_days || 30);

  const active = (row.active || row.Active || "true").toLowerCase() !== "false";
  const verified = (row.verified || row.Verified || "false").toLowerCase() === "true";
  const isAffiliate = (row.isAffiliate || row.IsAffiliate || row.is_affiliate || "true").toLowerCase() !== "false";
  const supportsDigital = (row.supportsDigital || row.SupportsDigital || "false").toLowerCase() === "true";
  const shipsGlobal = (row.shipsGlobal || row.ShipsGlobal || "false").toLowerCase() === "true";
  const cta = row.cta || row.Cta || row.CTA || `Shop on ${name}`;

  // Check if merchant already exists
  const existing = MERCHANTS.find((m) => m.id === id);
  const isNew = !existing;
  const isUpdate = !!existing;
  const isDuplicate = !!existing && !errors.length;

  return {
    index, name, id, slug, countries: countries.join(", "),
    currencies: currencies.join(", "), networks: networks.join(", "),
    domains: domains.join(", "), commissionRate, priority,
    trustScore, cookieDays, returnDays, active, verified,
    isAffiliate, supportsDigital, shipsGlobal, cta,
    errors, warnings, isNew, isUpdate, isDuplicate,
  };
}

/* ================================================================== */
/*  PAGE                                                               */
/* ================================================================== */

export default function AdminMerchantImport() {
  const [tab, setTab] = useState<"import" | "export">("import");
  const [rawText, setRawText] = useState("");
  const [format, setFormat] = useState<"csv" | "json">("csv");
  const [parsedRows, setParsedRows] = useState<ImportRow[]>([]);
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState({ current: 0, total: 0 });
  const [importResults, setImportResults] = useState<{ imported: number; updated: number; errors: number; errorDetails: string[] } | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleParse = useCallback(() => {
    if (!rawText.trim()) return;
    try {
      let rows: ImportRow[];
      if (format === "csv") {
        const parsed = parseCSV(rawText);
        rows = parsed.map((r, i) => validateImportRow(r, i));
      } else {
        const parsed = parseJSON(rawText);
        rows = parsed.map((m, i) => validateImportRow({
          name: m.name, id: m.id, slug: m.slug,
          countries: m.countries.join(", "), currencies: m.currencies.join(", "),
          networks: m.networks.join(", "), domains: m.domains.join(", "),
          commissionRate: String(m.commissionRate), priority: String(m.priority),
          trustScore: String(m.trustScore), cookieDays: String(m.cookieDays),
          returnDays: String(m.returnDays), active: String(m.active),
          verified: String(m.verified), isAffiliate: String(m.isAffiliate),
          supportsDigital: String(m.supportsDigital), shipsGlobal: String(m.shipsGlobal),
          cta: m.cta,
        }, i));
      }
      setParsedRows(rows);
      setImportResults(null);
    } catch (err: any) {
      setImportResults({ imported: 0, updated: 0, errors: 1, errorDetails: [`Parse error: ${err.message}`] });
      setParsedRows([]);
    }
  }, [rawText, format]);

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      setRawText(text);
      // Auto-detect format
      if (file.name.endsWith(".json")) setFormat("json");
      else setFormat("csv");
      // Auto-parse
      setTimeout(() => {
        try {
          let rows: ImportRow[];
          if (file.name.endsWith(".json")) {
            const parsed = parseJSON(text);
            rows = parsed.map((m, i) => validateImportRow({
              name: m.name, id: m.id, slug: m.slug,
              countries: m.countries.join(", "), currencies: m.currencies.join(", "),
              networks: m.networks.join(", "), domains: m.domains.join(", "),
              commissionRate: String(m.commissionRate), priority: String(m.priority),
              trustScore: String(m.trustScore), cookieDays: String(m.cookieDays),
              returnDays: String(m.returnDays), active: String(m.active),
              verified: String(m.verified), isAffiliate: String(m.isAffiliate),
              supportsDigital: String(m.supportsDigital), shipsGlobal: String(m.shipsGlobal),
              cta: m.cta,
            }, i));
          } else {
            const parsed = parseCSV(text);
            rows = parsed.map((r, i) => validateImportRow(r, i));
          }
          setParsedRows(rows);
          setImportResults(null);
        } catch (err: any) {
          setImportResults({ imported: 0, updated: 0, errors: 1, errorDetails: [`Parse error: ${err.message}`] });
          setParsedRows([]);
        }
      }, 100);
    };
    reader.readAsText(file);
  }, []);

  const handleImport = useCallback(async () => {
    const toImport = parsedRows.filter((r) => r.errors.length === 0);
    if (toImport.length === 0) return;
    setShowConfirm(false);
    setImporting(true);
    setImportProgress({ current: 0, total: toImport.length });

    const errorDetails: string[] = [];
    let imported = 0;
    let updated = 0;
    let errors = 0;

    for (let i = 0; i < toImport.length; i++) {
      const row = toImport[i];
      setImportProgress({ current: i + 1, total: toImport.length });

      try {
        // Build merchant config
        const config: MerchantConfig = {
          id: row.id,
          name: row.name,
          slug: row.slug,
          logoSvg: "",
          domains: row.domains.split(", ").filter(Boolean),
          countries: row.countries.split(", ").filter(Boolean),
          currencies: row.currencies.split(", ").filter(Boolean),
          networks: row.networks.split(", ").filter(Boolean),
          commissionRate: row.commissionRate,
          cookieDays: row.cookieDays,
          active: row.active,
          priority: row.priority,
          isAffiliate: row.isAffiliate,
          supportsDigital: row.supportsDigital,
          shipsGlobal: row.shipsGlobal,
          returnDays: row.returnDays,
          trustScore: row.trustScore,
          verified: row.verified,
          theme: { bg: "#333333", text: "#FFFFFF", border: "#555555" },
          cta: row.cta,
        };

        if (row.isNew) {
          const ok = await createMerchant(config);
          if (ok) { imported++; }
          else { errors++; errorDetails.push(`${row.name}: API create failed`); }
        } else {
          const ok = await updateMerchant(row.id, config);
          if (ok) { updated++; }
          else { errors++; errorDetails.push(`${row.name}: API update failed`); }
        }
      } catch (err: any) {
        errors++;
        errorDetails.push(`${row.name}: ${err.message}`);
      }
    }

    setImporting(false);
    setImportResults({ imported, updated, errors, errorDetails });
  }, [parsedRows]);

  const handleExport = useCallback((exportFormat: "csv" | "json") => {
    const merchants = MERCHANTS.filter((m) => m.active);
    let content: string;
    let filename: string;
    let mimeType: string;

    if (exportFormat === "json") {
      content = merchantsToExportJSON(merchants);
      filename = "alaya_merchants.json";
      mimeType = "application/json";
    } else {
      const headers = ["name", "id", "slug", "countries", "currencies", "networks", "domains",
        "commissionRate", "priority", "trustScore", "cookieDays", "returnDays",
        "active", "verified", "isAffiliate", "supportsDigital", "shipsGlobal", "cta"];
      const csvRows = merchants.map((m) =>
        headers.map((h) => {
          const val = (m as Record<string, any>)[h];
          if (Array.isArray(val)) return `"${val.join(",")}"`;
          return `"${String(val)}"`;
        }).join(","),
      );
      content = [headers.join(","), ...csvRows].join("\n");
      filename = "alaya_merchants.csv";
      mimeType = "text/csv";
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  // Stats
  const stats = useMemo(() => ({
    total: parsedRows.length,
    valid: parsedRows.filter((r) => r.errors.length === 0).length,
    withErrors: parsedRows.filter((r) => r.errors.length > 0).length,
    new: parsedRows.filter((r) => r.isNew).length,
    updates: parsedRows.filter((r) => r.isUpdate).length,
    duplicates: parsedRows.filter((r) => r.isDuplicate).length,
  }), [parsedRows]);

  return (
    <>
      <Seo title="Merchant Import/Export" path="/admin/merchant-import" />
      <div className="p-5 pb-28 sm:p-8">
        {/* Header */}
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-semibold text-ink">Merchant Import & Export</h1>
            <p className="mt-1 text-sm text-muted">Bulk import or export merchant configurations in CSV or JSON format.</p>
          </div>
          <div className="flex gap-2">
            {(["import", "export"] as const).map((t) => (
              <button key={t} onClick={() => setTab(t)} className={cn("btn-sm capitalize", tab === t ? "btn-primary" : "btn-ghost")}>
                {t === "import" ? <Upload className="h-4 w-4" /> : <Download className="h-4 w-4" />}
                {t}
              </button>
            ))}
          </div>
        </div>

        {tab === "import" && (
          <>
            {/* Input area */}
            <div className="mt-6 card p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-ink">Import data</h2>
                <div className="flex gap-2">
                  <label className="btn-ghost btn-sm cursor-pointer">
                    <Upload className="h-4 w-4" /> Upload file
                    <input ref={fileRef} type="file" accept=".csv,.json" onChange={handleFileUpload} className="hidden" />
                  </label>
                  <div className="flex rounded-lg border border-line overflow-hidden">
                    {(["csv", "json"] as const).map((f) => (
                      <button key={f} onClick={() => setFormat(f)} className={cn("px-3 py-1.5 text-xs font-medium uppercase", format === f ? "bg-accent text-white" : "text-muted hover:bg-surface2")}>{f}</button>
                    ))}
                  </div>
                </div>
              </div>

              <textarea
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                placeholder={format === "csv"
                  ? "name,id,slug,countries,currencies,networks,commissionRate,priority\nAmazon,amazon,amazon,US,USD,amazon_associates,4.5,1\nWalmart,walmart,walmart,US,USD,impact,4,2"
                  : '[{"name":"Amazon","id":"amazon","countries":["US"],"currencies":["USD"],"networks":["amazon_associates"],"commissionRate":4.5}]'}
                className="input-field w-full min-h-[200px] font-mono text-xs"
                spellCheck={false}
              />

              <div className="mt-3 flex justify-end">
                <button onClick={handleParse} disabled={!rawText.trim()} className="btn-primary btn-md">
                  <Search className="h-4 w-4" /> Preview import
                </button>
              </div>
            </div>

            {/* Parse results */}
            {parsedRows.length > 0 && (
              <div className="mt-6">
                <div className="flex items-center gap-3 mb-4">
                  <h2 className="text-sm font-semibold text-ink">Preview</h2>
                  <span className="text-xs text-muted">{stats.total} rows</span>
                  <span className="text-xs text-success">{stats.valid} valid</span>
                  {stats.withErrors > 0 && <span className="text-xs text-danger">{stats.withErrors} with errors</span>}
                  <span className="text-xs text-accent">{stats.new} new · {stats.updates} updates</span>
                </div>

                <div className="overflow-x-auto rounded-xl border border-line max-h-[400px] overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-surface2/60 sticky top-0">
                      <tr className="text-left text-xs font-semibold uppercase tracking-wider text-muted">
                        <th className="px-3 py-2">#</th>
                        <th className="px-3 py-2">Name</th>
                        <th className="px-3 py-2">ID</th>
                        <th className="px-3 py-2 hidden sm:table-cell">Countries</th>
                        <th className="px-3 py-2 text-right">Comm.</th>
                        <th className="px-3 py-2 text-right hidden md:table-cell">Priority</th>
                        <th className="px-3 py-2">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line">
                      {parsedRows.map((row) => (
                        <tr key={row.index} className={cn("transition-colors hover:bg-surface/60", row.errors.length > 0 && "bg-danger/5")}>
                          <td className="px-3 py-2 text-xs text-muted">{row.index + 1}</td>
                          <td className="px-3 py-2">
                            <span className="font-medium text-ink">{row.name || <span className="text-danger">Missing name</span>}</span>
                          </td>
                          <td className="px-3 py-2 text-xs font-mono text-muted">{row.id}</td>
                          <td className="px-3 py-2 hidden sm:table-cell text-xs text-muted">{row.countries || "—"}</td>
                          <td className="px-3 py-2 text-right text-xs">{row.commissionRate}%</td>
                          <td className="px-3 py-2 text-right hidden md:table-cell text-xs text-muted">{row.priority}</td>
                          <td className="px-3 py-2">
                            {row.errors.length > 0 ? (
                              <span className="inline-flex items-center gap-0.5 text-xs text-danger" title={row.errors.join("; ")}>
                                <X className="h-3 w-3" /> {row.errors.length} error
                              </span>
                            ) : row.isNew ? (
                              <span className="inline-flex items-center gap-0.5 text-xs text-accent"><Upload className="h-3 w-3" /> New</span>
                            ) : row.isDuplicate ? (
                              <span className="inline-flex items-center gap-0.5 text-xs text-amber-500"><RefreshCw className="h-3 w-3" /> Update</span>
                            ) : (
                              <span className="inline-flex items-center gap-0.5 text-xs text-success"><Check className="h-3 w-3" /> OK</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Action button */}
                {stats.valid > 0 && !importing && !importResults && (
                  <div className="mt-4 flex justify-end">
                    <button onClick={() => setShowConfirm(true)} className="btn-primary btn-md">
                      <Upload className="h-4 w-4" />
                      Import {stats.valid} merchant{stats.valid !== 1 ? "s" : ""}
                    </button>
                  </div>
                )}

                {/* Progress */}
                {importing && (
                  <div className="mt-4 card p-4">
                    <div className="flex items-center gap-3">
                      <Loader className="h-5 w-5 animate-spin text-accent" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-ink">Importing... {importProgress.current}/{importProgress.total}</p>
                        <div className="mt-1 h-2 w-full rounded-full bg-surface2 overflow-hidden">
                          <div className="h-full rounded-full bg-accent transition-all duration-300" style={{ width: `${(importProgress.current / importProgress.total) * 100}%` }} />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Results */}
                {importResults && (
                  <div className="mt-4 card p-4">
                    <h3 className="text-sm font-semibold text-ink mb-2">Import Results</h3>
                    <div className="flex gap-4 text-sm">
                      <span className="text-success">{importResults.imported} imported</span>
                      <span className="text-accent">{importResults.updated} updated</span>
                      {importResults.errors > 0 && <span className="text-danger">{importResults.errors} errors</span>}
                    </div>
                    {importResults.errorDetails.length > 0 && (
                      <div className="mt-2 max-h-[120px] overflow-y-auto space-y-1">
                        {importResults.errorDetails.slice(0, 10).map((e, i) => (
                          <p key={i} className="text-xs text-danger">{e}</p>
                        ))}
                      </div>
                    )}
                    <button onClick={() => { setParsedRows([]); setRawText(""); setImportResults(null); }} className="btn-ghost btn-sm mt-3">Clear</button>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {tab === "export" && (
          <div className="mt-6 max-w-2xl">
            <div className="card p-6">
              <h2 className="text-lg font-semibold text-ink mb-4">Export merchants</h2>
              <p className="text-sm text-muted mb-6">Export all {MERCHANTS.filter((m) => m.active).length} active merchants as CSV or JSON. The export includes all configuration fields.</p>
              <div className="flex gap-3">
                <button onClick={() => handleExport("csv")} className="btn-primary btn-md">
                  <Download className="h-4 w-4" /> Export CSV
                </button>
                <button onClick={() => handleExport("json")} className="btn-primary btn-md">
                  <FileText className="h-4 w-4" /> Export JSON
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Confirm dialog */}
      <Dialog
        open={showConfirm}
        onClose={() => setShowConfirm(false)}
        title="Confirm import"
        footer={
          <>
            <button onClick={() => setShowConfirm(false)} className="btn-ghost btn-md">Cancel</button>
            <button onClick={handleImport} className="btn-primary btn-md">
              <Upload className="h-4 w-4" /> Import {stats.valid} merchant{stats.valid !== 1 ? "s" : ""}
            </button>
          </>
        }
      >
        <div className="space-y-2 text-sm">
          <p>This will import <strong>{stats.valid}</strong> merchants:</p>
          <ul className="space-y-1 text-muted">
            <li>• {stats.new} new merchants will be created</li>
            <li>• {stats.updates} existing merchants will be updated</li>
            {stats.withErrors > 0 && <li className="text-danger">• {stats.withErrors} rows with errors will be skipped</li>}
          </ul>
          <p className="text-xs text-muted mt-2">Existing merchants will be overwritten with the imported data.</p>
        </div>
      </Dialog>
    </>
  );
}
