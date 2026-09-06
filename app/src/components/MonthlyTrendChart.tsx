import { useMemo, useState } from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  ComposedChart,
  ReferenceArea,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { MonthlyAggregate, RollingMethod } from "../lib/aggregate";
import { withRollingAverage } from "../lib/aggregate";
import { formatYenCompact } from "../lib/format";
import { niceScale } from "../lib/niceScale";

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

const METHOD_FORMULA: Record<RollingMethod, string> = {
  mean: "平均 = 直近Nヶ月の値の合計 ÷ N\n例: N=3 のとき (1月+2月+3月) ÷ 3\n※1ヶ月だけ突出した値があると、その影響を丸ごと受ける",
  median: "中央値 = 直近Nヶ月の値を大きさ順に並べ替えたときの中央の値\nNが偶数なら中央2つの平均\n例: N=3 の値が [10, 20, 470] → 中央値は 20\n※極端に大きい/小さい1ヶ月があっても、その値自体は結果にほぼ影響しない",
};

function InfoIcon({ text }: { text: string }) {
  return (
    <span
      title={text}
      style={{
        display: "inline-block",
        marginLeft: 4,
        color: "var(--muted)",
        cursor: "help",
        border: "1px solid currentColor",
        borderRadius: "50%",
        width: 14,
        height: 14,
        lineHeight: "13px",
        textAlign: "center",
        fontSize: 10,
      }}
    >
      ?
    </span>
  );
}

export function MonthlyTrendChart({ monthly }: Props) {
  const [window, setWindow] = useState(3);
  const [metric, setMetric] = useState<Metric>("net");
  const [recurringOnly, setRecurringOnly] = useState(true);
  const [method, setMethod] = useState<RollingMethod>("mean");
  const [showAverage, setShowAverage] = useState(true);

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

  // Zoom the Y axis to whichever line is the main focus: the moving-average
  // line's own range when it's shown (so a single anomalous month doesn't
  // flatten it), otherwise the raw actual line's range. The raw line, when
  // both are shown, may run off the top/bottom of the chart in that month.
  // Ticks are snapped to round numbers and always include 0.
  const yScale = useMemo(() => {
    const values = data
      .map((d) => (showAverage ? d.avg : d[field]))
      .filter((v): v is number => v !== null && v !== undefined);
    if (values.length === 0) return undefined;
    return niceScale(Math.min(...values), Math.max(...values));
  }, [data, field, showAverage]);

  // One shaded band per year (alternating), so the year boundary is visible
  // at a glance without reading the X axis labels closely.
  const yearBands = useMemo(() => {
    const bands: { year: number; start: string; end: string }[] = [];
    for (const row of data) {
      const last = bands[bands.length - 1];
      if (last && last.year === row.year) {
        last.end = row.key;
      } else {
        bands.push({ year: row.year, start: row.key, end: row.key });
      }
    }
    return bands;
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
          <input
            type="checkbox"
            checked={recurringOnly}
            onChange={(e) => setRecurringOnly(e.target.checked)}
          />{" "}
          非経常項目(立替・臨時収入・特別な支出)を除外
        </label>
        <label>
          <input
            type="checkbox"
            checked={showAverage}
            onChange={(e) => setShowAverage(e.target.checked)}
          />{" "}
          移動平均線を表示
        </label>
        {showAverage && (
          <>
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
              <InfoIcon text={METHOD_FORMULA[method]} />
            </label>
          </>
        )}
      </div>

      <ResponsiveContainer width="100%" height={380}>
        <ComposedChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
          {yearBands.map((band, i) => (
            <ReferenceArea
              key={band.year}
              x1={band.start}
              x2={band.end}
              fill="var(--fg)"
              fillOpacity={i % 2 === 0 ? 0 : 0.05}
              stroke="none"
              ifOverflow="extendDomain"
              label={{
                value: `${band.year}`,
                position: "insideTopLeft",
                fontSize: 10,
                fill: "var(--muted)",
              }}
            />
          ))}
          <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
          <XAxis dataKey="key" tick={{ fontSize: 11 }} minTickGap={20} />
          <YAxis
            tickFormatter={(v) => formatYenCompact(v)}
            width={70}
            tick={{ fontSize: 11 }}
            domain={yScale ? [yScale.min, yScale.max] : ["auto", "auto"]}
            ticks={yScale?.ticks}
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
            strokeWidth={showAverage ? 1 : 2}
            dot={false}
            opacity={showAverage ? 0.5 : 1}
          />
          {showAverage && (
            <Line
              type="monotone"
              dataKey="avg"
              name={`${METRIC_LABEL[metric]}（${window}ヶ月移動${METHOD_LABEL[method]}）`}
              stroke="var(--accent)"
              strokeWidth={2.5}
              dot={false}
            />
          )}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
