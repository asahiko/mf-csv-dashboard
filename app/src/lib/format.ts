const yen = new Intl.NumberFormat("ja-JP", {
  style: "currency",
  currency: "JPY",
  maximumFractionDigits: 0,
});

export function formatYen(value: number): string {
  return yen.format(value);
}

export function formatYenCompact(value: number): string {
  const sign = value < 0 ? "-" : "";
  const abs = Math.abs(value);
  if (abs >= 10000) return `${sign}${(abs / 10000).toFixed(1)}万円`;
  return `${sign}${abs}円`;
}
