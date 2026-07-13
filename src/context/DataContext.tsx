/**
 * ALAYA INSIDER — Data Platform React Context
 * Bridges the enterprise data platform engine to React UI.
 */
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  getDatabaseProfiles, updateDatabaseProfile, getConnectionStats,
  getSchemaTables, getSchemaStats,
  getMigrations, runMigration, rollbackMigration, getMigrationStats,
  getSlowQueries, getQueryStats,
  getStorageVolumes, getStorageStats,
  getBackupJobs, getBackupPolicies, createBackupJob, verifyBackupJob, getBackupStats,
  getDataPolicies, getDataCatalog, getGovernanceStats,
  getDataQualityReports, runDataQualityCheck,
  getDataMetrics, getDataLineage,
  type DatabaseProfile,
  type SchemaTable,
  type Migration,  type BackupJob, type BackupPolicy, type BackupType,
  type StorageVolume,
  type QueryProfile,
  type DataPolicy, type DataCatalogEntry,
  type DataQualityReport,
  type DataMetric,

} from "../lib/data";

/* ================================================================== */
/*  CONTEXT DEFINITION                                                  */
/* ================================================================== */

interface DataContextValue {
  /* Database */
  databaseProfiles: DatabaseProfile[];
  connectionStats: ReturnType<typeof getConnectionStats>;
  updateProfile: (id: string, patch: Partial<DatabaseProfile>) => DatabaseProfile | null;

  /* Schema */
  schemaTables: SchemaTable[];
  schemaStats: ReturnType<typeof getSchemaStats>;

  /* Migrations */
  migrations: Migration[];
  migrationStats: ReturnType<typeof getMigrationStats>;
  runMig: (id: string) => Migration | null;
  rollbackMig: (id: string) => Migration | null;

  /* Queries */
  slowQueries: QueryProfile[];
  queryStats: ReturnType<typeof getQueryStats>;

  /* Storage */
  storageVolumes: StorageVolume[];
  storageStats: ReturnType<typeof getStorageStats>;

  /* Backups */
  backupJobs: BackupJob[];
  backupPolicies: BackupPolicy[];
  backupStats: ReturnType<typeof getBackupStats>;
  createBackup: (name: string, type: BackupType, database: string) => BackupJob;
  verifyBackup: (id: string, verifier: string) => BackupJob | null;

  /* Governance */
  dataPolicies: DataPolicy[];
  dataCatalog: DataCatalogEntry[];
  governanceStats: ReturnType<typeof getGovernanceStats>;

  /* Data Quality */
  qualityReports: DataQualityReport[];
  runQualityCheck: () => DataQualityReport[];

  /* Metrics & Lineage */
  dataMetrics: DataMetric[];
  dataLineage: ReturnType<typeof getDataLineage>;

  /* Refresh */
  refresh: () => void;
}

const DataContext = createContext<DataContextValue | null>(null);

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData must be used within <DataProvider>");
  return ctx;
}

/* ================================================================== */
/*  PROVIDER                                                           */
/* ================================================================== */

