"use client";

import type { DispatchHistory, EmergencyRequest } from "../types";

const DB_NAME = "SwiftResponderDB";
const DB_VERSION = 1;

// Store names
const STORES = {
  DISPATCH_HISTORY: "dispatchHistory",
  EMERGENCY_REQUESTS: "emergencyRequests",
  USER_PREFERENCES: "userPreferences",
} as const;

/**
 * Initialize IndexedDB database
 */
function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Create dispatch history store
      if (!db.objectStoreNames.contains(STORES.DISPATCH_HISTORY)) {
        const historyStore = db.createObjectStore(STORES.DISPATCH_HISTORY, {
          keyPath: "id",
        });
        historyStore.createIndex("timestamp", "timestamp", { unique: false });
        historyStore.createIndex("outcome", "outcome", { unique: false });
      }

      // Create emergency requests store
      if (!db.objectStoreNames.contains(STORES.EMERGENCY_REQUESTS)) {
        const requestsStore = db.createObjectStore(STORES.EMERGENCY_REQUESTS, {
          keyPath: "id",
        });
        requestsStore.createIndex("timestamp", "timestamp", { unique: false });
        requestsStore.createIndex("status", "status", { unique: false });
      }

      // Create user preferences store
      if (!db.objectStoreNames.contains(STORES.USER_PREFERENCES)) {
        db.createObjectStore(STORES.USER_PREFERENCES, { keyPath: "key" });
      }
    };
  });
}

/**
 * Save dispatch history record
 */
export async function saveDispatchHistory(
  history: DispatchHistory
): Promise<void> {
  try {
    const db = await openDatabase();
    const transaction = db.transaction([STORES.DISPATCH_HISTORY], "readwrite");
    const store = transaction.objectStore(STORES.DISPATCH_HISTORY);

    await new Promise<void>((resolve, reject) => {
      const request = store.put(history);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });

    db.close();
  } catch (error) {
    console.error("Error saving dispatch history:", error);
    throw error;
  }
}

/**
 * Get all dispatch history records
 */
export async function getAllDispatchHistory(): Promise<DispatchHistory[]> {
  try {
    const db = await openDatabase();
    const transaction = db.transaction([STORES.DISPATCH_HISTORY], "readonly");
    const store = transaction.objectStore(STORES.DISPATCH_HISTORY);
    const index = store.index("timestamp");

    const histories = await new Promise<DispatchHistory[]>(
      (resolve, reject) => {
        const request = index.getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      }
    );

    db.close();

    // Sort by timestamp descending (most recent first)
    return histories.sort((a, b) => b.timestamp - a.timestamp);
  } catch (error) {
    console.error("Error getting dispatch history:", error);
    return [];
  }
}

/**
 * Get dispatch history for a specific time range
 */
export async function getDispatchHistoryByDateRange(
  startDate: number,
  endDate: number
): Promise<DispatchHistory[]> {
  try {
    const db = await openDatabase();
    const transaction = db.transaction([STORES.DISPATCH_HISTORY], "readonly");
    const store = transaction.objectStore(STORES.DISPATCH_HISTORY);
    const index = store.index("timestamp");

    const range = IDBKeyRange.bound(startDate, endDate);

    const histories = await new Promise<DispatchHistory[]>(
      (resolve, reject) => {
        const request = index.getAll(range);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      }
    );

    db.close();
    return histories.sort((a, b) => b.timestamp - a.timestamp);
  } catch (error) {
    console.error("Error getting dispatch history by date range:", error);
    return [];
  }
}

/**
 * Delete dispatch history record
 */
export async function deleteDispatchHistory(id: string): Promise<void> {
  try {
    const db = await openDatabase();
    const transaction = db.transaction([STORES.DISPATCH_HISTORY], "readwrite");
    const store = transaction.objectStore(STORES.DISPATCH_HISTORY);

    await new Promise<void>((resolve, reject) => {
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });

    db.close();
  } catch (error) {
    console.error("Error deleting dispatch history:", error);
    throw error;
  }
}

/**
 * Clear all dispatch history
 */
export async function clearAllDispatchHistory(): Promise<void> {
  try {
    const db = await openDatabase();
    const transaction = db.transaction([STORES.DISPATCH_HISTORY], "readwrite");
    const store = transaction.objectStore(STORES.DISPATCH_HISTORY);

    await new Promise<void>((resolve, reject) => {
      const request = store.clear();
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });

    db.close();
  } catch (error) {
    console.error("Error clearing dispatch history:", error);
    throw error;
  }
}

