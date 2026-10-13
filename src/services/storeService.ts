import fs from "fs";
import path from "path";

const IS_SERVERLESS = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
const BUNDLED_DATA_DIR = path.join(process.cwd(), "data");
const DATA_DIR = IS_SERVERLESS ? "/tmp" : path.join(process.cwd(), "data");

export type SupportedProjectId = "dispatchgeeni" | "tidyups" | "easycleans";

const ALL_STORE_FILENAMES = [
  "dispatch_geeni_store.json",
  "tidyups_cleaning_store.json",
  "easy_cleans_store.json",
  "dispatch_store.json",
];

export function resolveStoreFilePath(projectId?: string): string {
  const norm = (projectId || "").toLowerCase();
  if (norm.includes("tidyup")) {
    return path.join(DATA_DIR, "tidyups_cleaning_store.json");
  }
  if (norm.includes("easyclean") || norm.includes("easy-clean") || norm.includes("easy_clean")) {
    return path.join(DATA_DIR, "easy_cleans_store.json");
  }
  if (norm.includes("dispatch")) {
    return path.join(DATA_DIR, "dispatch_geeni_store.json");
  }
  const defaultFile = path.join(DATA_DIR, "dispatch_geeni_store.json");
  if (fs.existsSync(defaultFile)) {
    return defaultFile;
  }
  return path.join(DATA_DIR, "dispatch_store.json");
}

export function resolveBundledStoreFilePath(projectId?: string): string {
  const norm = (projectId || "").toLowerCase();
  if (norm.includes("tidyup")) {
    return path.join(BUNDLED_DATA_DIR, "tidyups_cleaning_store.json");
  }
  if (norm.includes("easyclean") || norm.includes("easy-clean") || norm.includes("easy_clean")) {
    return path.join(BUNDLED_DATA_DIR, "easy_cleans_store.json");
  }
  if (norm.includes("dispatch")) {
    return path.join(BUNDLED_DATA_DIR, "dispatch_geeni_store.json");
  }
  const defaultFile = path.join(BUNDLED_DATA_DIR, "dispatch_geeni_store.json");
  if (fs.existsSync(defaultFile)) {
    return defaultFile;
  }
  return path.join(BUNDLED_DATA_DIR, "dispatch_store.json");
}

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
  adLeads?: any[];
  chatMessages?: any[];
  spamShieldConfig?: {
    enabled: boolean;
    blockAllNonNorthAmerica: boolean;
    blockedCountryCodes: string[];
    blockedPrefixes: string[];
    blockedNumbers: string[];
    blockRobocallFloods: boolean;
    rejectionAction: 'busy' | 'reject';
    forwardDestinationNumber?: string;
    callerIdMode?: 'caller' | 'line';
    lineMappings?: Record<string, string>;
  };
  blockedCallsHistory?: any[];
  recentInboundCalls?: any[];
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
 * Loads stored data from disk — unified across all 3 mirrored sites (dispatchgeeni, tidyups, easycleans)
 */
export function loadStore(projectId?: string): AppPersistentStore | null {
  const targetFile = resolveStoreFilePath(projectId);
  const bundledFile = resolveBundledStoreFilePath(projectId);

  try {
    // Check all candidate store files and return the one with the latest saved state (or targetFile)
    const candidateFiles = [
      targetFile,
      ...ALL_STORE_FILENAMES.map((f) => path.join(DATA_DIR, f)),
      bundledFile,
    ];

    let newestStore: AppPersistentStore | null = null;
    let newestTime = 0;

    for (const file of candidateFiles) {
      if (fs.existsSync(file)) {
        try {
          const parsed = JSON.parse(fs.readFileSync(file, "utf-8")) as AppPersistentStore;
          const ts = parsed?.lastSavedAt ? new Date(parsed.lastSavedAt).getTime() : 1;
          if (!newestStore || ts > newestTime) {
            newestStore = parsed;
            newestTime = ts;
          }
        } catch {
          // skip unreadable candidate
        }
      }
    }

    if (newestStore) {
      return newestStore;
    }
  } catch (err) {
    console.warn(`Could not read store file (${targetFile}), creating initial store:`, err);
  }
  return null;
}

/**
 * Atomically writes and mirrors data across ALL 3 site copies (dispatchgeeni, tidyups, easycleans)
 * so all 3 sites stay 100% synchronized at all times.
 */
export function saveStore(store: AppPersistentStore, projectId?: string): boolean {
  const targetFile = resolveStoreFilePath(projectId);

  try {
    const existing = loadStore(projectId) || ({} as Partial<AppPersistentStore>);

    const merged: AppPersistentStore = {
      ...existing,
      ...store,
      // Ensure nested API and phone configurations are never erased if not explicitly provided
      spamShieldConfig: store.spamShieldConfig || existing.spamShieldConfig,
      jobberConfig: store.jobberConfig || existing.jobberConfig,
      quoConfig: store.quoConfig || existing.quoConfig,
      apiKeys: store.apiKeys || existing.apiKeys,
      lastSavedAt: new Date().toISOString(),
    };

    const json = JSON.stringify(merged, null, 2);

    // Write to all 3 site store files in DATA_DIR so all 3 copies stay 100% synced
    for (const filename of ALL_STORE_FILENAMES) {
      try {
        fs.writeFileSync(path.join(DATA_DIR, filename), json, "utf-8");
      } catch {
        // ignore individual mirror error
      }
    }

    // Also mirror to standalone sub-project folders if present
    const subProjectStores = [
      path.join(process.cwd(), "projects", "tidyupscleaning", "data", "tidyups_cleaning_store.json"),
      path.join(process.cwd(), "projects", "dispatchgeeni", "data", "dispatch_geeni_store.json"),
    ];
    for (const subFile of subProjectStores) {
      if (fs.existsSync(path.dirname(subFile))) {
        try {
          fs.writeFileSync(subFile, json, "utf-8");
        } catch {
          // ignore
        }
      }
    }

    return true;
  } catch (err) {
    console.error(`Failed to write store (${targetFile}):`, err);
    return false;
  }
}
