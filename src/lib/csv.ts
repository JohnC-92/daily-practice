import Papa from "papaparse";

export type CsvRow = Record<string, string | undefined>;

type ParseResult = {
  rows: CsvRow[];
  errors: string[];
};

const normalizeHeader = (header: string) => header.trim();

const stripBom = (text: string) => text.replace(/^\uFEFF/, "");

const stripLeadingEmptyLines = (text: string) => {
  const lines = text.split(/\r?\n/);
  while (lines.length) {
    const line = lines[0] ?? "";
    const cleaned = line.replace(/[,\t; ]/g, "").trim();
    if (cleaned.length > 0) {
      break;
    }
    lines.shift();
  }
  return lines.join("\n");
};

const detectDelimiter = (csvText: string) => {
  const firstLine = csvText.split(/\r?\n/)[0] || "";
  const candidates: Array<"," | ";" | "\t"> = [",", ";", "\t"];
  let best: { delimiter: "," | ";" | "\t"; count: number } | null = null;
  for (const delimiter of candidates) {
    const count = firstLine.split(delimiter).length - 1;
    if (!best || count > best.count) {
      best = { delimiter, count };
    }
  }
  if (!best || best.count === 0) {
    return ",";
  }
  return best.delimiter;
};

export function parseCsv(csvText: string): ParseResult {
  const cleaned = stripLeadingEmptyLines(stripBom(csvText));
  const result = Papa.parse<CsvRow>(cleaned, {
    header: true,
    skipEmptyLines: true,
    transformHeader: normalizeHeader,
    delimiter: detectDelimiter(cleaned),
  });

  const rows = (result.data || []).filter((row) =>
    Object.values(row || {}).some((value) => String(value || "").trim() !== "")
  );

  const errors = (result.errors || []).map((error) => error.message);

  return { rows, errors };
}
