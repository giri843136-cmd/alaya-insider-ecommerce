/**
 * ALAYA INSIDER — Seed Data Helpers
 * Shared utility functions for generating realistic seed data.
 */

import { v4 } from "uuid";

export function now(): number { return Date.now(); }
export function daysAgo(d: number): number { return now() - d * 86400000; }
export function hoursAgo(h: number): number { return now() - h * 3600000; }
export function uid(prefix = "id"): string { return `${prefix}_${v4().slice(0, 8)}${Date.now().toString(36).slice(-4)}`; }
export function ono(): string { return `AL-${Math.floor(100000 + Math.random() * 900000)}`; }
export function rtn(): string { return `RT-${Math.floor(100000 + Math.random() * 900000)}`; }
export function tkn(): string { return `TK-${v4().slice(0, 12).toUpperCase()}`; }

/** Pexels product image — square crop for galleries */
export function img(id: number, w = 800, h = 1200): string {
  return `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=${w}&h=${h}`;
}

/** Wide image for hero slides and banners */
export function wide(id: number, w = 1600, h = 900): string {
  return `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=${w}&h=${h}`;
}

/** Round product image for thumbnails */
export function thumb(id: number, size = 300): string {
  return `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=${size}&h=${size}`;
}

/** Profile/avatar image */
export function avatar(id: number): string {
  return `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=200&h=200`;
}

/** Generate star rating */
export function rating(min = 3.0, max = 5.0): number {
  return Math.round((min + Math.random() * (max - min)) * 10) / 10;
}

/** Generate review count */
export function reviewCount(min = 5, max = 200): number {
  return Math.floor(min + Math.random() * (max - min));
}

/** Generate stock count */
export function stock(min = 0, max = 200): number {
  return Math.floor(min + Math.random() * (max - min));
}
