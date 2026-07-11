/**
 * ALAYA INSIDER — Base Repository
 * --------------------------------------------------------------------------
 * Generic CRUD repository base class providing consistent data access
 * for all entities. Every repository extends this base.
 *
 * Features:
 *  - Type-safe CRUD operations
 *  - Pagination with search and sort
 *  - Transaction support via withTransaction
 *  - Soft delete support
 *  - Bulk operations
 *  - Audit logging integration
 */

import pg from "pg";
import { query, queryOne, queryAll, buildPaginatedQuery, getTotalCount, withTransaction, type PaginatedResult, type ListParams } from "../index.js";
import { createAuditLog } from "./audit.js";
import { v4 as uuidv4 } from "uuid";

/* ================================================================== */
/*  TYPES                                                              */
/* ================================================================== */

export interface RepositoryOptions {
  /** Table name in PostgreSQL. */
  tableName: string;
  /** Primary key column name (default: id). */
  primaryKey?: string;
  /** Columns that support full-text / ILIKE search. */
  searchColumns?: string[];
  /** Whether to use soft delete (requires deleted_at column). */
  softDelete?: boolean;
  /** Columns to exclude from patch updates (e.g. created_at). */
  immutableColumns?: string[];
  /** Default sort column. */
  defaultSort?: string;
  /** Default sort direction. */
  defaultOrder?: "asc" | "desc";
  /** Entity type name for audit logging. */
  entityType: string;
}

/* ================================================================== */
/*  BASE REPOSITORY                                                    */
/* ================================================================== */

export abstract class BaseRepository<T extends { id: string }> {
  /** These are public so anonymous-class exports work correctly. */
  tableName: string;
  primaryKey: string;
  searchColumns: string[];
  softDelete: boolean;
  immutableColumns: string[];
  defaultSort: string;
  defaultOrder: "asc" | "desc";
  entityType: string;

  constructor(opts: RepositoryOptions) {
    this.tableName = opts.tableName;
    this.primaryKey = opts.primaryKey || "id";
    this.searchColumns = opts.searchColumns || [];
    this.softDelete = opts.softDelete || false;
    this.immutableColumns = opts.immutableColumns || ["created_at"];
    this.defaultSort = opts.defaultSort || "created_at";
    this.defaultOrder = opts.defaultOrder || "desc";
    this.entityType = opts.entityType;
  }

  /* ============================================================== */
  /*  ID GENERATION                                                  */
  /* ============================================================== */

  /** Generate a UUID v4. */
  genId(): string {
    return uuidv4();
  }

  /* ============================================================== */
  /*  QUOTE COLUMN NAMES                                             */
  /* ============================================================== */

  quote(col: string): string {
    return `"${col.replace(/"/g, '""')}"`;
  }

  /* ============================================================== */
  /*  LIST WITH PAGINATION                                           */
  /* ============================================================== */

