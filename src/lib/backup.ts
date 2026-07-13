/**
 * ALAYA INSIDER — Backup & Restore manager.
 * Encapsulates manual + automatic full backups of the entire store payload,
 * with download, restore, and retention. Demonstrates the backup module from
 * the backend specification.
 */
import type { StoreData } from "./types";

const KEY = "alaya_backups";
const MAX = 10;

export interface BackupMeta {
  id: string;
  createdAt: number;
  size: number; // bytes
  type: "manual" | "auto";
  label: string;
}

interface BackupRecord extends BackupMeta {
  data: string; // serialized JSON
}

function readAll(): BackupRecord[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]") as BackupRecord[];
  } catch {
    return [];
  }
}

function writeAll(list: BackupRecord[]) {
  localStorage.setItem(KEY, JSON.stringify(list.slice(0, MAX)));
}

export function listBackups(): BackupMeta[] {
  return readAll().map(({ data, ...meta }) => meta).sort((a, b) => b.createdAt - a.createdAt);
}

/** Create a snapshot of the current store data. */
export function createBackup(data: StoreData, type: "manual" | "auto" = "manual", label?: string): BackupMeta {
  const serialized = JSON.stringify(data);
  const record: BackupRecord = {
    id: `bak_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
    createdAt: Date.now(),
    size: new Blob([serialized]).size,
    type,
    label: label || `${type === "auto" ? "Automatic" : "Manual"} backup`,
    data: serialized,
  };
  const list = readAll();
  writeAll([record, ...list]);
  return record;
}

/** Restore a backup by id, returning the store data. */
export function restoreBackup(id: string): StoreData | null {
  const record = readAll().find((b) => b.id === id);
  if (!record) return null;
  try {
    return JSON.parse(record.data) as StoreData;
  } catch {
    return null;
  }
}

/** Download a backup as JSON. */
export function downloadBackup(id: string) {
  const record = readAll().find((b) => b.id === id);
  if (!record) return;
  const blob = new Blob([record.data], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `alaya-backup-${new Date(record.createdAt).toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function deleteBackup(id: string) {
  writeAll(readAll().filter((b) => b.id !== id));
}

/** Verification stub — confirms a backup payload is parseable + structurally valid. */
export function verifyBackup(id: string): { valid: boolean; products: number; orders: number } {
  const record = readAll().find((b) => b.id === id);
  if (!record) return { valid: false, products: 0, orders: 0 };
  try {
    const d = JSON.parse(record.data) as StoreData;
    return { valid: !!d.version && Array.isArray(d.products), products: d.products?.length ?? 0, orders: d.orders?.length ?? 0 };
  } catch {
    return { valid: false, products: 0, orders: 0 };
  }
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}
