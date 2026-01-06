const DEFAULT_TTL_MS = 6 * 60 * 60 * 1000;

type CacheEntry<T> = {
  timestamp: number;
  value: T;
};

const memoryCache = new Map<string, CacheEntry<unknown>>();

export function getMemoryCache<T>(key: string): T | null {
  const entry = memoryCache.get(key) as CacheEntry<T> | undefined;
  if (!entry) {
    return null;
  }
  return entry.value;
}

export function setMemoryCache<T>(key: string, value: T) {
  memoryCache.set(key, { timestamp: Date.now(), value });
}

export function getLocalCache<T>(key: string, ttlMs = DEFAULT_TTL_MS): T | null {
  if (typeof window === "undefined") {
    return null;
  }
  const raw = window.localStorage.getItem(key);
  if (!raw) {
    return null;
  }
  try {
    const entry = JSON.parse(raw) as CacheEntry<T>;
    if (Date.now() - entry.timestamp > ttlMs) {
      window.localStorage.removeItem(key);
      return null;
    }
    return entry.value;
  } catch {
    window.localStorage.removeItem(key);
    return null;
  }
}

export function setLocalCache<T>(key: string, value: T) {
  if (typeof window === "undefined") {
    return;
  }
  const entry: CacheEntry<T> = { timestamp: Date.now(), value };
  window.localStorage.setItem(key, JSON.stringify(entry));
}
