import { useState, useEffect } from "react";
import { quotesService, pickHourlyQuote, SEED_QUOTES } from "@/services/quotes.service.js";

/**
 * Returns the current hourly motivational quote.
 * Falls back to SEED_QUOTES if Firestore has no quotes yet.
 * Re-picks on the hour automatically.
 */
export function useMotivationalQuote() {
  const [quote, setQuote] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const quotes = await quotesService.getActive();
        if (cancelled) return;
        const pool = quotes.length ? quotes : SEED_QUOTES;
        setQuote(pickHourlyQuote(pool));
      } catch {
        // Network error — fall back to seeds
        if (!cancelled) setQuote(pickHourlyQuote(SEED_QUOTES));
      }
    }

    load();

    // Re-pick at the top of each hour
    const now = Date.now();
    const msToNextHour = 3600000 - (now % 3600000);
    const timer = setTimeout(() => load(), msToNextHour);

    return () => { cancelled = true; clearTimeout(timer); };
  }, []);

  return quote;
}

/**
 * Full quotes list — used in admin panel.
 */
export function useAllQuotes() {
  const [quotes,  setQuotes]  = useState([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try { setQuotes(await quotesService.getAll()); }
    catch { setQuotes([]); }
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  return { quotes, loading, refresh: load };
}
