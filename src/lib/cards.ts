import { Card, DeckName, Status } from "./types";

const statusMap: Record<string, Status> = {
  red: "red",
  yellow: "yellow",
  green: "green",
  low: "red",
  medium: "yellow",
  high: "green",
  "0": "red",
  "1": "yellow",
  "2": "green",
};

const normalize = (value?: string) => String(value || "").trim();

const slugifyLeetCodeTitle = (input: string) =>
  input
    .toLowerCase()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

export function normalizeStatus(value?: string): Status {
  const key = normalize(value).toLowerCase();
  return statusMap[key] ?? "yellow";
}

const mapLegacyStatusFromId = (value?: string): Status | null => {
  const normalized = normalize(value);
  if (normalized === "0") return "red";
  if (normalized === "1") return "yellow";
  if (normalized === "2") return "green";
  return null;
};

const splitKeyPoints = (value: string) => {
  const cleaned = value.replace(/\r/g, "\n");
  if (!cleaned) return [];
  return cleaned
    .split(/\s*[–-]SEPARATOR[–-]\s*/g)
    .map((block) => block.trim())
    .filter(Boolean);
};

export function mapLeetCodeRows(rows: Record<string, string | undefined>[]): Card[] {
  return rows
    .map((row, index) => {
      const id = normalize(row["ID"]) || String(index + 1);
      const name = normalize(row["Name"]);
      const title = name ? name : `${id}.`;
      const description = normalize(row["Description"]) || undefined;
      const link = normalize(row["Link"]) || undefined;
      const match = title.match(/^(\d+)\.\s*(.+)$/);
      const derivedSlug = match ? slugifyLeetCodeTitle(match[2]) : null;
      const derivedLink = derivedSlug
        ? `https://leetcode.com/problems/${derivedSlug}/`
        : undefined;
      const status = normalizeStatus(
        row["Status"] || mapLegacyStatusFromId(row["ID"]) || undefined
      );

      const meta: Record<string, string> = {};
      const times = normalize(row["Times Submitted"]);
      if (times) {
        meta["Times Submitted"] = times;
      }

      const sections = [
        { label: "Reason for fail", value: normalize(row["Reason for fail"]) },
        { label: "Takeaway", value: normalize(row["Takeaway"]) },
        { label: "Follow Up", value: normalize(row["Follow Up"]) },
        { label: "Time Complexity", value: normalize(row["Time Complexity"]) },
        { label: "Space Complexity", value: normalize(row["Space Complexity"]) },
      ].filter((section) => section.value);

      return {
        id,
        deck: "leetcode" as DeckName,
        status,
        title,
        description,
        link: link || derivedLink,
        meta: Object.keys(meta).length ? meta : undefined,
        notes: { sections },
      };
    })
    .filter((card) => card.title.trim() !== "");
}

const hashString = (input: string) => {
  let hash = 5381;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash * 33) ^ input.charCodeAt(i);
  }
  return Math.abs(hash).toString(36);
};

export function mapSystemDesignRows(
  rows: Record<string, string | undefined>[]
): Card[] {
  return rows
    .flatMap((row, index) => {
      const title = normalize(row["System Question"]);
      if (!title) {
        return [];
      }
      const status = normalizeStatus(row["Familiarity"]);
      const id = hashString(`${title}-${index}`);
      const description = normalize(row["Description"]) || undefined;
      const keyPointsRaw = normalize(row["Key Points"]);
      const keyPoints = splitKeyPoints(keyPointsRaw);
      const keyPointSections = keyPoints.map((point, idx) => ({
        label: `Key Point ${idx + 1}`,
        value: point,
      }));
      const sections = keyPointSections.filter((section) => section.value);

      return [
        {
          id,
          deck: "system_design" as DeckName,
          status,
          title,
          description,
          notes: { sections },
        },
      ];
    });
}
