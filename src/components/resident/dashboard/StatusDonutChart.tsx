type ChartSegment = {
  label: string;
  value: number;
  color: string;
};

type StatusDonutChartProps = {
  title: string;
  total: number;
  centerLabel: string;
  segments: ChartSegment[];
  footnote?: string;
};

function buildGradient(segments: ChartSegment[]) {
  if (segments.length === 0) return "conic-gradient(#64748b 0deg 360deg)";

  const total = segments.reduce((sum, segment) => sum + segment.value, 0) || 1;
  let current = 0;

  const stops = segments.map((segment) => {
    const start = (current / total) * 360;
    current += segment.value;
    const end = (current / total) * 360;
    return `${segment.color} ${start}deg ${end}deg`;
  });

  return `conic-gradient(${stops.join(", ")})`;
}

export function StatusDonutChart({
  title,
  total,
  centerLabel,
  segments,
  footnote,
}: StatusDonutChartProps) {
  const gradient = buildGradient(segments);

  return (
    <section className="rounded-[28px] border border-white/[0.06] bg-[linear-gradient(180deg,rgba(20,27,40,0.92),rgba(11,16,27,0.92))] p-5 sm:p-6 shadow-[0_20px_60px_rgba(0,0,0,0.28)]">
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-white">{title}</h3>
          {footnote ? <p className="mt-1 text-xs text-slate-400">{footnote}</p> : null}
        </div>
      </div>

      <div className="flex flex-col gap-5 lg:flex-row lg:items-center">
        <div className="relative flex w-full max-w-[250px] items-center justify-center">
          <div
            className="grid aspect-square w-full place-items-center rounded-full p-4"
            style={{
              background: gradient,
              boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.08)",
            }}
            aria-label={`${title} donut chart`}
          >
            <div className="grid aspect-square w-[64%] place-items-center rounded-full border border-white/[0.08] bg-[#101826] text-center shadow-inner">
              <div>
                <p className="text-2xl font-semibold text-white">{total.toLocaleString()}</p>
                <p className="mt-1 text-xs uppercase tracking-[0.2em] text-slate-400">{centerLabel}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid flex-1 gap-3">
          {segments.map((segment) => {
            const percentage = total > 0 ? Math.round((segment.value / total) * 100) : 0;

            return (
              <div key={segment.label} className="grid gap-2">
                <div className="flex items-center justify-between gap-3 text-sm">
                  <div className="flex items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: segment.color }}
                    />
                    <span className="text-slate-200">{segment.label}</span>
                  </div>
                  <span className="text-slate-400">
                    {segment.value.toLocaleString()} ({percentage}%)
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-white/[0.06]">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${percentage}%`,
                      backgroundColor: segment.color,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
