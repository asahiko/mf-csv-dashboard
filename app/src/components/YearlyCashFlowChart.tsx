import { useState } from "react";
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { YearlyAggregate } from "../lib/aggregate";
import { formatYenCompact } from "../lib/format";

interface Props {
  yearly: YearlyAggregate[];
}

export function YearlyCashFlowChart({ yearly }: Props) {
  const [recurringOnly, setRecurringOnly] = useState(true);

  const incomeField = recurringOnly ? "incomeRecurring" : "income";
  const expenseField = recurringOnly ? "expenseRecurring" : "expense";
  const netField = recurringOnly ? "netRecurring" : "net";

  const data = yearly.map((y) => ({
    ...y,
    yearLabel: y.isPartial ? `${y.year}(進行中)` : `${y.year}`,
    expenseNeg: -y[expenseField as keyof YearlyAggregate],
  }));

  return (
    <div>
      <div className="controls">
        <label>
          <input
            type="checkbox"
            checked={recurringOnly}
            onChange={(e) => setRecurringOnly(e.target.checked)}
          />{" "}
          非経常項目(立替・臨時収入・特別な支出)を除外
        </label>
      </div>
      <ResponsiveContainer width="100%" height={400}>
        <ComposedChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
          <XAxis dataKey="yearLabel" tick={{ fontSize: 11 }} />
          <YAxis
            tickFormatter={(v) => formatYenCompact(v)}
            width={70}
            tick={{ fontSize: 11 }}
          />
          <Tooltip formatter={(value) => formatYenCompact(Number(value))} />
          <Legend />
          <Bar dataKey={incomeField} name="収入" fill="var(--income)" />
          <Bar dataKey="expenseNeg" name="支出" fill="var(--expense)" />
          <Line
            type="monotone"
            dataKey={netField}
            name="収支"
            stroke="var(--net)"
            strokeWidth={2.5}
            dot={{ r: 3 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
      <p className="hint">
        「(進行中)」の年は12ヶ月分のデータが揃っていません。他の年と単純比較しないでください。
      </p>
    </div>
  );
}