  async list(params: ListParams = {}): Promise<PaginatedResult<T>> {
    const page = Math.max(1, params.page ?? 1);
    const pageSize = Math.min(100, Math.max(1, params.pageSize ?? 24));
    const sort = params.sort || this.defaultSort;
    const order = params.order || this.defaultOrder;

    // Build WHERE clause
    const conditions: string[] = [];
    const queryParams: any[] = [];
    let paramIndex = 1;

    // Soft delete filter
    if (this.softDelete) {
      conditions.push(`${this.quote("deleted_at")} IS NULL`);
    }

    // Search
    if (params.search && this.searchColumns.length > 0) {
      const searchConditions = this.searchColumns.map((col) => {
        queryParams.push(`%${params.search}%`);
        return `${this.quote(col)}::text ILIKE $${paramIndex++}`;
      });
      conditions.push(`(${searchConditions.join(" OR ")})`);
    }

    // Additional filters from params (exclude pagination/sort params)
    const filterKeys = Object.keys(params).filter(
      (k) => !["page", "pageSize", "search", "sort", "order"].includes(k),
    );
    for (const key of filterKeys) {
      const val = params[key];
      if (val !== undefined && val !== "") {
        queryParams.push(val);
        conditions.push(`${this.quote(key)} = $${paramIndex++}`);
      }
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    // Count
    const countSql = `SELECT COUNT(*) as count FROM ${this.quote(this.tableName)} ${whereClause}`;
    const countResult = await query<{ count: string }>(countSql, queryParams);
    const total = Number(countResult.rows[0]?.count ?? 0);

    // Sort (validate sort column exists)
    const allowedSorts = [...this.searchColumns, "created_at", "updated_at", "id", this.primaryKey];
    const sortCol = allowedSorts.includes(sort) ? sort : this.defaultSort;
    const sortDir = order === "asc" ? "ASC" : "DESC";

    // Pagination
    const offset = (page - 1) * pageSize;
    queryParams.push(pageSize);
    queryParams.push(offset);

    const dataSql = `
      SELECT * FROM ${this.quote(this.tableName)} ${whereClause}
      ORDER BY ${this.quote(sortCol)} ${sortDir}
      LIMIT $${paramIndex++} OFFSET $${paramIndex++}
    `;

    const dataResult = await query<T>(dataSql, queryParams);

    return {
      data: dataResult.rows as unknown as T[],
      total,
      page,
      pageSize,
      hasMore: page * pageSize < total,
    };
  }

  /* ============================================================== */
  /*  GET BY ID                                                      */
  /* ============================================================== */

  async getById(id: string): Promise<T | null> {
    let sql = `SELECT * FROM ${this.quote(this.tableName)} WHERE ${this.quote(this.primaryKey)} = $1`;
    if (this.softDelete) {
      sql += ` AND ${this.quote("deleted_at")} IS NULL`;
    }
    return queryOne<T>(sql, [id]);
  }

  /* ============================================================== */
  /*  CREATE                                                         */
  /* ============================================================== */

  async create(input: Partial<T>, actor = "system"): Promise<T> {
    const id = input.id || this.genId();
    const now = new Date().toISOString();

    const record = {
      ...input,
      id,
      created_at: now,
      updated_at: now,
    } as Record<string, any>;

    const columns = Object.keys(record);
    const values = Object.values(record);
    const placeholders = values.map((_, i) => `$${i + 1}`);

    const sql = `
      INSERT INTO ${this.quote(this.tableName)} 
      (${columns.map((c) => this.quote(c)).join(", ")})
      VALUES (${placeholders.join(", ")})
      RETURNING *
    `;

    const result = await query<T>(sql, values);
    const entity = result.rows[0] as unknown as T;

    // Audit log
    await createAuditLog({
      actor,
      action: "create",
      entity_type: this.entityType,
      entity_id: id,
      after_data: entity as Record<string, unknown>,
    });

    return entity;
  }

  /* ============================================================== */
  /*  UPDATE                                                         */
  /* ============================================================== */

  async update(id: string, patch: Partial<T>, actor = "system"): Promise<T | null> {
    // Get before state for audit
    const before = await this.getById(id);
    if (!before) return null;

    const updates: Record<string, any> = { ...patch } as Record<string, any>;
    
    // Remove immutable columns
    for (const col of this.immutableColumns) {
      delete updates[col];
    }
    
    // Set updated_at
    updates.updated_at = new Date().toISOString();

    const columns = Object.keys(updates);
    if (columns.length === 0) return before;

    const setClauses = columns.map((col, i) => `${this.quote(col)} = $${i + 2}`);
    const values = Object.values(updates);

    const sql = `
      UPDATE ${this.quote(this.tableName)}
      SET ${setClauses.join(", ")}
      WHERE ${this.quote(this.primaryKey)} = $1
      RETURNING *
    `;

    const result = await query<T>(sql, [id, ...values]);
    const entity = result.rows[0] as unknown as T;

    if (entity) {
      // Audit log
      await createAuditLog({
        actor,
        action: "update",
        entity_type: this.entityType,
        entity_id: id,
        before_data: before as Record<string, unknown>,
        after_data: entity as Record<string, unknown>,
      });
    }

    return entity || null;
  }

  /* ============================================================== */
  /*  DELETE                                                         */
  /* ============================================================== */

  async delete(id: string, actor = "system"): Promise<boolean> {
    const before = await this.getById(id);
    if (!before) return false;

    if (this.softDelete) {
      await query(
        `UPDATE ${this.quote(this.tableName)} SET deleted_at = NOW(), updated_at = NOW() WHERE ${this.quote(this.primaryKey)} = $1`,
        [id],
      );
    } else {
      await query(
        `DELETE FROM ${this.quote(this.tableName)} WHERE ${this.quote(this.primaryKey)} = $1`,
        [id],
      );
    }

    // Audit log
    await createAuditLog({
      actor,
      action: "delete",
      entity_type: this.entityType,
      entity_id: id,
      before_data: before as Record<string, unknown>,
    });

    return true;
  }

  /* ============================================================== */
  /*  BULK OPERATIONS                                                */
  /* ============================================================== */

  async bulkCreate(inputs: Partial<T>[], actor = "system"): Promise<T[]> {
    if (inputs.length === 0) return [];

    const results: T[] = [];
    for (const input of inputs) {
      const entity = await this.create(input, actor);
      results.push(entity);
    }
    return results;
  }

  async bulkUpdate(ids: string[], patch: Partial<T>, actor = "system"): Promise<number> {
    let count = 0;
    for (const id of ids) {
      const result = await this.update(id, patch, actor);
      if (result) count++;
    }
    return count;
  }

  async bulkDelete(ids: string[], actor = "system"): Promise<number> {
    let count = 0;
    for (const id of ids) {
      const deleted = await this.delete(id, actor);
      if (deleted) count++;
    }
    return count;
  }

  /* ============================================================== */
  /*  EXISTS CHECK                                                   */
  /* ============================================================== */

  async exists(id: string): Promise<boolean> {
    let q = `SELECT 1 FROM ${this.quote(this.tableName)} WHERE ${this.quote(this.primaryKey)} = $1`;
    if (this.softDelete) {
      q += ` AND ${this.quote("deleted_at")} IS NULL`;
    }
    const result = await query(q, [id]);
    return result.rows.length > 0;
  }

  /* ============================================================== */
  /*  COUNT                                                          */
  /* ============================================================== */

  async count(conditions: Record<string, any> = {}): Promise<number> {
    const keys = Object.keys(conditions);
    let sql = `SELECT COUNT(*) as count FROM ${this.quote(this.tableName)}`;
    
    if (this.softDelete) {
      sql += ` WHERE deleted_at IS NULL`;
      if (keys.length > 0) {
        sql += ` AND `;
      }
    } else if (keys.length > 0) {
      sql += ` WHERE `;
    }

    const values: any[] = [];
    if (keys.length > 0) {
      const clauses = keys.map((key, i) => {
        values.push(conditions[key]);
        return `${this.quote(key)} = $${i + 1}`;
      });
      sql += clauses.join(" AND ");
    }

    const result = await query<{ count: string }>(sql, values);
    return Number(result.rows[0]?.count ?? 0);
  }

  /* ============================================================== */
  /*  TRANSACTIONAL OPERATIONS                                       */
  /* ============================================================== */

  /**
   * Execute operations within a transaction.
   * If any operation fails, all changes are rolled back.
   */
  async transactional<R>(fn: () => Promise<R>): Promise<R> {
    return withTransaction(async () => {
      return fn();
    });
  }
}
