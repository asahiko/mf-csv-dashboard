import { useMemo, useState } from "react";
import { MonthlyTrendChart } from "./components/MonthlyTrendChart";
import { YearlyCashFlowChart } from "./components/YearlyCashFlowChart";
import { AssetTrendChart } from "./components/AssetTrendChart";
import {
  aggregateMonthly,
  aggregateYearly,
  excludeCurrentMonth,
} from "./lib/aggregate";
import { assetHistory, classifyRules, transactions } from "./lib/loadData";
import "./App.css";

type Tab = "monthly" | "yearly" | "assets";

const TABS: { id: Tab; label: string }[] = [
  { id: "monthly", label: "月次移動平均" },
  { id: "yearly", label: "年次資金推移" },
  { id: "assets", label: "資産推移" },
];

function App() {
  const [tab, setTab] = useState<Tab>("monthly");

  const monthlyAll = useMemo(
    () => aggregateMonthly(transactions, classifyRules),
    [],
  );
  const monthly = useMemo(() => excludeCurrentMonth(monthlyAll), [monthlyAll]);

  const monthsPerYear = useMemo(() => {
    const counts = new Map<number, number>();
    for (const m of monthly) {
      counts.set(m.year, (counts.get(m.year) ?? 0) + 1);
    }
    return counts;
  }, [monthly]);

  const yearly = useMemo(
    () => aggregateYearly(monthly, (year) => monthsPerYear.get(year) ?? 0),
    [monthly, monthsPerYear],
  );

  return (
    <div>
      <header>
        <h1>My Financial Dashboard</h1>
        <p className="hint">
          {transactions.length.toLocaleString()}件の家計簿データ / 資産推移
          {assetHistory.length}件・完全ローカル動作。
        </p>
      </header>

      <nav className="tabs">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            className={t.id === tab ? "active" : ""}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </nav>

      <main>
        {tab === "monthly" && <MonthlyTrendChart monthly={monthly} />}
        {tab === "yearly" && <YearlyCashFlowChart yearly={yearly} />}
        {tab === "assets" && <AssetTrendChart assetHistory={assetHistory} />}
      </main>
    </div>
  );
}

export default App;
