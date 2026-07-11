import type { OrderStatus } from "./types";

/** Single source of truth for order status presentation + ordering. */
export const ORDER_STATUSES: OrderStatus[] = [
  "pending",
  "processing",
  "paid",
  "packed",
  "shipped",
  "out_for_delivery",
  "delivered",
  "completed",
  "cancelled",
  "refunded",
];

/** Index used for the tracking timeline (higher = further along). */
export const STATUS_INDEX: Record<OrderStatus, number> = {
  pending: 0,
  processing: 1,
  paid: 1,
  packed: 2,
  shipped: 3,
  out_for_delivery: 4,
  delivered: 5,
  completed: 5,
  cancelled: -1,
  refunded: -1,
};

export const STATUS_STYLES: Record<OrderStatus, string> = {
  pending: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  processing: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  paid: "bg-accent-soft text-accent",
  packed: "bg-accent-soft text-accent",
  shipped: "bg-accent-soft text-accent",
  out_for_delivery: "bg-info/15 text-info",
  delivered: "bg-success/15 text-success",
  completed: "bg-success/15 text-success",
  cancelled: "bg-danger/15 text-danger",
  refunded: "bg-danger/15 text-danger",
};

/** Human-readable label for a status. */
export const statusLabel = (s: OrderStatus): string =>
  ({
    pending: "Pending",
    processing: "Processing",
    paid: "Payment confirmed",
    packed: "Packed",
    shipped: "Shipped",
    out_for_delivery: "Out for delivery",
    delivered: "Delivered",
    completed: "Completed",
    cancelled: "Cancelled",
    refunded: "Refunded",
  }[s]);
