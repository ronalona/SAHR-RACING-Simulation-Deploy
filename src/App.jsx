import React, { useMemo, useRef, useState } from "react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { analyzeStep } from "./analyzeStep";
import BuddyPanel from "./BuddyPanel";
import RegulationsPanel, { REGULATION_ITEMS } from "./RegulationsPanel";

function fmt(value, digits = 3) {
  return Number.isFinite(value) ? value.toFixed(digits) : "—";
}

function Bar({ label, value, max, unit }) {
  const width = Math.min(100, Math.max(0, (value / max) * 100));

  return (
    <div className="rounded-[1.5rem] bg-slate-50 p-5">
      <div className="flex items-center justify-between text-sm">
        <span className="font-semibold text-slate-900">{label}</span>
        <span className="text-slate-600">
          {fmt(value, 3)} {unit}
        </span>
      </div>

      <div className="mt-3 h-3 rounded-full bg-white">
        <div
          className="h-3 rounded-full bg-[#2525bf]"
          style={{ width: `${width}%` }}
        />
      </div>
    </div>
  );
}

export default function App() {
  const fileInputRef = useRef(null);

  const [page, setPage] = useState("simulation");
  const [warningOpen, setWarningOpen] = useState(true);
  const [teamName, setTeamName] = useState("");
  const [fileName, setFileName] = useState("");
  const [analysis, setAnalysis] = useState(null);
  const [error, setError] = useState("");

  const [regChecks, setRegChecks] = useState(
    Object.fromEntries(REGULATION_ITEMS.map((item) => [item.key, false]))
  );

  const regSummary = useMemo(() => {
    const checkedCount = Object.values(regChecks).filter(Boolean).length;

    return {
      checkedCount,
      totalCount: REGULATION_ITEMS.length,
      complete: checkedCount === REGULATION_ITEMS.length,
      percent: Math.round((checkedCount / REGULATION_ITEMS.length) * 100),
    };
  }, [regChecks]);

  const regStatusText = regSummary.complete
    ? "Complete"
    : `${regSummary.checkedCount}/${regSummary.totalCount} checked`;

  function handleFile(file) {
    setError("");
    if (!file) return;

    const ext = file.name.split(".").pop()?.toLowerCase();

    if (!["step", "stp"].includes(ext)) {
      setError("Only STEP (.step / .stp) files are supported.");
      return;
    }

    file
      .text()
      .then((text) => {
        const result = analyzeStep(text);
        setAnalysis(result);
        setFileName(file.name);
        setPage("simulation");
      })
      .catch((e) => {
        setError(e instanceof Error ? e.message : "Failed to read STEP file.");
      });
  }

  function resetAll() {
    setAnalysis(null);
    setFileName("");
    setTeamName("");
    setError("");
    setRegChecks(Object.fromEntries(REGULATION_ITEMS.map((item) => [item.key, false])));

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function downloadPdfReport() {
    if (!analysis) return;

    const doc = new jsPDF({ unit: "mm", format: "a4" });

    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.text("SAHR Racing Simulation Report", 14, 18);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.text(`Team Name: ${teamName || "-"}`, 14, 28);
    doc.text(`File: ${fileName || "-"}`, 14, 35);

    doc.setFont("helvetica", "bold");
    doc.text("Simulation Results", 14, 48);

    autoTable(doc, {
      startY: 54,
      head: [["Metric", "Value"]],
      body: [
        ["Frontal Area", `${fmt(analysis.areas.frontalArea, 6)} m²`],
        ["Drag", `${fmt(analysis.aero.dragN, 3)} N`],
        ["Lift", `${fmt(analysis.aero.liftN, 3)} N`],
        ["Cd", fmt(analysis.aero.cd, 3)],
        ["Cl", fmt(analysis.aero.cl, 3)],
        ["Length", `${fmt(analysis.dimensions.length * 1000, 1)} mm`],
        ["Width", `${fmt(analysis.dimensions.width * 1000, 1)} mm`],
        ["Height", `${fmt(analysis.dimensions.height * 1000, 1)} mm`],
        ["Regulation Status", regStatusText],
      ],
      styles: { fontSize: 9, cellPadding: 2.5 },
      headStyles: { fillColor: [37, 37, 191] },
    });

    const chartY = doc.lastAutoTable.finalY + 14;

    doc.setFont("helvetica", "bold");
    doc.text("Performance Bars", 14, chartY);

    const bars = [
      ["Frontal Area", analysis.areas.frontalArea, 0.002, "m²"],
      ["Drag", analysis.aero.dragN, 1.0, "N"],
      ["Lift", Math.abs(analysis.aero.liftN), 0.2, "N"],
    ];

    bars.forEach((bar, i) => {
      const [label, value, max, unit] = bar;
      const y = chartY + 10 + i * 12;
      const w = Math.min(90, Math.max(2, (value / max) * 90));

      doc.setFont("helvetica", "normal");
      doc.text(`${label}: ${fmt(value, 3)} ${unit}`, 14, y);
      doc.setFillColor(237, 241, 245);
      doc.rect(70, y - 4, 90, 5, "F");
      doc.setFillColor(37, 37, 191);
      doc.rect(70, y - 4, w, 5, "F");
    });

    autoTable(doc, {
      startY: chartY + 50,
      head: [["Checklist item", "Status"]],
      body: REGULATION_ITEMS.map((item) => [
        item.code ? `${item.code} — ${item.label}` : item.label,
        regChecks[item.key] ? "Checked" : "Not checked",
      ]),
      styles: { fontSize: 8.5, cellPadding: 2.2 },
      headStyles: { fillColor: [255, 81, 0] },
    });

    const finalY = doc.lastAutoTable.finalY + 10;

    doc.setFontSize(9);
    doc.text(
      "Warning: Results are estimates only. Cross-check in ANSYS and final scrutineering before relying on the values.",
      14,
      finalY,
      { maxWidth: 180 }
    );

    doc.save(`${(teamName || fileName || "sahr-racing").replace(/\.[^.]+$/, "")}-report.pdf`);
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[#edf1f5] text-slate-900">
      {warningOpen && (
        <div className="fixed inset-0 z-[60] flex items-start justify-center bg-slate-950/50 p-4">
          <div className="mt-8 w-full max-w-xl rounded-[2rem] bg-white p-5 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-lg font-semibold">Warning</div>
                <div className="mt-2 text-sm leading-6 text-slate-600">
                  This tool gives estimates only. Drag, lift, and frontal area should be
                  cross-checked in ANSYS and final scrutineering. Results were tested multiple
                  times during development, but this should not be the only source of truth.
                </div>
              </div>

              <button
                onClick={() => setWarningOpen(false)}
                className="rounded-full border border-slate-200 px-3 py-1 text-sm"
              >
                X
              </button>
            </div>
          </div>
        </div>
      )}

      <header className="shrink-0 border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between px-4 py-4">
          <div className="flex items-center gap-4">
            <img
              src="sahr-logo.png"
              alt="SAHR Racing logo"
              className="h-12 w-12 rounded-2xl object-cover"
            />
            <div className="text-2xl font-semibold">SAHR Racing Simulation</div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setPage("simulation")}
              className={`rounded-full px-4 py-2 text-sm font-semibold ${
                page === "simulation" ? "bg-[#2525bf] text-white" : "bg-slate-100"
              }`}
            >
              Simulation
            </button>

            <button
              onClick={() => setPage("regulations")}
              className={`rounded-full px-4 py-2 text-sm font-semibold ${
                page === "regulations" ? "bg-[#2525bf] text-white" : "bg-slate-100"
              }`}
            >
              Regulations
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-hidden">
        <div className="mx-auto h-full max-w-[1600px] px-4 py-4">
          {page === "simulation" ? (
            <div className="grid h-full gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
              <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold">Simulation</h2>
                  <button
                    onClick={resetAll}
                    className="rounded-full border border-slate-200 px-4 py-2 text-sm"
                  >
                    Reset
                  </button>
                </div>

                <div className="mt-5 space-y-4">
                  <input
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    placeholder="Team name"
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none"
                  />

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".step,.stp"
                    className="hidden"
                    onChange={(e) => handleFile(e.target.files?.[0])}
                  />

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full rounded-full bg-[#2525bf] px-5 py-3 text-sm font-semibold text-white"
                  >
                    Choose STEP file
                  </button>

                  <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm">
                    File: {fileName || "None"}
                  </div>

                  {error && (
                    <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">
                      {error}
                    </div>
                  )}

                  <button
                    onClick={downloadPdfReport}
                    disabled={!analysis}
                    className="w-full rounded-full bg-[#ff5100] px-5 py-3 text-sm font-semibold text-white disabled:opacity-40"
                  >
                    Download PDF report
                  </button>

                  <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm">
                    Regulation status: {regStatusText}
                  </div>

                  <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm">
                    Checklist progress: {regSummary.percent}%
                  </div>

                  <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
                    Method: STEP geometry estimate
                  </div>

                  <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
                    Validation: ANSYS recommended
                  </div>
                </div>
              </section>

              <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="rounded-[1.5rem] bg-slate-50 p-5">
                    <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                      Frontal Area
                    </div>
                    <div className="mt-3 text-4xl font-semibold">
                      {analysis ? `${fmt(analysis.areas.frontalArea, 6)} m²` : "—"}
                    </div>
                    <div className="mt-2 text-xs text-slate-500">
                      Projected front profile
                    </div>
                  </div>

                  <div className="rounded-[1.5rem] bg-slate-50 p-5">
                    <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                      Drag
                    </div>
                    <div className="mt-3 text-4xl font-semibold">
                      {analysis ? `${fmt(analysis.aero.dragN, 3)} N` : "—"}
                    </div>
                    <div className="mt-2 text-xs text-slate-500">
                      Estimated at 20 m/s
                    </div>
                  </div>

                  <div className="rounded-[1.5rem] bg-slate-50 p-5">
                    <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                      Lift
                    </div>
                    <div className="mt-3 text-4xl font-semibold">
                      {analysis ? `${fmt(analysis.aero.liftN, 3)} N` : "—"}
                    </div>
                    <div className="mt-2 text-xs text-slate-500">
                      Negative = downforce tendency
                    </div>
                  </div>
                </div>

                {analysis ? (
                  <div className="mt-6 grid gap-4 xl:grid-cols-3">
                    <div className="rounded-[1.5rem] bg-slate-50 p-5">
                      <div className="text-sm font-semibold">Model Scale</div>
                      <div className="mt-3 grid grid-cols-3 gap-3 text-center text-sm">
                        <div className="rounded-2xl bg-white p-3">
                          <div className="text-xs text-slate-500">Length</div>
                          <div className="mt-1 font-semibold">
                            {fmt(analysis.dimensions.length * 1000, 1)} mm
                          </div>
                        </div>

                        <div className="rounded-2xl bg-white p-3">
                          <div className="text-xs text-slate-500">Width</div>
                          <div className="mt-1 font-semibold">
                            {fmt(analysis.dimensions.width * 1000, 1)} mm
                          </div>
                        </div>

                        <div className="rounded-2xl bg-white p-3">
                          <div className="text-xs text-slate-500">Height</div>
                          <div className="mt-1 font-semibold">
                            {fmt(analysis.dimensions.height * 1000, 1)} mm
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-[1.5rem] bg-slate-50 p-5">
                      <div className="text-sm font-semibold">Aerodynamic Data</div>
                      <div className="mt-3 space-y-3 text-sm">
                        <div className="flex justify-between rounded-2xl bg-white p-3">
                          <span className="text-slate-500">Cd</span>
                          <span className="font-semibold">{fmt(analysis.aero.cd, 3)}</span>
                        </div>

                        <div className="flex justify-between rounded-2xl bg-white p-3">
                          <span className="text-slate-500">Cl</span>
                          <span className="font-semibold">{fmt(analysis.aero.cl, 3)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-[1.5rem] bg-slate-50 p-5">
                      <div className="text-sm font-semibold">Benchmark</div>
                      <div className="mt-3 space-y-3 text-sm">
                        <div className="flex justify-between rounded-2xl bg-white p-3">
                          <span className="text-slate-500">Speed</span>
                          <span className="font-semibold">20 m/s</span>
                        </div>

                        <div className="flex justify-between rounded-2xl bg-white p-3">
                          <span className="text-slate-500">Validation</span>
                          <span className="font-semibold">ANSYS required</span>
                        </div>
                      </div>
                    </div>

                    <div className="xl:col-span-3 grid gap-4 md:grid-cols-3">
                      <Bar
                        label="Frontal Area"
                        value={analysis.areas.frontalArea}
                        max={0.002}
                        unit="m²"
                      />
                      <Bar
                        label="Drag"
                        value={analysis.aero.dragN}
                        max={1}
                        unit="N"
                      />
                      <Bar
                        label="Lift"
                        value={Math.abs(analysis.aero.liftN)}
                        max={0.2}
                        unit="N"
                      />
                    </div>

                    <div className="xl:col-span-3 rounded-[1.5rem] bg-slate-50 p-5">
                      <div className="text-sm font-semibold">Interpretation</div>

                      <div className="mt-3 grid gap-3 text-sm text-slate-600 md:grid-cols-3">
                        <div className="rounded-2xl bg-white p-4">
                          Lower frontal area usually reduces drag, but it must not compromise
                          regulation compliance.
                        </div>

                        <div className="rounded-2xl bg-white p-4">
                          Drag is an estimate from geometry, not a replacement for full CFD.
                        </div>

                        <div className="rounded-2xl bg-white p-4">
                          Lift should stay near zero or slightly negative for stable straight-line
                          motion.
                        </div>
                      </div>
                    </div>

                    <div className="xl:col-span-3 rounded-[1.5rem] bg-[#2525bf] p-5 text-white">
                      <div className="text-sm font-semibold">Report Summary</div>

                      <div className="mt-3 grid gap-3 text-sm md:grid-cols-4">
                        <div className="rounded-2xl bg-white/10 p-4">
                          Team: {teamName || "Unnamed"}
                        </div>
                        <div className="rounded-2xl bg-white/10 p-4">
                          File: {fileName || "None"}
                        </div>
                        <div className="rounded-2xl bg-white/10 p-4">
                          Checklist: {regSummary.percent}%
                        </div>
                        <div className="rounded-2xl bg-white/10 p-4">
                          Export: PDF ready
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="mt-6 rounded-[1.5rem] border border-dashed border-slate-200 bg-slate-50 p-10 text-center text-sm text-slate-500">
                    Upload a STEP file to generate simulation data, graphs, coefficients, and report visuals.
                  </div>
                )}
              </section>
            </div>
          ) : (
            <RegulationsPanel checks={regChecks} setChecks={setRegChecks} />
          )}
        </div>
      </main>

      <BuddyPanel analysis={analysis} teamName={teamName} regSummary={regSummary} />

      <footer className="shrink-0 border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-[1600px] px-4 py-3 text-center text-sm font-medium text-slate-600">
          All rights reserved to SAHR Racing 2026
          <div className="mt-1 text-xs text-slate-500">
            Estimates only. Cross-check in ANSYS and final scrutineering. Tested multiple times during development.
          </div>
        </div>
      </footer>
    </div>
  );
}