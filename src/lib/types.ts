export type DeckName = "leetcode" | "system_design";
export type Status = "red" | "yellow" | "green";

export type Card = {
  id: string;
  deck: DeckName;
  status: Status;
  title: string;
  description?: string;
  link?: string;
  meta?: Record<string, string>;
  notes: {
    sections: Array<{
      label: string;
      value: string;
    }>;
  };
};

export type DeckWeights = Record<Status, number>;
export type StatusFilter = "all" | Status;
