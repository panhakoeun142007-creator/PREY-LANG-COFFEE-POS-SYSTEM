import { useCallback, useEffect, useRef, useState } from 'react';
import type { Notification } from "../services/api";

// Re-export all hooks
export { useLiveOrders, useOrderHistory, useCreateOrder } from './useOrders';
export { useProducts } from './useProducts';

/**
 * Generic debounce hook for performance optimization.
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Hook for local storage persistence.
 */
export function useLocalStorage<T>(key: string, initialValue: T): [T, (_value: T) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch {
      return initialValue;
    }
  });

  const setValue = (value: T) => {
    try {
      setStoredValue(value);
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  };

  return [storedValue, setValue];
}

/**
 * Hook for polling data at regular intervals.
 */
export function usePolling<T>(fetchFn: () => Promise<T>, intervalMs: number, enabled = true) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setError(null);
      const result = await fetchFn();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setLoading(false);
    }
  }, [fetchFn]);

  useEffect(() => {
    if (!enabled) return;

    fetchData();
    const interval = setInterval(fetchData, intervalMs);

    return () => clearInterval(interval);
  }, [fetchData, intervalMs, enabled]);

  return { data, loading, error, refresh: fetchData };
}

type AutoRefreshOptions = {
  enabled?: boolean;
  intervalMs?: number;
  immediate?: boolean;
  refreshOnFocus?: boolean;
  refreshOnVisible?: boolean;
};

/**
 * Hook for keeping page data fresh without a manual browser refresh.
 */
export function useAutoRefresh(
  refreshFn: () => Promise<unknown> | void,
  {
    enabled = true,
    intervalMs = 10000,
    immediate = true,
    refreshOnFocus = true,
    refreshOnVisible = true,
  }: AutoRefreshOptions = {},
) {
  const refreshRef = useRef(refreshFn);

  useEffect(() => {
    refreshRef.current = refreshFn;
  }, [refreshFn]);

  const runRefresh = useCallback(() => {
    return refreshRef.current();
  }, []);

  useEffect(() => {
    if (!enabled) return;

    if (immediate) {
      void runRefresh();
    }

    const interval = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        void runRefresh();
      }
    }, intervalMs);

    return () => {
      window.clearInterval(interval);
    };
  }, [enabled, immediate, intervalMs, runRefresh]);

  useEffect(() => {
    if (!enabled || !refreshOnFocus) return;

    const handleFocus = () => {
      void runRefresh();
    };

    window.addEventListener("focus", handleFocus);
    return () => {
      window.removeEventListener("focus", handleFocus);
    };
  }, [enabled, refreshOnFocus, runRefresh]);

  useEffect(() => {
    if (!enabled || !refreshOnVisible) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void runRefresh();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [enabled, refreshOnVisible, runRefresh]);
}

const ORDER_SOUND_ENABLED_KEY = "prey-lang-pos:sound:new-order:enabled:v1";

let sharedAudioContext: AudioContext | null = null;
let sharedAudioOutput: { ctx: AudioContext; input: GainNode } | null = null;

function getSharedAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const webkitAudioContext = (window as Window & { webkitAudioContext?: typeof AudioContext })
    .webkitAudioContext;
  const Ctx = window.AudioContext || webkitAudioContext;
  if (!Ctx) return null;
  if (!sharedAudioContext) {
    sharedAudioContext = new Ctx();
  }
  return sharedAudioContext;
}

function getSharedAudioOutput(ctx: AudioContext): GainNode {
  if (sharedAudioOutput && sharedAudioOutput.ctx === ctx) {
    return sharedAudioOutput.input;
  }

  // Master chain: input -> masterGain -> compressor -> destination
  const masterGain = ctx.createGain();
  masterGain.gain.setValueAtTime(1.0, ctx.currentTime);

  const compressor = ctx.createDynamicsCompressor();
  compressor.threshold.setValueAtTime(-26, ctx.currentTime);
  compressor.knee.setValueAtTime(30, ctx.currentTime);
  compressor.ratio.setValueAtTime(12, ctx.currentTime);
  compressor.attack.setValueAtTime(0.003, ctx.currentTime);
  compressor.release.setValueAtTime(0.25, ctx.currentTime);

  masterGain.connect(compressor);
  compressor.connect(ctx.destination);

  sharedAudioOutput = { ctx, input: masterGain };
  return masterGain;
}

