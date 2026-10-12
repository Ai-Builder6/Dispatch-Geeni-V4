import fs from "fs";
import path from "path";

const IS_SERVERLESS = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
const BUNDLED_STORE_FILE = path.join(process.cwd(), "data", "dispatch_store.json");
const DATA_DIR = IS_SERVERLESS ? "/tmp" : path.join(process.cwd(), "data");
const STORE_FILE = path.join(DATA_DIR, "dispatch_store.json");

export interface AppPersistentStore {
  version: number;
  lastSavedAt: string;
  tickets: any[];
  cleanerOverrides: Record<string, any>;
  scheduledVisits: any[];
  unscheduledJobs?: any[];
  staffRoster?: any[];
  clients?: any[];
  quotes: any[];
  invoices: any[];
  quoCallLogs?: any[];
  chatMessages?: any[];
  jobberConfig?: {
    isConnected: boolean;
    accountName: string;
    clientId: string;
    clientSecret: string;
    accessToken: string;
    refreshToken: string;
    lastSyncedAt: string;
  };
  quoConfig?: {
    isConnected: boolean;
    apiKey: string;
    phoneNumbers: any[];
  };
  apiKeys?: {
    mapsApiKey?: string;
    geminiApiKey?: string;
  };
}

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  } catch (err) {
    console.error("Failed to create data directory:", err);
  }
}

/**
 * Loads stored data from disk
 */
export function loadStore(): AppPersistentStore | null {
  try {
    if (fs.existsSync(STORE_FILE)) {
      const raw = fs.readFileSync(STORE_FILE, "utf-8");
      return JSON.parse(raw);
    }
    if (IS_SERVERLESS && fs.existsSync(BUNDLED_STORE_FILE)) {
      const raw = fs.readFileSync(BUNDLED_STORE_FILE, "utf-8");
      return JSON.parse(raw);
    }
  } catch (err) {
    console.warn("Could not read dispatch_store.json, creating initial store:", err);
  }
  return null;
}

/**
 * Atomically writes data to disk
 */
export function saveStore(store: AppPersistentStore): boolean {
  try {
    let existing: Partial<AppPersistentStore> = {};
    if (fs.existsSync(STORE_FILE)) {
      try {
        existing = JSON.parse(fs.readFileSync(STORE_FILE, "utf-8")) || {};
      } catch {
        // use empty if corrupt
      }
    }

    const merged: AppPersistentStore = {
      ...existing,
      ...store,
      // Ensure nested API configurations are never erased if not explicitly provided
      jobberConfig: store.jobberConfig || existing.jobberConfig,
      quoConfig: store.quoConfig || existing.quoConfig,
      apiKeys: store.apiKeys || existing.apiKeys,
      lastSavedAt: new Date().toISOString(),
    };

    const json = JSON.stringify(merged, null, 2);
    fs.writeFileSync(STORE_FILE, json, "utf-8");
    return true;
  } catch (err) {
    console.error("Failed to write dispatch_store.json:", err);
    return false;
  }
}
