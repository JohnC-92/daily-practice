import { parseCsv } from "./csv";
import { mapLeetCodeRows, mapSystemDesignRows } from "./cards";
import { Card, DeckName } from "./types";
import { getLocalCache, getMemoryCache, setLocalCache, setMemoryCache } from "./cache";

const CACHE_PREFIX = "deck-cache:v2";

const deckUrlMap: Record<DeckName, string | undefined> = {
  leetcode: process.env.NEXT_PUBLIC_LC_CSV_URL,
  system_design: process.env.NEXT_PUBLIC_SD_CSV_URL,
};

const deckMapperMap = {
  leetcode: mapLeetCodeRows,
  system_design: mapSystemDesignRows,
} satisfies Record<DeckName, (rows: Record<string, string | undefined>[]) => Card[]>;

const getCacheKey = (deck: DeckName) => `${CACHE_PREFIX}:${deck}`;

async function fetchCsvText(url: string): Promise<string> {
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Failed to fetch CSV: ${response.status}`);
  }
  return response.text();
}

async function fetchCsvTextWithFallback(url: string): Promise<string> {
  try {
    return await fetchCsvText(url);
  } catch {
    const proxyUrl = `/api/csv-proxy?url=${encodeURIComponent(url)}`;
    return fetchCsvText(proxyUrl);
  }
}

export async function loadDeck(deck: DeckName): Promise<Card[]> {
  const memory = getMemoryCache<Card[]>(getCacheKey(deck));
  if (memory) {
    return memory;
  }

  const local = getLocalCache<Card[]>(getCacheKey(deck));
  if (local) {
    setMemoryCache(getCacheKey(deck), local);
    return local;
  }

  const url = deckUrlMap[deck];
  if (!url) {
    throw new Error("Missing CSV URL env var.");
  }

  const csvText = await fetchCsvTextWithFallback(url);
  const { rows } = parseCsv(csvText);
  const cards = deckMapperMap[deck](rows);

  setMemoryCache(getCacheKey(deck), cards);
  setLocalCache(getCacheKey(deck), cards);

  return cards;
}
