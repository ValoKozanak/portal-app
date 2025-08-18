import { useState, useEffect, useCallback, useRef } from 'react';

interface ApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class ApiCache {
  private cache = new Map<string, CacheEntry<any>>();
  private defaultTTL = 5 * 60 * 1000; // 5 minút

  set<T>(key: string, data: T, ttl: number = this.defaultTTL): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  clear(): void {
    this.cache.clear();
  }

  delete(key: string): void {
    this.cache.delete(key);
  }
}

const apiCache = new ApiCache();

export function useApi<T>(
  apiCall: () => Promise<T>,
  dependencies: any[] = [],
  cacheKey?: string,
  cacheTTL?: number
): ApiState<T> & { refetch: () => void } {
  const [state, setState] = useState<ApiState<T>>({
    data: null,
    loading: true,
    error: null
  });

  const abortControllerRef = useRef<AbortController | null>(null);

  const executeApiCall = useCallback(async () => {
    // Zruš predchádzajúce volanie ak existuje
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();

    // Skontroluj cache
    if (cacheKey) {
      const cachedData = apiCache.get<T>(cacheKey);
      if (cachedData) {
        setState({
          data: cachedData,
          loading: false,
          error: null
        });
        return;
      }
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const data = await apiCall();
      
      // Ulož do cache
      if (cacheKey) {
        apiCache.set(cacheKey, data, cacheTTL);
      }

      setState({
        data,
        loading: false,
        error: null
      });
    } catch (error: any) {
      if (error.name === 'AbortError') return;

      setState({
        data: null,
        loading: false,
        error: error.message || 'Nastala chyba'
      });
    }
  }, [apiCall, cacheKey, cacheTTL]);

  const refetch = useCallback(() => {
    if (cacheKey) {
      apiCache.delete(cacheKey);
    }
    executeApiCall();
  }, [executeApiCall, cacheKey]);

  useEffect(() => {
    executeApiCall();

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [executeApiCall, dependencies]);

  return { ...state, refetch };
}

export { apiCache };
