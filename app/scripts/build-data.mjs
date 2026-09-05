// Parses Money Forward ME CSV exports (Shift-JIS / CP932) into a normalized
// JSON dataset consumed by the frontend. Run via `npm run build:data`.
import { readFileSync, readdirSync, writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import iconv from "iconv-lite";
import { parse } from "csv-parse/sync";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..", "..");
const CSV_DIR = join(ROOT, "private-csv");
// All generated/personal data lives outside app/ in the repo-root
// `private-data/` directory (gitignored wholesale), so it can never be
// swept up by an `app`-scoped `git add`.
const OUT_DIR = join(ROOT, "private-data");

mkdirSync(OUT_DIR, { recursive: true });

function readCp932Csv(path) {
  const buf = readFileSync(path);
  const text = iconv.decode(buf, "cp932");
  return parse(text, { columns: true, skip_empty_lines: true });
}

// --- 家計簿データ (cf) ---------------------------------------------------
const cfFiles = readdirSync(CSV_DIR).filter((f) => /^\d{4}-\d{2}\.csv$/.test(f));
cfFiles.sort();

const transactions = [];
for (const file of cfFiles) {
  const rows = readCp932Csv(join(CSV_DIR, file));
  for (const row of rows) {
    const date = row["日付"]?.trim();
    if (!date) continue;
    transactions.push({
      isTarget: row["計算対象"]?.trim() === "1",
      date, // YYYY/MM/DD
      content: row["内容"]?.trim() ?? "",
      amount: Number(row["金額（円）"]),
      institution: row["保有金融機関"]?.trim() ?? "",
      majorCategory: row["大項目"]?.trim() ?? "",
      minorCategory: row["中項目"]?.trim() ?? "",
      memo: row["メモ"]?.trim() ?? "",
      isTransfer: row["振替"]?.trim() === "1",
      id: row["ID"]?.trim() ?? "",
    });
  }
}
transactions.sort((a, b) => a.date.localeCompare(b.date));

// --- 資産推移 (bs/history) ------------------------------------------------
const assetFile = join(CSV_DIR, "資産推移月次.csv");
let assetHistory = [];
try {
  const rows = readCp932Csv(assetFile);
  const columns = Object.keys(rows[0] ?? {}).filter((c) => c !== "日付");
  assetHistory = rows
    .map((row) => {
      const entry = { date: row["日付"]?.trim() };
      for (const col of columns) {
        entry[col] = Number(row[col]);
      }
      return entry;
    })
    .filter((e) => e.date)
    .sort((a, b) => a.date.localeCompare(b.date));
} catch (err) {
  console.warn("資産推移 CSV not found or unreadable:", err.message);
}

writeFileSync(
  join(OUT_DIR, "transactions.json"),
  JSON.stringify(transactions),
);
writeFileSync(
  join(OUT_DIR, "assetHistory.json"),
  JSON.stringify(assetHistory),
);

// --- 非経常判定ルール（リポジトリルートの公開用デフォルト + data/ のローカル追加分をマージ） ---
const defaultRules = JSON.parse(
  readFileSync(join(ROOT, "classify-rules.default.json"), "utf-8"),
);
let localRules = { nonRecurring: [] };
try {
  localRules = JSON.parse(
    readFileSync(join(OUT_DIR, "classify-rules.local.json"), "utf-8"),
  );
} catch {
  // data/classify-rules.local.json is optional; see classify-rules.local.example.json
}
writeFileSync(
  join(OUT_DIR, "classify-rules.json"),
  JSON.stringify({
    nonRecurring: [
      ...defaultRules.nonRecurring,
      ...(localRules.nonRecurring ?? []),
    ],
  }),
);

console.log(
  `Parsed ${transactions.length} transactions from ${cfFiles.length} files, ${assetHistory.length} asset snapshots.`,
);

// Sanity report: distinct 大項目/中項目 pairs, useful for tuning classify-rules.json
const pairs = new Map();
for (const t of transactions) {
  const key = `${t.majorCategory}\t${t.minorCategory}`;
  pairs.set(key, (pairs.get(key) ?? 0) + 1);
}
const summary = [...pairs.entries()]
  .sort((a, b) => b[1] - a[1])
  .map(([key, count]) => {
    const [major, minor] = key.split("\t");
    return { major, minor, count };
  });
writeFileSync(
  join(OUT_DIR, "categorySummary.json"),
  JSON.stringify(summary, null, 2),
);
