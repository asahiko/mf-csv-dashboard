import { useMemo, useState } from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  ComposedChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { MonthlyAggregate, RollingMethod } from "../lib/aggregate";
import { withRollingAverage } from "../lib/aggregate";
import { formatYenCompact } from "../lib/format";

interface Props {
  monthly: MonthlyAggregate[];
}

type Metric = "net" | "income" | "expense";

const METRIC_LABEL: Record<Metric, string> = {
  net: "収支",
  income: "収入",
  expense: "支出",
};

const METHOD_LABEL: Record<RollingMethod, string> = {
  mean: "平均",
  median: "中央値",
};

export function MonthlyTrendChart({ monthly }: Props) {
  const [window, setWindow] = useState(3);
  const [metric, setMetric] = useState<Metric>("net");
  const [recurringOnly, setRecurringOnly] = useState(true);
  const [method, setMethod] = useState<RollingMethod>("mean");

  const field = (recurringOnly ? `${metric}Recurring` : metric) as
    | "netRecurring"
    | "incomeRecurring"
    | "expenseRecurring"
    | "net"
    | "income"
    | "expense";

  const data = useMemo(
    () => withRollingAverage(monthly, field, window, "avg", method),
    [monthly, field, window, method],
  );

  // Zoom the Y axis to the moving-average line's own range instead of the
  // raw actual line's range, so a single anomalous month doesn't flatten
  // the average line. The raw line is still drawn full-height but may run
  // off the top/bottom of the chart in that month.
  const avgDomain = useMemo((): [number, number] | undefined => {
    const values = data
      .map((d) => d.avg)
      .filter((v): v is number => v !== null && v !== undefined);
    if (values.length === 0) return undefined;
    const min = Math.min(0, ...values);
    const max = Math.max(0, ...values);
    const pad = (max - min) * 0.15 || Math.abs(max) * 0.15 || 1;
    return [min - pad, max + pad];
  }, [data]);

  return (
    <div>
      <div className="controls">
        <label>
          指標:{" "}
          <select
            value={metric}
            onChange={(e) => setMetric(e.target.value as Metric)}
          >
            {Object.entries(METRIC_LABEL).map(([k, label]) => (
              <option key={k} value={k}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label>
          移動平均:{" "}
          <select
            value={window}
            onChange={(e) => setWindow(Number(e.target.value))}
          >
            <option value={3}>3ヶ月</option>
            <option value={5}>5ヶ月</option>
            <option value={12}>12ヶ月</option>
          </select>
        </label>
        <label>
          <input
            type="checkbox"
            checked={recurringOnly}
            onChange={(e) => setRecurringOnly(e.target.checked)}
          />{" "}
          非経常項目(立替・臨時収入・特別な支出)を除外
        </label>
        <label>
          集計方法:{" "}
          <select
            value={method}
            onChange={(e) => setMethod(e.target.value as RollingMethod)}
          >
            {Object.entries(METHOD_LABEL).map(([k, label]) => (
              <option key={k} value={k}>
                {label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <ResponsiveContainer width="100%" height={380}>
        <ComposedChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
          <XAxis dataKey="key" tick={{ fontSize: 11 }} minTickGap={20} />
          <YAxis
            tickFormatter={(v) => formatYenCompact(v)}
            width={70}
            tick={{ fontSize: 11 }}
            domain={avgDomain ?? ["auto", "auto"]}
            allowDataOverflow
          />
          <Tooltip
            formatter={(value) => formatYenCompact(Number(value))}
            labelFormatter={(label) => `${label}`}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey={field}
            name={`${METRIC_LABEL[metric]}（実測）`}
            stroke="var(--muted)"
            strokeWidth={1}
            dot={false}
            opacity={0.5}
          />
          <Line
            type="monotone"
            dataKey="avg"
            name={`${METRIC_LABEL[metric]}（${window}ヶ月移動${METHOD_LABEL[method]}）`}
            stroke="var(--accent)"
            strokeWidth={2.5}
            dot={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
