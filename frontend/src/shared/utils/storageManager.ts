// Session-scoped storage (tab session), not localStorage.

interface StorageData<T> {
  version: number;
  data: T;
  timestamp: number;
}

class StorageManager {
  private static readonly CURRENT_VERSION = 1;
  private static fallbackStorage = new Map<string, string>();

  private static getStore(): Storage | null {
    if (typeof window === "undefined") return null;
    try {
      const test = "__session_storage_test__";
      sessionStorage.setItem(test, test);
      sessionStorage.removeItem(test);
      return sessionStorage;
    } catch {
      return null;
    }
  }

  static isAvailable(): boolean {
    return this.getStore() !== null;
  }

  static setItem(key: string, value: string): void {
    try {
      const store = this.getStore();
      if (store) {
        store.setItem(key, value);
      } else {
        this.fallbackStorage.set(key, value);
      }
    } catch {
      this.fallbackStorage.set(key, value);
    }
  }

  static getItem(key: string): string | null {
    try {
      const store = this.getStore();
      if (store) {
        return store.getItem(key);
      }
      return this.fallbackStorage.get(key) || null;
    } catch {
      return this.fallbackStorage.get(key) || null;
    }
  }

  static removeItem(key: string): void {
    try {
      const store = this.getStore();
      if (store) {
        store.removeItem(key);
      } else {
        this.fallbackStorage.delete(key);
      }
    } catch {
      this.fallbackStorage.delete(key);
    }
  }

  static setVersionedItem<T>(key: string, data: T): void {
    const versionedData: StorageData<T> = {
      version: this.CURRENT_VERSION,
      data,
      timestamp: Date.now(),
    };
    this.setItem(key, JSON.stringify(versionedData));
  }

  static getVersionedItem<T>(key: string): T | null {
    try {
      const item = this.getItem(key);
      if (!item) return null;

      const versionedData: StorageData<T> = JSON.parse(item);
      if (versionedData.version !== this.CURRENT_VERSION) {
        const migratedData = versionedData.data as T;
        this.setVersionedItem(key, migratedData);
        return migratedData;
      }
      return versionedData.data;
    } catch {
      return null;
    }
  }
}

export default StorageManager;
