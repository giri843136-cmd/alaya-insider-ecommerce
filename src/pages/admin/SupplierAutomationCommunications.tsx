import { useState } from "react";
import { Plus, Radio, X, Globe, Mail, MessageSquare, FileSpreadsheet, Terminal, Webhook, RefreshCw } from "lucide-react";
import { Seo } from "../../components/Seo";
import { EmptyState } from "../../components/ui";
import { cn } from "@/utils/cn";
import { getCommProfiles, saveCommProfile } from "../../lib/supplier-automation";
import type { SupplierCommProfile, CommMethod } from "../../lib/commerce-types";

export default function SupplierAutomationCommunications() {
  const [profiles, setProfiles] = useState<SupplierCommProfile[]>(getCommProfiles);
  const [editing, setEditing] = useState<SupplierCommProfile | null>(null);

  const refresh = () => setProfiles(getCommProfiles());

  const saveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    saveCommProfile(editing);
    refresh();
    setEditing(null);
  };

  const addMethod = () => {
    if (!editing) return;
    setEditing({
      ...editing,
      methods: [...editing.methods, {
        type: "api",
        retryRules: { maxRetries: 3, backoffMs: 5000 },
        rateLimit: 60,
        timeout: 30000,
        heartbeatEnabled: false,
        healthCheckInterval: 5,
        enabled: true,
      }],
    });
  };

  const updateMethod = (idx: number, patch: Partial<CommMethod>) => {
    if (!editing) return;
    const methods = [...editing.methods];
    methods[idx] = { ...methods[idx], ...patch };
    setEditing({ ...editing, methods });
  };

  const removeMethod = (idx: number) => {
    if (!editing) return;
    setEditing({ ...editing, methods: editing.methods.filter((_, i) => i !== idx) });
  };

  const METHOD_ICONS: Record<string, any> = { api: Terminal, email: Mail, whatsapp: MessageSquare, csv: FileSpreadsheet, ftp: Globe, webhook: Webhook, manual: RefreshCw };

  return (
    <>
      <Seo title="Supplier Communications" path="/admin/commerce/supplier-automation/communications" />
      <div className="p-5 sm:p-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-semibold text-ink">Supplier Communications</h1>
            <p className="mt-1 text-sm text-muted">API, email, WhatsApp, and CSV configurations per supplier.</p>
          </div>
        </div>
        {profiles.length === 0 ? (
          <div className="mt-8"><EmptyState icon={<Radio className="h-6 w-6" />} title="No communication profiles" /></div>
        ) : (
          <div className="mt-6 space-y-6">
            {profiles.map(profile => (
              <div key={profile.id} className="card p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span className="grid h-10 w-10 place-items-center rounded-full bg-accent-soft text-accent"><Radio className="h-5 w-5" /></span>
                    <h3 className="font-semibold text-ink">{profile.supplierName}</h3>
                    <span className="badge bg-surface2 text-muted">{profile.methods.length} method{profile.methods.length !== 1 ? "s" : ""}</span>
                  </div>
                  <button onClick={() => setEditing({ ...profile })} className="btn-ghost btn-sm">Edit</button>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {profile.methods.map((m, i) => {
                    const Icon = METHOD_ICONS[m.type] || Terminal;
                    return (
                      <div key={i} className={cn("rounded-xl border p-4", m.enabled ? "border-line" : "border-line/50 opacity-60")}>
                        <div className="flex items-center gap-2 mb-2">
                          <Icon className="h-4 w-4 text-accent" />
                          <span className="text-sm font-medium text-ink capitalize">{m.type}</span>
                          <span className={cn("badge ml-auto", m.enabled ? "bg-success/15 text-success" : "bg-surface2 text-muted")}>{m.enabled ? "Active" : "Disabled"}</span>
                        </div>
                        <div className="space-y-1 text-xs text-muted">
                          {m.apiUrl && <p>URL: <span className="font-mono text-ink">{m.apiUrl}</span></p>}
                          {m.apiType && <p>Type: {m.apiType.toUpperCase()}</p>}
                          {m.authType && <p>Auth: {m.authType}</p>}
                          {m.webhookUrl && <p>Webhook: <span className="font-mono text-ink">{m.webhookUrl}</span></p>}
                          {m.rateLimit && <p>Rate Limit: {m.rateLimit}/min</p>}
                          {m.timeout && <p>Timeout: {m.timeout}ms</p>}
                          {m.retryRules && <p>Retries: {m.retryRules.maxRetries} (backoff: {m.retryRules.backoffMs}ms)</p>}
                          {m.healthCheckUrl && <p>Health: <span className="font-mono">{m.healthCheckUrl}</span></p>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit Profile */}
      {editing && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in" onClick={() => setEditing(null)} />
          <form onSubmit={saveProfile} className="card relative z-10 w-full max-w-2xl max-h-[85vh] overflow-y-auto p-6 animate-scale-in">
            <div className="flex items-center justify-between"><h2 className="text-lg font-semibold text-ink">Configure: {editing.supplierName}</h2>
            <button type="button" onClick={() => setEditing(null)} className="grid h-9 w-9 place-items-center rounded-full hover:bg-surface2"><X className="h-5 w-5" /></button></div>
            <div className="mt-5 space-y-6">
              {editing.methods.map((m, idx) => {
                const Icon = METHOD_ICONS[m.type] || Terminal;
                return (
                  <div key={idx} className="rounded-xl border border-line p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4 text-accent" />
                        <select className="text-sm font-medium bg-transparent border-0" value={m.type} onChange={e => updateMethod(idx, { type: e.target.value as any })}>
                          <option value="api">API</option><option value="email">Email</option><option value="whatsapp">WhatsApp</option>
                          <option value="csv">CSV</option><option value="ftp">FTP</option><option value="webhook">Webhook</option><option value="manual">Manual</option>
                        </select>
                      </div>
                      <div className="flex items-center gap-2">
                        <label className="flex items-center gap-1 text-xs"><input type="checkbox" checked={m.enabled} onChange={e => updateMethod(idx, { enabled: e.target.checked })} /> Active</label>
                        <button type="button" onClick={() => removeMethod(idx)} className="text-danger text-xs hover:underline">Remove</button>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {m.type === "api" && (
                        <>
                          <div className="col-span-2"><label className="label-field">API URL</label><input className="input-field" value={m.apiUrl || ""} onChange={e => updateMethod(idx, { apiUrl: e.target.value })} placeholder="https://api.example.com/v1" /></div>
                          <div><label className="label-field">API Type</label><select className="input-field" value={m.apiType || "rest"} onChange={e => updateMethod(idx, { apiType: e.target.value as any })}><option value="rest">REST</option><option value="graphql">GraphQL</option></select></div>
                          <div><label className="label-field">Auth Type</label><select className="input-field" value={m.authType || "bearer"} onChange={e => updateMethod(idx, { authType: e.target.value as any })}><option value="bearer">Bearer Token</option><option value="api_key">API Key</option><option value="basic">Basic Auth</option><option value="oauth">OAuth 2.0</option></select></div>
                          <div className="col-span-2"><label className="label-field">Bearer Token / API Key</label><input className="input-field font-mono text-xs" value={m.bearerToken || m.apiKey || ""} onChange={e => updateMethod(idx, { bearerToken: e.target.value })} /></div>
                        </>
                      )}
                      {m.type === "email" && (
                        <div className="col-span-2"><label className="label-field">Email Template</label><input className="input-field" value={m.emailTemplate || "standard_po"} onChange={e => updateMethod(idx, { emailTemplate: e.target.value })} /></div>
                      )}
                      <div><label className="label-field">Rate Limit (/min)</label><input type="number" className="input-field" value={m.rateLimit} onChange={e => updateMethod(idx, { rateLimit: Number(e.target.value) })} /></div>
                      <div><label className="label-field">Timeout (ms)</label><input type="number" className="input-field" value={m.timeout} onChange={e => updateMethod(idx, { timeout: Number(e.target.value) })} /></div>
                      <div><label className="label-field">Max Retries</label><input type="number" className="input-field" value={m.retryRules.maxRetries} onChange={e => updateMethod(idx, { retryRules: { ...m.retryRules, maxRetries: Number(e.target.value) } })} /></div>
                      <div><label className="label-field">Backoff (ms)</label><input type="number" className="input-field" value={m.retryRules.backoffMs} onChange={e => updateMethod(idx, { retryRules: { ...m.retryRules, backoffMs: Number(e.target.value) } })} /></div>
                    </div>
                  </div>
                );
              })}
              <button type="button" onClick={addMethod} className="btn-outline btn-sm w-full"><Plus className="h-4 w-4" /> Add Communication Method</button>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={() => setEditing(null)} className="btn-ghost btn-md">Cancel</button>
              <button type="submit" className="btn-primary btn-md">Save Configuration</button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
