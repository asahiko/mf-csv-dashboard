export interface NiceScale {
  min: number;
  max: number;
  ticks: number[];
}

/** Rounds `range` up to a "nice" 1/2/5/10 * 10^n number (Heckbert's algorithm). */
function niceNum(range: number, round: boolean): number {
  const exponent = Math.floor(Math.log10(range));
  const fraction = range / Math.pow(10, exponent);
  let niceFraction: number;
  if (round) {
    if (fraction < 1.5) niceFraction = 1;
    else if (fraction < 3) niceFraction = 2;
    else if (fraction < 7) niceFraction = 5;
    else niceFraction = 10;
  } else {
    if (fraction <= 1) niceFraction = 1;
    else if (fraction <= 2) niceFraction = 2;
    else if (fraction <= 5) niceFraction = 5;
    else niceFraction = 10;
  }
  return niceFraction * Math.pow(10, exponent);
}

/**
 * Computes an axis domain and tick set that always includes 0 and lands on
 * round numbers (1/2/5 * 10^n steps), instead of an arbitrary min/max.
 */
export function niceScale(
  dataMin: number,
  dataMax: number,
  maxTicks = 6,
): NiceScale {
  const lo = Math.min(0, dataMin);
  const hi = Math.max(0, dataMax);
  if (lo === 0 && hi === 0) return { min: 0, max: 1, ticks: [0, 1] };

  const step = niceNum(niceNum(hi - lo, false) / (maxTicks - 1), true);
  const min = Math.floor(lo / step) * step;
  const max = Math.ceil(hi / step) * step;

  const ticks: number[] = [];
  for (let v = min; v <= max + step / 2; v += step) {
    ticks.push(Math.round(v / step) * step);
  }
  return { min, max, ticks };
}
