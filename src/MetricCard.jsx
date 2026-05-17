export default function MetricCard({ label, value, subtext, accent = false }) {
  return (
    <div
      className={[
        "rounded-[1.75rem] border p-5 shadow-sm transition",
        accent ? "border-[#2525bf]/15 bg-[#2525bf] text-white shadow-[#2525bf]/10" : "border-slate-200 bg-white hover:shadow-md",
      ].join(" ")}
    >
      <div className={["text-[11px] font-semibold uppercase tracking-[0.28em]", accent ? "text-white/70" : "text-slate-500"].join(" ")}>
        {label}
      </div>
      <div className={["mt-3 text-4xl font-semibold leading-none", accent ? "text-white" : "text-slate-900"].join(" ")}>
        {value}
      </div>
      <div className={["mt-3 text-sm leading-6", accent ? "text-white/75" : "text-slate-500"].join(" ")}>
        {subtext}
      </div>
    </div>
  );
}