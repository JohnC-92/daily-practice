"use client";

import { useEffect, useMemo, useState } from "react";
import { loadDeck } from "../lib/data";
import { filterCards, weightedRandomPick } from "../lib/random";
import { mapLeetCodeRows, mapSystemDesignRows } from "../lib/cards";
import { parseCsv } from "../lib/csv";
import { setLocalCache, setMemoryCache } from "../lib/cache";
import type { Card, DeckName, DeckWeights, Status, StatusFilter } from "../lib/types";

type DeckState = {
  selectedCard: Card | null;
  revealed: boolean;
  weights: DeckWeights;
  filters: {
    status: StatusFilter;
    excludeGreen: boolean;
  };
};

const defaultWeights: Record<DeckName, DeckWeights> = {
  leetcode: { red: 0.6, yellow: 0.3, green: 0.1 },
  system_design: { red: 0.5, yellow: 0.35, green: 0.15 },
};

const statusStyles: Record<Status, string> = {
  red: "bg-red-100 text-red-700 ring-red-200",
  yellow: "bg-amber-100 text-amber-700 ring-amber-200",
  green: "bg-emerald-100 text-emerald-700 ring-emerald-200",
};

const statusLabel: Record<Status, string> = {
  red: "Red",
  yellow: "Yellow",
  green: "Green",
};

const deckLabel: Record<DeckName, string> = {
  leetcode: "LeetCode",
  system_design: "System Design",
};

const statusOptions: Array<StatusFilter> = ["all", "red", "yellow", "green"];

const buildInitialState = (deck: DeckName): DeckState => ({
  selectedCard: null,
  revealed: false,
  weights: { ...defaultWeights[deck] },
  filters: {
    status: "all",
    excludeGreen: false,
  },
});

const deckMappers = {
  leetcode: mapLeetCodeRows,
  system_design: mapSystemDesignRows,
} satisfies Record<DeckName, (rows: Record<string, string | undefined>[]) => Card[]>;

const cacheKeyForDeck = (deck: DeckName) => `deck-cache:v2:${deck}`;

