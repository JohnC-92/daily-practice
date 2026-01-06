import { Card, DeckWeights, Status, StatusFilter } from "./types";

export type DeckFilters = {
  status: StatusFilter;
  excludeGreen: boolean;
};

export function filterCards(cards: Card[], filters: DeckFilters): Card[] {
  let filtered = cards;
  if (filters.excludeGreen) {
    filtered = filtered.filter((card) => card.status !== "green");
  }
  if (filters.status !== "all") {
    filtered = filtered.filter((card) => card.status === filters.status);
  }
  return filtered;
}

export function weightedRandomPick(
  cards: Card[],
  weights: DeckWeights
): Card | null {
  if (!cards.length) {
    return null;
  }

  const totals: Record<Status, number> = {
    red: 0,
    yellow: 0,
    green: 0,
  };

  for (const card of cards) {
    totals[card.status] += 1;
  }

  const weightSum =
    (totals.red ? weights.red : 0) +
    (totals.yellow ? weights.yellow : 0) +
    (totals.green ? weights.green : 0);

  if (weightSum <= 0) {
    return cards[Math.floor(Math.random() * cards.length)] ?? null;
  }

  const normalizedWeights: Record<Status, number> = {
    red: totals.red ? weights.red / weightSum : 0,
    yellow: totals.yellow ? weights.yellow / weightSum : 0,
    green: totals.green ? weights.green / weightSum : 0,
  };

  const rand = Math.random();
  let threshold = normalizedWeights.red;
  let selectedStatus: Status = "red";

  if (rand <= threshold) {
    selectedStatus = "red";
  } else {
    threshold += normalizedWeights.yellow;
    if (rand <= threshold) {
      selectedStatus = "yellow";
    } else {
      selectedStatus = "green";
    }
  }

  const pool = cards.filter((card) => card.status === selectedStatus);
  if (!pool.length) {
    return cards[Math.floor(Math.random() * cards.length)] ?? null;
  }
  return pool[Math.floor(Math.random() * pool.length)] ?? null;
}
