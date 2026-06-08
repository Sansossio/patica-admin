import type { DayCount } from "@/lib/queries/stats";

const dayFmt = new Intl.DateTimeFormat("es-ES", { day: "2-digit", month: "short", timeZone: "UTC" });

function fmtDay(day: string | undefined): string {
  if (!day) return "";
  const d = new Date(`${day}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return day;
  return dayFmt.format(d);
}

/** Small bar chart with date axis (first · middle · last) and per-bar tooltips. */
export function ActivityChart({ data }: { data: DayCount[] }) {
  const max = Math.max(1, ...data.map((d) => d.count));
  const mid = Math.floor(data.length / 2);

  return (
    <div>
      <div className="flex h-24 items-end gap-[3px]">
        {data.map((d) => (
          <div
            key={d.day}
            className="group flex flex-1 items-end justify-center"
            title={`${fmtDay(d.day)}: ${d.count}`}
          >
            <div
              className="w-full rounded-t bg-primary/60 transition-colors group-hover:bg-primary"
              style={{ height: `${Math.max(3, (d.count / max) * 100)}%` }}
            />
          </div>
        ))}
      </div>
      <div className="mt-2 flex justify-between text-[10px] text-subtle">
        <span>{fmtDay(data[0]?.day)}</span>
        <span>{fmtDay(data[mid]?.day)}</span>
        <span>{fmtDay(data[data.length - 1]?.day)}</span>
      </div>
    </div>
  );
}