export function DataProvider({ children }: { children: ReactNode }) {
  const [, setNonce] = useState(0);
  const refresh = useCallback(() => setNonce((n) => n + 1), []);

  const [databaseProfiles, setDatabaseProfiles] = useState(() => getDatabaseProfiles());
  const [connectionStats, setConnectionStats] = useState(() => getConnectionStats());
  const [schemaTables, setSchemaTables] = useState(() => getSchemaTables());
  const [schemaStats, setSchemaStats] = useState(() => getSchemaStats());
  const [migrations, setMigrations] = useState(() => getMigrations());
  const [migrationStats, setMigrationStats] = useState(() => getMigrationStats());
  const [slowQueries, setSlowQueries] = useState(() => getSlowQueries());
  const [queryStats, setQueryStats] = useState(() => getQueryStats());
  const [storageVolumes, setStorageVolumes] = useState(() => getStorageVolumes());
  const [storageStats, setStorageStats] = useState(() => getStorageStats());
  const [backupJobs, setBackupJobs] = useState(() => getBackupJobs());
  const [backupPolicies, setBackupPolicies] = useState(() => getBackupPolicies());
  const [backupStats, setBackupStats] = useState(() => getBackupStats());
  const [dataPolicies, setDataPolicies] = useState(() => getDataPolicies());
  const [dataCatalog, setDataCatalog] = useState(() => getDataCatalog());
  const [governanceStats, setGovernanceStats] = useState(() => getGovernanceStats());
  const [qualityReports, setQualityReports] = useState(() => getDataQualityReports());
  const [dataMetrics, setDataMetrics] = useState(() => getDataMetrics());
  const [dataLineage, setDataLineage] = useState(() => getDataLineage());

  const doRefresh = useCallback(() => {
    setDatabaseProfiles(getDatabaseProfiles());
    setConnectionStats(getConnectionStats());
    setSchemaTables(getSchemaTables());
    setSchemaStats(getSchemaStats());
    setMigrations(getMigrations());
    setMigrationStats(getMigrationStats());
    setSlowQueries(getSlowQueries());
    setQueryStats(getQueryStats());
    setStorageVolumes(getStorageVolumes());
    setStorageStats(getStorageStats());
    setBackupJobs(getBackupJobs());
    setBackupPolicies(getBackupPolicies());
    setBackupStats(getBackupStats());
    setDataPolicies(getDataPolicies());
    setDataCatalog(getDataCatalog());
    setGovernanceStats(getGovernanceStats());
    setDataMetrics(getDataMetrics());
    setDataLineage(getDataLineage());
    refresh();
  }, [refresh]);

  /* ================================================================ */
  /*  DATABASE ACTIONS                                                 */
  /* ================================================================ */

  const updateProfile = useCallback((id: string, patch: Partial<DatabaseProfile>) => {
    const result = updateDatabaseProfile(id, patch);
    doRefresh();
    return result;
  }, [doRefresh]);

  /* ================================================================ */
  /*  MIGRATION ACTIONS                                                */
  /* ================================================================ */

  const runMig = useCallback((id: string) => {
    const result = runMigration(id);
    doRefresh();
    return result;
  }, [doRefresh]);

  const rollbackMig = useCallback((id: string) => {
    const result = rollbackMigration(id);
    doRefresh();
    return result;
  }, [doRefresh]);

  /* ================================================================ */
  /*  BACKUP ACTIONS                                                   */
  /* ================================================================ */

  const createBackup = useCallback((name: string, type: BackupType, database: string) => {
    const result = createBackupJob(name, type, database);
    doRefresh();
    return result;
  }, [doRefresh]);

  const verifyBackup = useCallback((id: string, verifier: string) => {
    const result = verifyBackupJob(id, verifier);
    doRefresh();
    return result;
  }, [doRefresh]);

  /* ================================================================ */
  /*  DATA QUALITY ACTIONS                                             */
  /* ================================================================ */

  const runQualityCheck = useCallback(() => {
    const result = runDataQualityCheck();
    setQualityReports(result);
    return result;
  }, []);

  /* ================================================================ */
  /*  CONTEXT VALUE                                                    */
  /* ================================================================ */

  const value = useMemo<DataContextValue>(() => ({
    databaseProfiles, connectionStats, updateProfile,
    schemaTables, schemaStats,
    migrations, migrationStats, runMig, rollbackMig,
    slowQueries, queryStats,
    storageVolumes, storageStats,
    backupJobs, backupPolicies, backupStats, createBackup, verifyBackup,
    dataPolicies, dataCatalog, governanceStats,
    qualityReports, runQualityCheck,
    dataMetrics, dataLineage,
    refresh: doRefresh,
  }), [
    databaseProfiles, connectionStats, updateProfile,
    schemaTables, schemaStats,
    migrations, migrationStats, runMig, rollbackMig,
    slowQueries, queryStats,
    storageVolumes, storageStats,
    backupJobs, backupPolicies, backupStats, createBackup, verifyBackup,
    dataPolicies, dataCatalog, governanceStats,
    qualityReports, runQualityCheck,
    dataMetrics, dataLineage,
    doRefresh,
  ]);

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}
