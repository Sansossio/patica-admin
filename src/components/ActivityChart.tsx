import type { DayCount } from "@/lib/queries/stats";
import { formatNumber } from "@/lib/format";

const dayFmt = new Intl.DateTimeFormat("es-ES", { day: "2-digit", month: "short", timeZone: "UTC" });

function fmtDay(day: string | undefined): string {
  if (!day) return "";
  const d = new Date(`${day}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return day;
  return dayFmt.format(d);
}

/** Singular/plural noun for a metric, used in the hover tooltip. */
export type ChartUnit = { one: string; many: string };

/**
 * Round a max value up to a "nice" axis ceiling and return evenly-spaced
 * integer ticks (0 … niceMax). Bars are scaled against `niceMax` so their
 * heights line up exactly with the gridlines.
 */
function niceScale(max: number, targetTicks = 4): { ticks: number[]; niceMax: number } {
  const m = Math.max(1, Math.ceil(max));
  const rawStep = m / targetTicks;
  const mag = Math.pow(10, Math.floor(Math.log10(rawStep)));
  const norm = rawStep / mag;
  const niceStepNorm = norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 5 ? 5 : 10;
  const step = Math.max(1, Math.round(niceStepNorm * mag));
  const niceMax = Math.ceil(m / step) * step;
  const ticks: number[] = [];
  for (let v = 0; v <= niceMax; v += step) ticks.push(v);
  return { ticks, niceMax };
}

/**
 * Small bar chart with a Y axis (dashed gridlines + value labels), an X date
 * axis (first · middle · last) and a per-bar hover tooltip showing the value
 * and its unit (e.g. "3 usuarios · 26 may").
 */
export function ActivityChart({ data, unit }: { data: DayCount[]; unit: ChartUnit }) {
  const maxCount = Math.max(...data.map((d) => d.count), 0);
  const { ticks, niceMax } = niceScale(maxCount);
  const mid = Math.floor(data.length / 2);

  return (
    <div>
      <div className="flex">
        {/* Y axis labels */}
        <div className="relative mr-2 h-24 w-6 shrink-0">
          {ticks.map((t) => (
            <span
              key={t}
              className="absolute right-0 -translate-y-1/2 text-[9px] tabular-nums leading-none text-subtle"
              style={{ bottom: `${(t / niceMax) * 100}%` }}
            >
              {formatNumber(t)}
            </span>
          ))}
        </div>

        {/* Plot area */}
        <div className="relative h-24 flex-1">
          {/* Dashed gridlines */}
          {ticks.map((t) => (
            <div
              key={t}
              className="absolute inset-x-0 border-t border-dashed border-border/60"
              style={{ bottom: `${(t / niceMax) * 100}%` }}
            />
          ))}

          {/* Bars */}
          <div className="absolute inset-0 flex items-end gap-[3px]">
            {data.map((d) => {
              const noun = d.count === 1 ? unit.one : unit.many;
              return (
                <div
                  key={d.day}
                  className="group relative flex h-full flex-1 items-end justify-center"
                >
                  <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1.5 -translate-x-1/2 whitespace-nowrap rounded-lg border border-border bg-surface-2 px-2.5 py-1 text-center opacity-0 shadow-lg transition-opacity duration-100 group-hover:opacity-100">
                    <span className="block text-sm font-semibold text-text">
                      {formatNumber(d.count)} {noun}
                    </span>
                    <span className="block text-[10px] text-subtle">{fmtDay(d.day)}</span>
                  </div>
                  <div
                    className="w-full rounded-t bg-primary/60 transition-colors group-hover:bg-primary"
                    style={{ height: `${(d.count / niceMax) * 100}%` }}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* X axis (dates), offset to line up with the plot area */}
      <div className="ml-8 mt-2 flex justify-between text-[10px] text-subtle">
        <span>{fmtDay(data[0]?.day)}</span>
        <span>{fmtDay(data[mid]?.day)}</span>
        <span>{fmtDay(data[data.length - 1]?.day)}</span>
      </div>
    </div>
  );
}
