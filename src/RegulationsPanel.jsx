export const REGULATION_ITEMS = [
  { key: "width", code: "T3.4", label: "Total width", limit: "65.0–85.0 mm", type: "General" },
  { key: "height", code: "T3.5", label: "Total height", limit: "Max 65.0 mm", type: "General" },
  { key: "weight", code: "T3.6", label: "Total weight", limit: "Min 48.0 g", type: "Performance" },
  { key: "clearance", code: "T3.7", label: "Track clearance", limit: "Min 1.5 mm", type: "General" },

  { key: "chamberDiameter", code: "T5.1", label: "Cartridge chamber diameter", limit: "18.0–18.5 mm", type: "Safety" },
  { key: "chamberHeight", code: "T5.2", label: "Cartridge centre height", limit: "30.0–40.0 mm", type: "General" },
  { key: "chamberDepth", code: "T5.3", label: "Chamber depth", limit: "45.0–58.0 mm", type: "Safety" },
  { key: "chamberAngle", code: "T5.4", label: "Chamber angle", limit: "-3° to 3°", type: "Safety" },
  { key: "safetyZone", code: "T5.5", label: "Chamber safety zone", limit: "Min 3.0 mm", type: "Safety" },
  { key: "cartridgeVisibility", code: "T5.6", label: "Cartridge protrusion", limit: "Min 5.0 mm", type: "Performance" },

  { key: "tetherLocation", code: "T6.1", label: "Tether guide location", limit: "≤10.0 mm from axle lines", type: "Safety" },
  { key: "tetherHole", code: "T6.2", label: "Tether guide opening", limit: "3.5–6.0 mm", type: "Safety" },
  { key: "tetherSafety", code: "T6.3", label: "Tether guide safety", limit: "Closed + 300 g test", type: "Safety" },

  { key: "wheelContactFront", code: "T7.4.1", label: "Front wheel contact width", limit: "Min 12.0 mm", type: "Performance" },
  { key: "wheelContactRear", code: "T7.4.2", label: "Rear wheel contact width", limit: "Min 15.0 mm", type: "Performance" },
  { key: "wheelDiameter", code: "T7.5", label: "Wheel diameter", limit: "28.0–32.0 mm", type: "Performance" },
  { key: "wheelRotation", code: "T7.8", label: "Wheel rotation", limit: "Free on 3° incline", type: "Performance" },

  { key: "frontWingSpan", code: "T8.6.1", label: "Front wing span", limit: "Min 50.0 mm total", type: "Performance" },
  { key: "frontWingChord", code: "T8.6.2", label: "Front wing chord", limit: "15.0–25.0 mm", type: "Performance" },
  { key: "frontWingThickness", code: "T8.6.3", label: "Front wing thickness", limit: "2.0–6.0 mm", type: "Performance" },
  { key: "frontWingAirflow", code: "T8.7", label: "Front wing clear airflow", limit: "Min 5.0 mm", type: "Performance" },

  { key: "rearWingSpan", code: "T9.5.1", label: "Rear wing span", limit: "Min 50.0 mm", type: "Performance" },
  { key: "rearWingChord", code: "T9.5.2", label: "Rear wing chord", limit: "15.0–25.0 mm", type: "Performance" },
];

export default function RegulationsPanel({ checks, setChecks }) {
  const checkedCount = REGULATION_ITEMS.filter((item) => checks[item.key]).length;
  const progress = Math.round((checkedCount / REGULATION_ITEMS.length) * 100);

  function toggle(key) {
    setChecks((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  return (
    <section className="h-full overflow-hidden rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Regulations Checklist</h2>
          <p className="mt-1 text-sm text-slate-500">Manual check based on SRWF26 technical limits</p>
        </div>

        <div className="rounded-full bg-[#2525bf]/10 px-4 py-2 text-sm font-semibold text-[#2525bf]">
          {checkedCount}/{REGULATION_ITEMS.length} · {progress}%
        </div>
      </div>

      <div className="mt-5 h-2 rounded-full bg-slate-100">
        <div
          className="h-2 rounded-full bg-[#2525bf]"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="mt-5 grid max-h-[calc(100vh-250px)] gap-3 overflow-y-auto pr-2 md:grid-cols-2 xl:grid-cols-3">
        {REGULATION_ITEMS.map((item) => (
          <label
            key={item.key}
            className="flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4"
          >
            <input
              type="checkbox"
              checked={!!checks[item.key]}
              onChange={() => toggle(item.key)}
              className="mt-1 h-4 w-4 accent-[#2525bf]"
            />

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-white px-2 py-1 text-[10px] font-semibold text-slate-500">
                  {item.code}
                </span>
                <span className="rounded-full bg-[#ff5100]/10 px-2 py-1 text-[10px] font-semibold text-[#ff5100]">
                  {item.type}
                </span>
              </div>

              <div className="mt-2 text-sm font-semibold text-slate-900">{item.label}</div>
              <div className="mt-1 text-sm text-slate-600">{item.limit}</div>
            </div>
          </label>
        ))}
      </div>
    </section>
  );
}