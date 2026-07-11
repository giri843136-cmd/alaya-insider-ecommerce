/**
 * ALAYA INSIDER — Enterprise Discovery Engine
 * -------------------------------------------------
 * Powers the exploration experience: browsing history, exploration timeline,
 * personal collections, saved searches, bookmarks, reading lists, and mood boards.
 *
 * All data is persisted via localStorage and integrated with the store context.
 */
import { uid } from "./utils";

/* ------------------------------------------------------------------ */
/*  Types                                                             */
/* ------------------------------------------------------------------ */

export interface ExplorationEvent {
  id: string;
  type: "page_view" | "product_view" | "category_browse" | "search" | "collection_view" | "brand_view" | "article_view" | "comparison" | "wishlist_add" | "cart_add";
  label: string;
  entityId?: string;
  entityType?: string;
  path: string;
  ts: number;
  duration?: number; // seconds spent
}

export interface SavedSearch {
  id: string;
  query: string;
  filters: Record<string, string>;
  label?: string;
  notifyOnNew: boolean;
  createdAt: number;
  lastChecked?: number;
}

export interface PersonalCollection {
  id: string;
  name: string;
  description?: string;
  coverImage?: string;
  productIds: string[];
  articleIds: string[];
  isPublic: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface Bookmark {
  id: string;
  type: "product" | "article" | "collection" | "brand" | "search";
  label: string;
  entityId: string;
  path: string;
  note?: string;
  createdAt: number;
}

export interface ReadingListItem {
  id: string;
  articleId: string;
  title: string;
  savedAt: number;
  readAt?: number;
  readLater: boolean;
}

export interface MoodBoardItem {
  id: string;
  boardId: string;
  productId: string;
  note?: string;
  position: { x: number; y: number };
  ts: number;
}

export interface MoodBoard {
  id: string;
  name: string;
  description?: string;
  theme?: string;
  items: MoodBoardItem[];
  isPublic: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface DiscoveryStats {
  totalPageViews: number;
  totalProductViews: number;
  totalSearches: number;
  savedSearches: number;
  personalCollections: number;
  bookmarks: number;
  readingListItems: number;
  moodBoards: number;
  explorationTimelineDays: number;
}

/* ------------------------------------------------------------------ */
/*  Storage keys                                                      */
/* ------------------------------------------------------------------ */

const EVENTS_KEY = "alaya_discovery_events_v1";
const SEARCHES_KEY = "alaya_discovery_searches_v1";
const COLLECTIONS_KEY = "alaya_discovery_collections_v1";
const BOOKMARKS_KEY = "alaya_discovery_bookmarks_v1";
const READING_KEY = "alaya_discovery_reading_v1";
const BOARDS_KEY = "alaya_discovery_boards_v1";

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write<T>(key: string, value: T) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage full — silently degrade */
  }
}

/* ------------------------------------------------------------------ */
/*  Exploration Timeline                                               */
/* ------------------------------------------------------------------ */

export function addExplorationEvent(event: Omit<ExplorationEvent, "id" | "ts">): ExplorationEvent {
  const ev: ExplorationEvent = { ...event, id: uid("eev"), ts: Date.now() };
  const events = read<ExplorationEvent[]>(EVENTS_KEY, []);
  write(EVENTS_KEY, [ev, ...events].slice(0, 500)); // keep last 500
  return ev;
}

export function getExplorationTimeline(limit = 50): ExplorationEvent[] {
  return read<ExplorationEvent[]>(EVENTS_KEY, []).slice(0, limit);
}

export function getExplorationTimelineByType(type: ExplorationEvent["type"], limit = 20): ExplorationEvent[] {
  return read<ExplorationEvent[]>(EVENTS_KEY, []).filter((e) => e.type === type).slice(0, limit);
}

export function getRecentProductViews(limit = 20): ExplorationEvent[] {
  return getExplorationTimelineByType("product_view", limit);
}

export function getRecentSearches(limit = 10): ExplorationEvent[] {
  return getExplorationTimelineByType("search", limit);
}

export function clearExplorationTimeline() {
  write(EVENTS_KEY, []);
}

/* ------------------------------------------------------------------ */
/*  Saved Searches                                                    */
/* ------------------------------------------------------------------ */

