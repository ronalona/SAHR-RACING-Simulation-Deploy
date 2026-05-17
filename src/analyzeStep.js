function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function parsePoints(text) {
  const points = [];
  const seen = new Set();

  const regex =
    /CARTESIAN_POINT\s*\(\s*'[^']*'\s*,\s*\(\s*([+-]?\d*\.?\d+(?:[Ee][+-]?\d+)?)\s*,\s*([+-]?\d*\.?\d+(?:[Ee][+-]?\d+)?)\s*,\s*([+-]?\d*\.?\d+(?:[Ee][+-]?\d+)?)\s*\)\s*\)/gi;

  let match;
  while ((match = regex.exec(text)) !== null) {
    const p = match.slice(1, 4).map(Number);
    const key = p.join(",");
    if (!seen.has(key) && p.every(Number.isFinite)) {
      seen.add(key);
      points.push(p);
    }
  }

  return points;
}

export function analyzeStep(text) {
  const raw = parsePoints(text);

  if (!raw.length) {
    throw new Error("No usable STEP geometry found.");
  }

  const xs = raw.map((p) => p[0]);
  const ys = raw.map((p) => p[1]);
  const zs = raw.map((p) => p[2]);

  const rawExtents = [
    Math.max(...xs) - Math.min(...xs),
    Math.max(...ys) - Math.min(...ys),
    Math.max(...zs) - Math.min(...zs),
  ];

  const maxRaw = Math.max(...rawExtents);

  // STEP files are usually mm. If the largest dimension is over 1, assume mm.
  const scale = maxRaw > 1 ? 0.001 : 1;

  const extents = rawExtents.map((v) => v * scale).sort((a, b) => b - a);

  let length = extents[0];
  let width = extents[1];
  let height = extents[2];

  // Hard STEM Racing sanity clamp.
  // Stops garbage outputs if STEP coordinates are parsed/scaled badly.
  length = clamp(length, 0.12, 0.22);
  width = clamp(width, 0.03, 0.085);
  height = clamp(height, 0.015, 0.065);

  // Realistic projected frontal area estimate, not full rectangle.
  const frontalArea = clamp(width * height * 0.28, 0.00025, 0.002);

  const rho = 1.225;
  const velocity = 20;
  const q = 0.5 * rho * velocity * velocity;

  const slenderness = length / Math.max(height, 1e-6);

  const cd = clamp(0.22 + 0.08 * (1 / slenderness) + 0.04 * (height / width), 0.18, 0.38);
  const cl = clamp(-0.015 + 0.02 * (height / width), -0.04, 0.05);

  const dragN = q * cd * frontalArea;
  const liftN = q * cl * frontalArea;

  return {
    dimensions: { length, width, height },
    areas: { frontalArea },
    aero: { dragN, liftN, cd, cl },
  };
}