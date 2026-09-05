import type { ClassifyRules, Transaction } from "./types";

export function isNonRecurring(t: Transaction, rules: ClassifyRules): boolean {
  return rules.nonRecurring.some(
    (r) =>
      r.major === t.majorCategory &&
      (r.minor === "*" || r.minor === t.minorCategory),
  );
}

/** Transactions that should count toward cash flow at all: 計算対象=1 かつ 振替でない */
export function isCashFlowRow(t: Transaction): boolean {
  return t.isTarget && !t.isTransfer;
}

export interface MonthKey {
  year: number;
  month: number; // 1-12
  key: string; // "YYYY-MM"
}

export function monthKeyOf(date: string): MonthKey {
  const [y, m] = date.split("/").map(Number);
  return { year: y, month: m, key: `${y}-${String(m).padStart(2, "0")}` };
}

export interface MonthlyAggregate {
  key: string;
  year: number;
  month: number;
  income: number;
  expense: number; // positive number
  net: number;
  incomeRecurring: number;
  expenseRecurring: number;
  netRecurring: number;
}

export function aggregateMonthly(
  transactions: Transaction[],
  rules: ClassifyRules,
): MonthlyAggregate[] {
  const byMonth = new Map<string, MonthlyAggregate>();

  for (const t of transactions) {
    if (!isCashFlowRow(t)) continue;
    const { key, year, month } = monthKeyOf(t.date);
    let agg = byMonth.get(key);
    if (!agg) {
      agg = {
        key,
        year,
        month,
        income: 0,
        expense: 0,
        net: 0,
        incomeRecurring: 0,
        expenseRecurring: 0,
        netRecurring: 0,
      };
      byMonth.set(key, agg);
    }

    const nonRecurring = isNonRecurring(t, rules);
    if (t.amount >= 0) {
      agg.income += t.amount;
      if (!nonRecurring) agg.incomeRecurring += t.amount;
    } else {
      agg.expense += -t.amount;
      if (!nonRecurring) agg.expenseRecurring += -t.amount;
    }
  }

  const result = [...byMonth.values()].sort((a, b) =>
    a.key.localeCompare(b.key),
  );
  for (const agg of result) {
    agg.net = agg.income - agg.expense;
    agg.netRecurring = agg.incomeRecurring - agg.expenseRecurring;
  }
  return result;
}

export function withRollingAverage<T extends { key: string }>(
  rows: T[],
  field: keyof T,
  window: number,
  outField: string,
): (T & Record<string, number | null>)[] {
  return rows.map((row, i) => {
    if (i < window - 1) return { ...row, [outField]: null };
    let sum = 0;
    for (let j = i - window + 1; j <= i; j++) {
      sum += rows[j][field] as unknown as number;
    }
    return { ...row, [outField]: sum / window };
  });
}

export interface YearlyAggregate {
  year: number;
  income: number;
  expense: number;
  net: number;
  incomeRecurring: number;
  expenseRecurring: number;
  netRecurring: number;
  isPartial: boolean;
}

export function aggregateYearly(
  monthly: MonthlyAggregate[],
  monthsInDataForYear: (year: number) => number,
): YearlyAggregate[] {
  const byYear = new Map<number, YearlyAggregate>();
  for (const m of monthly) {
    let agg = byYear.get(m.year);
    if (!agg) {
      agg = {
        year: m.year,
        income: 0,
        expense: 0,
        net: 0,
        incomeRecurring: 0,
        expenseRecurring: 0,
        netRecurring: 0,
        isPartial: false,
      };
      byYear.set(m.year, agg);
    }
    agg.income += m.income;
    agg.expense += m.expense;
    agg.incomeRecurring += m.incomeRecurring;
    agg.expenseRecurring += m.expenseRecurring;
  }
  const result = [...byYear.values()].sort((a, b) => a.year - b.year);
  for (const agg of result) {
    agg.net = agg.income - agg.expense;
    agg.netRecurring = agg.incomeRecurring - agg.expenseRecurring;
    agg.isPartial = monthsInDataForYear(agg.year) < 12;
  }
  return result;
}

/** Excludes the current (in-progress) month so rolling averages / bars don't
 * collapse at the right edge from a partial month. */
export function excludeCurrentMonth(
  monthly: MonthlyAggregate[],
  now = new Date(),
): MonthlyAggregate[] {
  const currentKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  return monthly.filter((m) => m.key !== currentKey);
}