export default function Home() {
  const [activeDeck, setActiveDeck] = useState<DeckName>("leetcode");
  const [deckStates, setDeckStates] = useState<Record<DeckName, DeckState>>({
    leetcode: buildInitialState("leetcode"),
    system_design: buildInitialState("system_design"),
  });
  const [deckCards, setDeckCards] = useState<Record<DeckName, Card[]>>({
    leetcode: [],
    system_design: [],
  });
  const [deckLoading, setDeckLoading] = useState<Record<DeckName, boolean>>({
    leetcode: true,
    system_design: true,
  });
  const [deckErrors, setDeckErrors] = useState<Record<DeckName, string | null>>({
    leetcode: null,
    system_design: null,
  });

  useEffect(() => {
    (["leetcode", "system_design"] as DeckName[]).forEach(async (deck) => {
      try {
        const cards = await loadDeck(deck);
        setDeckCards((prev) => ({ ...prev, [deck]: cards }));
        setDeckErrors((prev) => ({ ...prev, [deck]: null }));
      } catch (error) {
        setDeckErrors((prev) => ({
          ...prev,
          [deck]: error instanceof Error ? error.message : "Failed to load data.",
        }));
      } finally {
        setDeckLoading((prev) => ({ ...prev, [deck]: false }));
      }
    });
  }, []);

  const activeState = deckStates[activeDeck];
  const activeCards = deckCards[activeDeck];

  const filteredCards = useMemo(
    () => filterCards(activeCards, activeState.filters),
    [activeCards, activeState.filters]
  );

  const updateDeckState = (deck: DeckName, updater: (state: DeckState) => DeckState) => {
    setDeckStates((prev) => ({ ...prev, [deck]: updater(prev[deck]) }));
  };

  const handleRandomNext = () => {
    const selected = weightedRandomPick(filteredCards, activeState.weights);
    updateDeckState(activeDeck, (state) => ({
      ...state,
      selectedCard: selected,
      revealed: false,
    }));
  };

  const handleReveal = () => {
    updateDeckState(activeDeck, (state) => ({
      ...state,
      revealed: !state.revealed,
    }));
  };

  const handleWeightChange = (status: Status, value: string) => {
    const numberValue = Number(value);
    if (Number.isNaN(numberValue)) {
      return;
    }
    updateDeckState(activeDeck, (state) => ({
      ...state,
      weights: {
        ...state.weights,
        [status]: Math.max(0, numberValue),
      },
    }));
  };

  const handleFilterChange = (status: StatusFilter) => {
    updateDeckState(activeDeck, (state) => ({
      ...state,
      filters: {
        ...state.filters,
        status,
      },
    }));
  };

  const toggleExcludeGreen = () => {
    updateDeckState(activeDeck, (state) => ({
      ...state,
      filters: {
        ...state.filters,
        excludeGreen: !state.filters.excludeGreen,
      },
    }));
  };

  const handleFileUpload = async (deck: DeckName, file: File | null) => {
    if (!file) {
      return;
    }
    try {
      const csvText = await file.text();
      const { rows, errors } = parseCsv(csvText);
      if (errors.length) {
        throw new Error(errors[0]);
      }
      const cards = deckMappers[deck](rows);
      setDeckCards((prev) => ({ ...prev, [deck]: cards }));
      setDeckErrors((prev) => ({ ...prev, [deck]: null }));
      setDeckLoading((prev) => ({ ...prev, [deck]: false }));
      setMemoryCache(cacheKeyForDeck(deck), cards);
      setLocalCache(cacheKeyForDeck(deck), cards);
    } catch (error) {
      setDeckErrors((prev) => ({
        ...prev,
        [deck]: error instanceof Error ? error.message : "Failed to parse CSV.",
      }));
    }
  };

  const selectedCard = activeState.selectedCard;
  const isLoading = deckLoading[activeDeck];
  const error = deckErrors[activeDeck];

  return (
    <div className="min-h-screen px-6 py-10 text-[15px]">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <header className="flex flex-col gap-6 rounded-3xl border border-[var(--panel-border)] bg-[var(--panel)] px-8 py-6 shadow-[var(--shadow)]">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-[var(--muted)]">
                Interview Prep
              </p>
              <h1 className="text-3xl font-semibold tracking-tight">
                Focused practice, one card at a time.
              </h1>
            </div>
            <div className="flex flex-wrap gap-3">
              {(Object.keys(deckLabel) as DeckName[]).map((deck) => (
                <button
                  key={deck}
                  onClick={() => setActiveDeck(deck)}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                    activeDeck === deck
                      ? "bg-[var(--foreground)] text-white"
                      : "border border-[var(--panel-border)] text-[var(--muted)] hover:border-[var(--foreground)] hover:text-[var(--foreground)]"
                  }`}
                >
                  {deckLabel[deck]}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div className="flex flex-wrap gap-3">
              {statusOptions.map((status) => (
                <button
                  key={status}
                  onClick={() => handleFilterChange(status)}
                  className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${
                    activeState.filters.status === status
                      ? "bg-[var(--accent)] text-white"
                      : "border border-[var(--panel-border)] text-[var(--muted)] hover:border-[var(--accent)]"
                  }`}
                >
                  {status === "all" ? "All" : statusLabel[status]}
                </button>
              ))}
              <label className="flex items-center gap-2 rounded-full border border-[var(--panel-border)] px-3 py-1 text-xs uppercase tracking-wide text-[var(--muted)]">
                <input
                  type="checkbox"
                  checked={activeState.filters.excludeGreen}
                  onChange={toggleExcludeGreen}
                  className="h-3 w-3 accent-[var(--accent)]"
                />
                Exclude Green
              </label>
            </div>

            <div className="flex flex-wrap gap-4 rounded-2xl border border-[var(--panel-border)] bg-[#fdf9f4] px-4 py-3">
              {(Object.keys(statusLabel) as Status[]).map((status) => (
                <label key={status} className="flex items-center gap-2 text-xs">
                  <span className="font-mono uppercase text-[var(--muted)]">
                    {statusLabel[status]}
                  </span>
                  <input
                    type="number"
                    step="0.05"
                    min="0"
                    value={activeState.weights[status]}
                    onChange={(event) => handleWeightChange(status, event.target.value)}
                    className="w-20 rounded-lg border border-[var(--panel-border)] bg-white px-2 py-1 text-sm"
                  />
                </label>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleRandomNext}
              className="rounded-full bg-[var(--accent)] px-5 py-2 text-sm font-semibold text-white transition hover:bg-[var(--accent-strong)] disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isLoading || filteredCards.length === 0}
            >
              Random Next
            </button>
            <button
              onClick={handleReveal}
              className="rounded-full border border-[var(--panel-border)] px-5 py-2 text-sm font-semibold text-[var(--foreground)] transition hover:border-[var(--foreground)] disabled:cursor-not-allowed disabled:opacity-60"
              disabled={!selectedCard}
            >
              {activeState.revealed ? "Hide Notes" : "Reveal Notes"}
            </button>
            <label className="cursor-pointer rounded-full border border-[var(--panel-border)] px-5 py-2 text-sm font-semibold text-[var(--foreground)] transition hover:border-[var(--foreground)]">
              Load CSV from file
              <input
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                onChange={(event) => {
                  const file = event.currentTarget.files?.[0] ?? null;
                  handleFileUpload(activeDeck, file);
                  event.currentTarget.value = "";
                }}
              />
            </label>
            <div className="text-xs text-[var(--muted)]">
              {isLoading && "Loading cards..."}
              {!isLoading &&
                !error &&
                `${filteredCards.length} cards ready`}
              {error && `Error: ${error}`}
            </div>
          </div>
        </header>

        <section className="grid gap-6 lg:grid-cols-2">
          <div className="flex min-h-[360px] flex-col gap-6 rounded-3xl border border-[var(--panel-border)] bg-[var(--panel)] px-8 py-6 shadow-[var(--shadow)]">
            <div className="flex flex-wrap items-center gap-3">
              {selectedCard ? (
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ring-1 ${statusStyles[selectedCard.status]}`}
                >
                  {statusLabel[selectedCard.status]}
                </span>
              ) : (
                <span className="rounded-full border border-dashed border-[var(--panel-border)] px-3 py-1 text-xs uppercase tracking-wide text-[var(--muted)]">
                  No card yet
                </span>
              )}
              {selectedCard?.deck === "leetcode" && selectedCard?.meta?.["Times Submitted"] ? (
                <span className="text-xs text-[var(--muted)]">
                  Times submitted: {selectedCard.meta["Times Submitted"]}
                </span>
              ) : null}
            </div>

            <div className="flex flex-1 flex-col justify-between gap-6">
              <div>
                <h2 className="text-2xl font-semibold leading-tight">
                  {selectedCard ? selectedCard.title : "Pick a card to begin."}
                </h2>
                {selectedCard?.description ? (
                  <p className="mt-3 text-sm text-[var(--muted)]">
                    {selectedCard.description}
                  </p>
                ) : null}
                {selectedCard?.link ? (
                  <a
                    href={selectedCard.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 inline-flex items-center gap-2 rounded-full border border-[var(--panel-border)] px-4 py-2 text-sm font-semibold text-[var(--foreground)] hover:border-[var(--accent)]"
                  >
                    Open on LeetCode
                  </a>
                ) : null}
              </div>

              <div className="rounded-2xl border border-[var(--panel-border)] bg-[#fdf9f4] px-4 py-3 text-xs text-[var(--muted)]">
                {selectedCard
                  ? "Focus on explaining the core idea aloud. Keep it crisp."
                  : "Load your decks and hit Random Next to start."}
              </div>
            </div>
          </div>

          <div className="flex min-h-[360px] flex-col gap-4 rounded-3xl border border-[var(--panel-border)] bg-[var(--panel)] px-8 py-6 shadow-[var(--shadow)]">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Notes</h3>
              <span className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                {activeState.revealed ? "Visible" : "Hidden"}
              </span>
            </div>

            {!selectedCard && (
              <p className="text-sm text-[var(--muted)]">
                Reveal notes once you have a prompt in front of you.
              </p>
            )}

            {selectedCard && !activeState.revealed && (
              <div className="flex flex-1 items-center justify-center rounded-2xl border border-dashed border-[var(--panel-border)] text-sm text-[var(--muted)]">
                Notes are hidden. Click “Reveal Notes” when you are ready.
              </div>
            )}

            {selectedCard && activeState.revealed && (
              <div
                className={`grid gap-4 ${
                  activeDeck === "system_design" ? "md:grid-cols-2" : "grid-cols-1"
                }`}
              >
                {selectedCard.notes.sections.length === 0 && (
                  <p className="text-sm text-[var(--muted)]">
                    No notes yet. Add some in your sheet.
                  </p>
                )}
                {selectedCard.notes.sections.map((section) => (
                  <div key={section.label} className="rounded-2xl border border-[var(--panel-border)] px-4 py-3">
                    <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                      {section.label}
                    </p>
                    <p className="mt-2 whitespace-pre-line text-sm">
                      {section.value}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
