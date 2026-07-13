import { useState } from "react";
import { Plus, Truck, Crown, X, Search, FileText, Shield, Star } from "lucide-react";
import { Seo } from "../../components/Seo";
import { EmptyState } from "../../components/ui";
import { cn } from "@/utils/cn";
import { getSupplierProfiles, saveSupplierProfile, deleteSupplierProfile } from "../../lib/supplier-automation";
import type { SupplierProfile } from "../../lib/commerce-types";
import { uid } from "../../lib/utils";

export default function SupplierAutomationDirectory() {
  const [profiles, setProfiles] = useState<SupplierProfile[]>(getSupplierProfiles);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [editing, setEditing] = useState<Partial<SupplierProfile> | null>(null);
  const [viewing, setViewing] = useState<SupplierProfile | null>(null);

  const refresh = () => setProfiles(getSupplierProfiles());

  const filtered = profiles.filter(p => {
    if (search && !p.companyName.toLowerCase().includes(search.toLowerCase()) && !p.email.toLowerCase().includes(search.toLowerCase())) return false;
    if (statusFilter !== "all" && p.status !== statusFilter) return false;
    return true;
  });

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing?.companyName?.trim()) return;
    const profile: SupplierProfile = {
      id: editing.id || uid("sp"),
      supplierId: editing.supplierId || "",
      companyName: editing.companyName || "",
      businessType: editing.businessType || "",
      contactPerson: editing.contactPerson || "",
      email: editing.email || "",
      phone: editing.phone || "",
      whatsapp: editing.whatsapp || "",
      website: editing.website || "",
      portalUrl: editing.portalUrl || "",
      country: editing.country || "",
      state: editing.state || "",
      city: editing.city || "",
      warehouseAddress: editing.warehouseAddress || "",
      returnAddress: editing.returnAddress || "",
      currency: editing.currency || "USD",
      timeZone: editing.timeZone || "UTC",
      businessHours: editing.businessHours || "9:00 AM - 6:00 PM",
      avgProcessingTime: editing.avgProcessingTime ?? 3,
      avgDeliveryTime: editing.avgDeliveryTime ?? 6,
      moq: editing.moq ?? 1,
      maxDailyCapacity: editing.maxDailyCapacity ?? 500,
      reliabilityScore: editing.reliabilityScore ?? 80,
      performanceScore: editing.performanceScore ?? 75,
      qualityScore: editing.qualityScore ?? 85,
      avgReviewScore: editing.avgReviewScore ?? 4,
      shippingCountries: editing.shippingCountries || [],
      supportedCarriers: editing.supportedCarriers || [],
      preferredCarrier: editing.preferredCarrier || "",
      insuranceAvailable: editing.insuranceAvailable ?? true,
      trackingSupported: editing.trackingSupported ?? true,
      returnsAccepted: editing.returnsAccepted ?? true,
      returnPolicy: editing.returnPolicy || "",
      replacementPolicy: editing.replacementPolicy || "",
      paymentTerms: editing.paymentTerms || "Net 30",
      taxDetails: editing.taxDetails || "",
      documents: editing.documents || [],
      contracts: editing.contracts || [],
      certificates: editing.certificates || [],
      internalNotes: editing.internalNotes || "",
      tags: editing.tags || [],
      status: editing.status || "active",
      priority: editing.priority ?? 3,
      isPrimary: editing.isPrimary ?? false,
      isBackup: editing.isBackup ?? false,
      createdAt: editing.createdAt || Date.now(),
      updatedAt: Date.now(),
    };
    saveSupplierProfile(profile);
    refresh();
    setEditing(null);
  };

  const scoreColor = (score: number) => score >= 80 ? "text-success" : score >= 60 ? "text-warning" : "text-danger";

  return (
    <>
      <Seo title="Supplier Directory" path="/admin/commerce/supplier-automation/directory" />
      <div className="p-5 sm:p-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-semibold text-ink">Supplier Directory</h1>
            <p className="mt-1 text-sm text-muted">{profiles.length} suppliers with full profiles.</p>
          </div>
          <button onClick={() => setEditing({ companyName: "" })} className="btn-primary btn-md"><Plus className="h-4 w-4" /> Add Supplier Profile</button>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 max-w-xs"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" /><input className="input-field pl-9" placeholder="Search suppliers..." value={search} onChange={e => setSearch(e.target.value)} /></div>
          <select className="input-field w-auto" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="all">All Status</option><option value="active">Active</option><option value="inactive">Inactive</option><option value="blacklisted">Blacklisted</option>
          </select>
        </div>

        {filtered.length === 0 ? (
          <div className="mt-8"><EmptyState icon={<Truck className="h-6 w-6" />} title="No supplier profiles" action={<button onClick={() => setEditing({ companyName: "" })} className="btn-primary btn-md">Add Profile</button>} /></div>
        ) : (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map(p => {
              const avgScore = Math.round((p.reliabilityScore + p.performanceScore + p.qualityScore) / 3);
              return (
                <div key={p.id} className={cn("card p-5 cursor-pointer transition-all hover:shadow-lg", p.status === "inactive" && "opacity-60", p.status === "blacklisted" && "opacity-40 border-danger/30")} onClick={() => setViewing(p)}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <span className={cn("grid h-12 w-12 place-items-center rounded-full text-lg font-bold", p.isPrimary ? "bg-accent text-accent-ink" : "bg-surface2 text-muted")}>
                        {p.isPrimary ? <Crown className="h-6 w-6" /> : p.companyName[0]}
                      </span>
                      <div>
                        <h3 className="font-semibold text-ink">{p.companyName}</h3>
                        <p className="text-xs text-muted">{p.country} · {p.businessType || "Supplier"}</p>
                      </div>
                    </div>
                    <span className={cn("badge", p.status === "active" ? "bg-success/15 text-success" : p.status === "inactive" ? "bg-surface2 text-muted" : "bg-danger/15 text-danger")}>{p.status}</span>
                  </div>
                  <div className="mt-4 grid grid-cols-3 gap-3 text-center text-xs">
                    <div><p className="text-muted">Reliability</p><p className={cn("font-semibold", scoreColor(p.reliabilityScore))}>{p.reliabilityScore}</p></div>
                    <div><p className="text-muted">Performance</p><p className={cn("font-semibold", scoreColor(p.performanceScore))}>{p.performanceScore}</p></div>
                    <div><p className="text-muted">Quality</p><p className={cn("font-semibold", scoreColor(p.qualityScore))}>{p.qualityScore}</p></div>
                  </div>
                  <div className="mt-3 h-2 rounded-full bg-surface2 overflow-hidden">
                    <div className={cn("h-full rounded-full transition-all", avgScore >= 80 ? "bg-success" : avgScore >= 60 ? "bg-warning" : "bg-danger")} style={{ width: `${avgScore}%` }} />
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1">
                    <span className="badge bg-surface2 text-muted">{p.avgProcessingTime}d processing</span>
                    <span className="badge bg-surface2 text-muted">{p.avgDeliveryTime}d delivery</span>
                    {p.trackingSupported && <span className="badge bg-info/15 text-info">Tracking</span>}
                    {p.insuranceAvailable && <span className="badge bg-success/15 text-success">Insurance</span>}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Detail View */}
      {viewing && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4" onClick={() => setViewing(null)}>
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in" />
          <div className="card relative z-10 w-full max-w-2xl max-h-[85vh] overflow-y-auto p-6 animate-scale-in" onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <span className={cn("grid h-16 w-16 place-items-center rounded-full text-2xl font-bold", viewing.isPrimary ? "bg-accent text-accent-ink" : "bg-surface2 text-muted")}>{viewing.companyName[0]}</span>
                <div><h2 className="text-xl font-semibold text-ink">{viewing.companyName}</h2><p className="text-sm text-muted">{viewing.country} · {viewing.businessType || "Supplier"}</p></div>
              </div>
              <button onClick={() => setViewing(null)} className="grid h-9 w-9 place-items-center rounded-full hover:bg-surface2"><X className="h-5 w-5" /></button>
            </div>
            <div className="mt-6 grid grid-cols-2 gap-4 text-sm">
              <DetailField label="Contact Person" value={viewing.contactPerson} icon={Star} />
              <DetailField label="Email" value={viewing.email} />
              <DetailField label="Phone" value={viewing.phone} />
              <DetailField label="WhatsApp" value={viewing.whatsapp} />
              <DetailField label="Website" value={viewing.website} />
              <DetailField label="Portal URL" value={viewing.portalUrl} />
              <DetailField label="Processing Time" value={`${viewing.avgProcessingTime} days`} />
              <DetailField label="Delivery Time" value={`${viewing.avgDeliveryTime} days`} />
              <DetailField label="MOQ" value={String(viewing.moq)} />
              <DetailField label="Max Daily Capacity" value={String(viewing.maxDailyCapacity)} />
              <DetailField label="Payment Terms" value={viewing.paymentTerms} />
              <DetailField label="Currency" value={viewing.currency} />
              <DetailField label="Warehouse" value={viewing.warehouseAddress} />
              <DetailField label="Return Address" value={viewing.returnAddress} />
            </div>
            <div className="mt-4 grid grid-cols-3 gap-4">
              <ScoreBadge label="Reliability" score={viewing.reliabilityScore} />
              <ScoreBadge label="Performance" score={viewing.performanceScore} />
              <ScoreBadge label="Quality" score={viewing.qualityScore} />
            </div>
            {viewing.documents.length > 0 && (
              <div className="mt-4"><p className="text-xs text-muted mb-1">Documents</p><div className="flex flex-wrap gap-2">{viewing.documents.map(d => <span key={d} className="badge bg-surface2 text-muted"><FileText className="h-3 w-3" /> {d}</span>)}</div></div>
            )}
            {viewing.contracts.length > 0 && (
              <div className="mt-3"><p className="text-xs text-muted mb-1">Contracts</p><div className="flex flex-wrap gap-2">{viewing.contracts.map(c => <span key={c} className="badge bg-surface2 text-muted"><FileText className="h-3 w-3" /> {c}</span>)}</div></div>
            )}
            {viewing.certificates.length > 0 && (
              <div className="mt-3"><p className="text-xs text-muted mb-1">Certifications</p><div className="flex flex-wrap gap-2">{viewing.certificates.map(c => <span key={c} className="badge bg-surface2 text-muted"><Shield className="h-3 w-3" /> {c}</span>)}</div></div>
            )}
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => { setViewing(null); setEditing({ ...viewing }); }} className="btn-outline btn-md"><Star className="h-4 w-4" /> Edit</button>
              <button onClick={() => { deleteSupplierProfile(viewing.id); refresh(); setViewing(null); }} className="btn btn-md border border-line text-danger hover:bg-danger/10">Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Form */}
      {editing && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in" onClick={() => setEditing(null)} />
          <form onSubmit={save} className="card relative z-10 w-full max-w-lg max-h-[85vh] overflow-y-auto p-6 animate-scale-in">
            <div className="flex items-center justify-between"><h2 className="text-lg font-semibold text-ink">{editing.id ? "Edit Supplier" : "Add Supplier Profile"}</h2>
            <button type="button" onClick={() => setEditing(null)} className="grid h-9 w-9 place-items-center rounded-full hover:bg-surface2"><X className="h-5 w-5" /></button></div>
            <div className="mt-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div><label className="label-field">Company Name</label><input className="input-field" value={editing.companyName || ""} onChange={e => setEditing({...editing, companyName: e.target.value})} required /></div>
                <div><label className="label-field">Business Type</label><input className="input-field" value={editing.businessType || ""} onChange={e => setEditing({...editing, businessType: e.target.value})} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="label-field">Contact Person</label><input className="input-field" value={editing.contactPerson || ""} onChange={e => setEditing({...editing, contactPerson: e.target.value})} /></div>
                <div><label className="label-field">Email</label><input type="email" className="input-field" value={editing.email || ""} onChange={e => setEditing({...editing, email: e.target.value})} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="label-field">Phone</label><input className="input-field" value={editing.phone || ""} onChange={e => setEditing({...editing, phone: e.target.value})} /></div>
                <div><label className="label-field">WhatsApp</label><input className="input-field" value={editing.whatsapp || ""} onChange={e => setEditing({...editing, whatsapp: e.target.value})} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="label-field">Country</label><input className="input-field" value={editing.country || ""} onChange={e => setEditing({...editing, country: e.target.value})} /></div>
                <div><label className="label-field">Currency</label><input className="input-field" value={editing.currency || "USD"} onChange={e => setEditing({...editing, currency: e.target.value})} /></div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div><label className="label-field">Reliability</label><input type="number" min={0} max={100} className="input-field" value={editing.reliabilityScore ?? 80} onChange={e => setEditing({...editing, reliabilityScore: Number(e.target.value)})} /></div>
                <div><label className="label-field">Performance</label><input type="number" min={0} max={100} className="input-field" value={editing.performanceScore ?? 75} onChange={e => setEditing({...editing, performanceScore: Number(e.target.value)})} /></div>
                <div><label className="label-field">Quality</label><input type="number" min={0} max={100} className="input-field" value={editing.qualityScore ?? 85} onChange={e => setEditing({...editing, qualityScore: Number(e.target.value)})} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="label-field">Processing (days)</label><input type="number" className="input-field" value={editing.avgProcessingTime ?? 3} onChange={e => setEditing({...editing, avgProcessingTime: Number(e.target.value)})} /></div>
                <div><label className="label-field">Delivery (days)</label><input type="number" className="input-field" value={editing.avgDeliveryTime ?? 6} onChange={e => setEditing({...editing, avgDeliveryTime: Number(e.target.value)})} /></div>
              </div>
              <div><label className="label-field">Internal Notes</label><textarea rows={2} className="input-field resize-none" value={editing.internalNotes || ""} onChange={e => setEditing({...editing, internalNotes: e.target.value})} /></div>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={editing.isPrimary ?? false} onChange={e => setEditing({...editing, isPrimary: e.target.checked})} className="h-4 w-4" /> Primary</label>
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={editing.isBackup ?? false} onChange={e => setEditing({...editing, isBackup: e.target.checked})} className="h-4 w-4" /> Backup</label>
                <select className="input-field w-auto text-sm" value={editing.status || "active"} onChange={e => setEditing({...editing, status: e.target.value as any})}>
                  <option value="active">Active</option><option value="inactive">Inactive</option><option value="blacklisted">Blacklisted</option>
                </select>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={() => setEditing(null)} className="btn-ghost btn-md">Cancel</button>
              <button type="submit" className="btn-primary btn-md">{editing.id ? "Save Changes" : "Create Profile"}</button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}

function DetailField({ label, value, icon: Icon }: { label: string; value?: string; icon?: any }) {
  if (!value) return null;
  return (
    <div className="rounded-xl bg-surface2/50 p-3">
      <p className="text-xs text-muted flex items-center gap-1">{Icon && <Icon className="h-3 w-3" />}{label}</p>
      <p className="text-sm font-medium text-ink mt-0.5">{value}</p>
    </div>
  );
}

function ScoreBadge({ label, score }: { label: string; score: number }) {
  return (
    <div className="rounded-xl bg-surface2/50 p-3 text-center">
      <p className="text-xs text-muted">{label}</p>
      <p className={cn("text-lg font-bold", score >= 80 ? "text-success" : score >= 60 ? "text-warning" : "text-danger")}>{score}</p>
      <div className="mt-1 h-1.5 rounded-full bg-surface2 overflow-hidden">
        <div className={cn("h-full rounded-full", score >= 80 ? "bg-success" : score >= 60 ? "bg-warning" : "bg-danger")} style={{ width: `${score}%` }} />
      </div>
    </div>
  );
}
