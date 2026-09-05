export interface Transaction {
  isTarget: boolean;
  date: string; // YYYY/MM/DD
  content: string;
  amount: number;
  institution: string;
  majorCategory: string;
  minorCategory: string;
  memo: string;
  isTransfer: boolean;
  id: string;
}

export interface AssetSnapshot {
  date: string; // YYYY/MM/DD
  [column: string]: string | number;
}

export interface ClassifyRule {
  major: string;
  minor: string; // "*" matches any
  reason: string;
}

export interface ClassifyRules {
  nonRecurring: ClassifyRule[];
}