export function saveSearch(input: Omit<SavedSearch, "id" | "createdAt">): SavedSearch {
  const search: SavedSearch = { ...input, id: uid("srs"), createdAt: Date.now() };
  const searches = read<SavedSearch[]>(SEARCHES_KEY, []);
  write(SEARCHES_KEY, [search, ...searches].slice(0, 50));
  return search;
}

export function getSavedSearches(): SavedSearch[] {
  return read<SavedSearch[]>(SEARCHES_KEY, []);
}

export function deleteSavedSearch(id: string) {
  const searches = read<SavedSearch[]>(SEARCHES_KEY, []);
  write(SEARCHES_KEY, searches.filter((s) => s.id !== id));
}

export function updateSavedSearch(id: string, patch: Partial<SavedSearch>) {
  const searches = read<SavedSearch[]>(SEARCHES_KEY, []);
  write(SEARCHES_KEY, searches.map((s) => (s.id === id ? { ...s, ...patch } : s)));
}

/* ------------------------------------------------------------------ */
/*  Personal Collections                                              */
/* ------------------------------------------------------------------ */

export function createCollection(input: Omit<PersonalCollection, "id" | "createdAt" | "updatedAt">): PersonalCollection {
  const collection: PersonalCollection = {
    ...input,
    id: uid("col"),
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  const collections = read<PersonalCollection[]>(COLLECTIONS_KEY, []);
  write(COLLECTIONS_KEY, [collection, ...collections]);
  return collection;
}

export function getCollections(): PersonalCollection[] {
  return read<PersonalCollection[]>(COLLECTIONS_KEY, []);
}

export function getCollection(id: string): PersonalCollection | undefined {
  return read<PersonalCollection[]>(COLLECTIONS_KEY, []).find((c) => c.id === id);
}

export function updateCollection(id: string, patch: Partial<PersonalCollection>) {
  const collections = read<PersonalCollection[]>(COLLECTIONS_KEY, []);
  write(COLLECTIONS_KEY, collections.map((c) => (c.id === id ? { ...c, ...patch, updatedAt: Date.now() } : c)));
}

export function deleteCollection(id: string) {
  const collections = read<PersonalCollection[]>(COLLECTIONS_KEY, []);
  write(COLLECTIONS_KEY, collections.filter((c) => c.id !== id));
}

export function addToCollection(collectionId: string, productId: string) {
  const collections = read<PersonalCollection[]>(COLLECTIONS_KEY, []);
  write(
    COLLECTIONS_KEY,
    collections.map((c) =>
      c.id === collectionId && !c.productIds.includes(productId)
        ? { ...c, productIds: [...c.productIds, productId], updatedAt: Date.now() }
        : c
    )
  );
}

export function removeFromCollection(collectionId: string, productId: string) {
  const collections = read<PersonalCollection[]>(COLLECTIONS_KEY, []);
  write(
    COLLECTIONS_KEY,
    collections.map((c) =>
      c.id === collectionId
        ? { ...c, productIds: c.productIds.filter((id) => id !== productId), updatedAt: Date.now() }
        : c
    )
  );
}

/* ------------------------------------------------------------------ */
/*  Bookmarks                                                        */
/* ------------------------------------------------------------------ */

export function addBookmark(input: Omit<Bookmark, "id" | "createdAt">): Bookmark {
  const bookmark: Bookmark = { ...input, id: uid("bmk"), createdAt: Date.now() };
  const bookmarks = read<Bookmark[]>(BOOKMARKS_KEY, []);
  write(BOOKMARKS_KEY, [bookmark, ...bookmarks].slice(0, 200));
  return bookmark;
}

export function getBookmarks(type?: Bookmark["type"]): Bookmark[] {
  const all = read<Bookmark[]>(BOOKMARKS_KEY, []);
  return type ? all.filter((b) => b.type === type) : all;
}

export function deleteBookmark(id: string) {
  const bookmarks = read<Bookmark[]>(BOOKMARKS_KEY, []);
  write(BOOKMARKS_KEY, bookmarks.filter((b) => b.id !== id));
}

export function isBookmarked(entityId: string, type: Bookmark["type"]): boolean {
  return read<Bookmark[]>(BOOKMARKS_KEY, []).some((b) => b.entityId === entityId && b.type === type);
}

/* ------------------------------------------------------------------ */
/*  Reading List                                                     */
/* ------------------------------------------------------------------ */

export function addToReadingList(articleId: string, title: string): ReadingListItem {
  const item: ReadingListItem = { id: uid("rl"), articleId, title, savedAt: Date.now(), readLater: true };
  const list = read<ReadingListItem[]>(READING_KEY, []);
  write(READING_KEY, [item, ...list.filter((i) => i.articleId !== articleId)].slice(0, 100));
  return item;
}

export function getReadingList(unreadOnly = false): ReadingListItem[] {
  const all = read<ReadingListItem[]>(READING_KEY, []);
  return unreadOnly ? all.filter((i) => !i.readAt) : all;
}

export function markArticleRead(id: string) {
  const list = read<ReadingListItem[]>(READING_KEY, []);
  write(READING_KEY, list.map((i) => (i.id === id ? { ...i, readAt: Date.now(), readLater: false } : i)));
}

export function removeFromReadingList(id: string) {
  const list = read<ReadingListItem[]>(READING_KEY, []);
  write(READING_KEY, list.filter((i) => i.id !== id));
}

/* ------------------------------------------------------------------ */
/*  Mood Boards                                                       */
/* ------------------------------------------------------------------ */

export function createMoodBoard(input: Omit<MoodBoard, "id" | "items" | "createdAt" | "updatedAt">): MoodBoard {
  const board: MoodBoard = { ...input, id: uid("mood"), items: [], createdAt: Date.now(), updatedAt: Date.now() };
  const boards = read<MoodBoard[]>(BOARDS_KEY, []);
  write(BOARDS_KEY, [board, ...boards]);
  return board;
}

export function getMoodBoards(): MoodBoard[] {
  return read<MoodBoard[]>(BOARDS_KEY, []);
}

export function getMoodBoard(id: string): MoodBoard | undefined {
  return read<MoodBoard[]>(BOARDS_KEY, []).find((b) => b.id === id);
}

export function addToMoodBoard(
  boardId: string,
  productId: string,
  note?: string,
  position?: { x: number; y: number }
): MoodBoardItem | null {
  const boards = read<MoodBoard[]>(BOARDS_KEY, []);
  const board = boards.find((b) => b.id === boardId);
  if (!board) return null;
  const item: MoodBoardItem = {
    id: uid("mbi"),
    boardId,
    productId,
    note,
    position: position || { x: Math.random() * 80, y: Math.random() * 80 },
    ts: Date.now(),
  };
  write(
    BOARDS_KEY,
    boards.map((b) =>
      b.id === boardId ? { ...b, items: [...b.items, item], updatedAt: Date.now() } : b
    )
  );
  return item;
}

export function removeFromMoodBoard(boardId: string, itemId: string) {
  const boards = read<MoodBoard[]>(BOARDS_KEY, []);
  write(
    BOARDS_KEY,
    boards.map((b) =>
      b.id === boardId ? { ...b, items: b.items.filter((i) => i.id !== itemId), updatedAt: Date.now() } : b
    )
  );
}

export function deleteMoodBoard(id: string) {
  const boards = read<MoodBoard[]>(BOARDS_KEY, []);
  write(BOARDS_KEY, boards.filter((b) => b.id !== id));
}

/* ------------------------------------------------------------------ */
/*  Stats                                                             */
/* ------------------------------------------------------------------ */

export function getDiscoveryStats(): DiscoveryStats {
  const events = read<ExplorationEvent[]>(EVENTS_KEY, []);
  const searches = read<SavedSearch[]>(SEARCHES_KEY, []);
  const collections = read<PersonalCollection[]>(COLLECTIONS_KEY, []);
  const bookmarks = read<Bookmark[]>(BOOKMARKS_KEY, []);
  const reading = read<ReadingListItem[]>(READING_KEY, []);
  const boards = read<MoodBoard[]>(BOARDS_KEY, []);

  const oldest = events.length > 0 ? Math.min(...events.map((e) => e.ts)) : Date.now();
  const days = Math.max(1, Math.round((Date.now() - oldest) / 86400000));

  return {
    totalPageViews: events.filter((e) => e.type === "page_view").length,
    totalProductViews: events.filter((e) => e.type === "product_view").length,
    totalSearches: events.filter((e) => e.type === "search").length,
    savedSearches: searches.length,
    personalCollections: collections.length,
    bookmarks: bookmarks.length,
    readingListItems: reading.length,
    moodBoards: boards.length,
    explorationTimelineDays: days,
  };
}
