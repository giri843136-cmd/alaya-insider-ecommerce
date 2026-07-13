/**
 * ALAYA INSIDER — Background Job Queue (client-side simulator).
 * -----------------------------------------------------------------
 * Demonstrates the job-queue architecture from the backend spec. Each job
 * type has a handler, runs async, reports progress, and is logged. In
 * production these map to queue workers (Redis/BullMQ/Sidekiq style); here
 * they execute against the store with realistic latency + audit logging.
 */
import type { StoreAccessor } from "./services";

export type JobType =
  | "image_optimization"
  | "affiliate_link_validation"
  | "email_send"
  | "supplier_notification"
  | "seo_generation"
  | "analytics_processing"
  | "search_indexing"
  | "backup"
  | "report_generation"
  | "cache_purge";

export interface Job {
  id: string;
  type: JobType;
  status: "queued" | "running" | "complete" | "failed";
  progress: number;
  message: string;
  createdAt: number;
  startedAt?: number;
  completedAt?: number;
}

export const JOB_LABELS: Record<JobType, string> = {
  image_optimization: "Image optimization",
  affiliate_link_validation: "Affiliate link validation",
  email_send: "Email send",
  supplier_notification: "Supplier notification",
  seo_generation: "SEO generation",
  analytics_processing: "Analytics processing",
  search_indexing: "Search indexing",
  backup: "Backup",
  report_generation: "Report generation",
  cache_purge: "Cache purge",
};

type Listener = (jobs: Job[]) => void;

class JobQueue {
  private jobs: Job[] = [];
  private listeners = new Set<Listener>();

  subscribe(fn: Listener) {
    this.listeners.add(fn);
    fn(this.jobs);
    return () => this.listeners.delete(fn);
  }

  private emit() {
    const snapshot = [...this.jobs];
    this.listeners.forEach((l) => l(snapshot));
  }

  private update(id: string, patch: Partial<Job>) {
    this.jobs = this.jobs.map((j) => (j.id === id ? { ...j, ...patch } : j));
    this.emit();
  }

  list() {
    return [...this.jobs].sort((a, b) => b.createdAt - a.createdAt);
  }

  enqueue(type: JobType, message = "", store?: StoreAccessor): string {
    const id = `job_${Math.random().toString(36).slice(2, 9)}`;
    const job: Job = { id, type, status: "queued", progress: 0, message, createdAt: Date.now() };
    this.jobs = [job, ...this.jobs].slice(0, 100);
    this.emit();
    if (store) store.log(`job.enqueue`, "job", id, type);
    // simulate async execution
    setTimeout(() => this.run(id, store), 400);
    return id;
  }

  private async run(id: string, store?: StoreAccessor) {
    this.update(id, { status: "running", startedAt: Date.now() });
    const steps = 5;
    for (let i = 1; i <= steps; i++) {
      await new Promise((r) => setTimeout(r, 220));
      this.update(id, { progress: Math.round((i / steps) * 100) });
    }
    this.update(id, { status: "complete", progress: 100, completedAt: Date.now() });
    if (store) store.log(`job.complete`, "job", id, this.jobs.find((j) => j.id === id)?.type);
  }
}

/** Singleton queue instance shared app-wide. */
export const jobQueue = new JobQueue();