async function unlockAudioContext(): Promise<boolean> {
  const ctx = getSharedAudioContext();
  if (!ctx) return false;
  try {
    if (ctx.state === "suspended") {
      await ctx.resume();
    }
    return ctx.state === "running";
  } catch {
    return false;
  }
}

async function playNewOrderBeep(): Promise<void> {
  const ctx = getSharedAudioContext();
  if (!ctx) return;

  try {
    if (ctx.state === "suspended") {
      await ctx.resume();
    }
  } catch {
    // Ignore resume errors; the beep will no-op in locked environments.
  }

  if (ctx.state !== "running") return;

  const now = ctx.currentTime;
  const output = getSharedAudioOutput(ctx);
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.0001, now);
  gain.connect(output);

  const playTone = (start: number, frequency: number, duration: number) => {
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(frequency, start);

    // Envelope per tone (avoid clicks).
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(0.35, start + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);

    osc.connect(gain);
    osc.start(start);
    osc.stop(start + duration + 0.02);
  };

  // Two quick beeps (louder + slightly longer) to be easily heard in a busy shop.
  playTone(now, 880, 0.18);
  playTone(now + 0.26, 660, 0.20);
}

function isNewOrderNotification(notification: Notification): boolean {
  const type = String(notification.type ?? "").toLowerCase().trim();
  // Explicit positives.
  if (type === "order" || type === "new_order" || type === "customer_order") return true;
  // Explicit negatives.
  if (type === "ready" || type === "stock" || type === "near_stock") return false;

  const content = `${notification.title ?? ""} ${notification.message ?? ""}`
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();

  // Common English patterns.
  if (content.includes("new order")) return true;
  if (content.includes("order placed") || content.includes("placed an order")) return true;

  // Generic fallback: sometimes "new order" is sent as an "alert" notification.
  // Keep this conservative so we don't beep on stock alerts.
  const looksLikeOrderId = /(#ord-?\d+|order\s*#\s*\d+)/i.test(content);
  const looksLikeIncoming = content.includes("new") || content.includes("placed") || content.includes("pending");
  if (content.includes("order") && looksLikeOrderId) return true;
  if (type === "alert" && content.includes("order") && (looksLikeOrderId || looksLikeIncoming)) return true;

  return false;
}

export function useUnlockAudioOnFirstInteraction(enabled = true) {
  const enabledRef = useRef(enabled);

  useEffect(() => {
    enabledRef.current = enabled;
  }, [enabled]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!enabled) return;

    let cleanedUp = false;

    const handler = async () => {
      if (cleanedUp) return;
      if (!enabledRef.current) return;
      const ok = await unlockAudioContext();
      if (ok) cleanup();
    };

    const cleanup = () => {
      cleanedUp = true;
      window.removeEventListener("pointerdown", handler, true);
      window.removeEventListener("keydown", handler, true);
      window.removeEventListener("touchstart", handler, true);
    };

    window.addEventListener("pointerdown", handler, true);
    window.addEventListener("keydown", handler, true);
    window.addEventListener("touchstart", handler, true);

    return cleanup;
  }, [enabled]);
}

export function useNewOrderSoundNotifications(notifications: Notification[]) {
  const [enabled, setEnabled] = useLocalStorage<boolean>(ORDER_SOUND_ENABLED_KEY, true);
  const initializedRef = useRef(false);
  const previousIdsRef = useRef<Set<string>>(new Set());

  // Ensure the audio context gets unlocked as early as possible (browser autoplay policies).
  useUnlockAudioOnFirstInteraction(enabled);

  useEffect(() => {
    const currentIds = new Set(notifications.map((n) => String(n.id ?? "")));

    if (!initializedRef.current) {
      initializedRef.current = true;
      previousIdsRef.current = currentIds;
      return;
    }

    const previous = previousIdsRef.current;
    previousIdsRef.current = currentIds;

    if (!enabled) return;

    const hasNewOrder = notifications.some((n) => {
      const id = String(n.id ?? "");
      if (!id || previous.has(id)) return false;
      return isNewOrderNotification(n);
    });

    if (hasNewOrder) {
      void playNewOrderBeep();
    }
  }, [enabled, notifications]);

  const testSound = useCallback(async () => {
    if (!enabled) return;
    const unlocked = await unlockAudioContext();
    if (!unlocked) return;
    await playNewOrderBeep();
  }, [enabled]);

  return { enabled, setEnabled, testSound };
}
