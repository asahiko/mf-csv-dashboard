import { useMemo } from "react";
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { AssetSnapshot } from "../lib/types";
import { formatYenCompact } from "../lib/format";

interface Props {
  assetHistory: AssetSnapshot[];
}

const PALETTE = [
  "#6a4fb3",
  "#2e7d32",
  "#1565c0",
  "#c62828",
  "#ef6c00",
  "#00838f",
];

export function AssetTrendChart({ assetHistory }: Props) {
  const columns = useMemo(() => {
    const keys = new Set<string>();
    for (const row of assetHistory) {
      for (const k of Object.keys(row)) {
        if (k !== "date" && k !== "合計（円）") keys.add(k);
      }
    }
    return [...keys];
  }, [assetHistory]);

  if (assetHistory.length === 0) {
    return <p className="hint">資産推移データが見つかりません。</p>;
  }

  return (
    <div>
      <ResponsiveContainer width="100%" height={400}>
        <ComposedChart
          data={assetHistory}
          margin={{ top: 8, right: 16, left: 0, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
          <XAxis dataKey="date" tick={{ fontSize: 11 }} minTickGap={40} />
          <YAxis
            tickFormatter={(v) => formatYenCompact(v)}
            width={70}
            tick={{ fontSize: 11 }}
          />
          <Tooltip formatter={(value) => formatYenCompact(Number(value))} />
          <Legend />
          {columns.map((col, i) => (
            <Area
              key={col}
              type="monotone"
              dataKey={col}
              name={col}
              stackId="1"
              stroke={PALETTE[i % PALETTE.length]}
              fill={PALETTE[i % PALETTE.length]}
              fillOpacity={0.5}
            />
          ))}
          <Line
            type="monotone"
            dataKey="合計（円）"
            name="合計"
            stroke="var(--fg)"
            strokeWidth={2}
            dot={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
      <p className="hint">
        直近は日次、過去は月末スナップショットのため、点の密度が期間によって異なります。
      </p>
    </div>
  );
}
