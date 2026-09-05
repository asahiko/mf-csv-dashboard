// Generated/personal data lives in the repo-root `private-data/` directory
// (fully gitignored), never under app/src, so it can't accidentally get
// swept into a commit scoped to the app.
import transactionsJson from "../../../private-data/transactions.json";
import assetHistoryJson from "../../../private-data/assetHistory.json";
import classifyRulesJson from "../../../private-data/classify-rules.json";
import type { AssetSnapshot, ClassifyRules, Transaction } from "./types";

export const transactions = transactionsJson as Transaction[];
export const assetHistory = assetHistoryJson as AssetSnapshot[];
export const classifyRules = classifyRulesJson as unknown as ClassifyRules;