/**
 * Save emergency request
 */
export async function saveEmergencyRequest(
  request: EmergencyRequest
): Promise<void> {
  try {
    const db = await openDatabase();
    const transaction = db.transaction(
      [STORES.EMERGENCY_REQUESTS],
      "readwrite"
    );
    const store = transaction.objectStore(STORES.EMERGENCY_REQUESTS);

    await new Promise<void>((resolve, reject) => {
      const request_op = store.put(request);
      request_op.onsuccess = () => resolve();
      request_op.onerror = () => reject(request_op.error);
    });

    db.close();
  } catch (error) {
    console.error("Error saving emergency request:", error);
    throw error;
  }
}

/**
 * Get all emergency requests
 */
export async function getAllEmergencyRequests(): Promise<EmergencyRequest[]> {
  try {
    const db = await openDatabase();
    const transaction = db.transaction([STORES.EMERGENCY_REQUESTS], "readonly");
    const store = transaction.objectStore(STORES.EMERGENCY_REQUESTS);

    const requests = await new Promise<EmergencyRequest[]>(
      (resolve, reject) => {
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      }
    );

    db.close();
    return requests.sort((a, b) => b.timestamp - a.timestamp);
  } catch (error) {
    console.error("Error getting emergency requests:", error);
    return [];
  }
}

/**
 * Update emergency request status
 */
export async function updateEmergencyRequestStatus(
  id: string,
  status: EmergencyRequest["status"]
): Promise<void> {
  try {
    const db = await openDatabase();
    const transaction = db.transaction(
      [STORES.EMERGENCY_REQUESTS],
      "readwrite"
    );
    const store = transaction.objectStore(STORES.EMERGENCY_REQUESTS);

    // Get the request first
    const request = await new Promise<EmergencyRequest>((resolve, reject) => {
      const req = store.get(id);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });

    if (request) {
      request.status = status;
      await new Promise<void>((resolve, reject) => {
        const req = store.put(request);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    }

    db.close();
  } catch (error) {
    console.error("Error updating emergency request status:", error);
    throw error;
  }
}

/**
 * Save user preference
 */
export async function saveUserPreference(
  key: string,
  value: any
): Promise<void> {
  try {
    const db = await openDatabase();
    const transaction = db.transaction([STORES.USER_PREFERENCES], "readwrite");
    const store = transaction.objectStore(STORES.USER_PREFERENCES);

    await new Promise<void>((resolve, reject) => {
      const request = store.put({ key, value });
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });

    db.close();
  } catch (error) {
    console.error("Error saving user preference:", error);
    throw error;
  }
}

/**
 * Get user preference
 */
export async function getUserPreference<T>(key: string): Promise<T | null> {
  try {
    const db = await openDatabase();
    const transaction = db.transaction([STORES.USER_PREFERENCES], "readonly");
    const store = transaction.objectStore(STORES.USER_PREFERENCES);

    const result = await new Promise<{ key: string; value: T } | undefined>(
      (resolve, reject) => {
        const request = store.get(key);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      }
    );

    db.close();
    return result ? result.value : null;
  } catch (error) {
    console.error("Error getting user preference:", error);
    return null;
  }
}

/**
 * Get dispatch statistics
 */
export async function getDispatchStatistics(): Promise<{
  total: number;
  completed: number;
  cancelled: number;
  transferred: number;
  averageDuration: number;
  last30Days: number;
}> {
  try {
    const histories = await getAllDispatchHistory();
    const now = Date.now();
    const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;

    const completed = histories.filter((h) => h.outcome === "completed").length;
    const cancelled = histories.filter((h) => h.outcome === "cancelled").length;
    const transferred = histories.filter(
      (h) => h.outcome === "transferred"
    ).length;
    const last30Days = histories.filter(
      (h) => h.timestamp >= thirtyDaysAgo
    ).length;

    const totalDuration = histories
      .filter((h) => h.outcome === "completed")
      .reduce((sum, h) => sum + h.duration, 0);
    const averageDuration =
      completed > 0 ? Math.round(totalDuration / completed) : 0;

    return {
      total: histories.length,
      completed,
      cancelled,
      transferred,
      averageDuration,
      last30Days,
    };
  } catch (error) {
    console.error("Error getting dispatch statistics:", error);
    return {
      total: 0,
      completed: 0,
      cancelled: 0,
      transferred: 0,
      averageDuration: 0,
      last30Days: 0,
    };
  }
}
