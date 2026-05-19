
const path = require("path");
require("dotenv").config();

const express = require("express");
const cors = require("cors");

let OpenAI = null;
try {
  OpenAI = require("openai");
} catch {
  OpenAI = null;
}

const app = express();
app.use(cors());
app.use(express.json({ limit: "2mb" }));

const client =
  process.env.OPENAI_API_KEY && OpenAI
    ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
    : null;

function isInappropriate(message) {
  const text = (message || "").toLowerCase();

  const blocked = [
    "kill",
    "bomb",
    "weapon",
    "gun",
    "hack",
    "steal",
    "drugs",
    "porn",
    "sex",
    "suicide",
    "self harm",
    "racist",
    "terrorist",
    "illegal",
  ];

  return blocked.some((word) => text.includes(word));
}

function localReply(message, context) {
  const text = (message || "").toLowerCase();
  const analysis = context?.analysis;
  const regSummary = context?.regSummary;

  if (text.includes("hello") || text.includes("hi") || text.includes("hey")) {
    return "I’m Ashy the mascot of SAHR Racing I was born from the heat pressure and energy behind the team I represent the chaos of racing the spark of new ideas and the determination it takes to keep testing failing improving and coming back stronger My orange design is not random It connects to SAHR Racing’s identity and represents speed creativity and controlled aggression I may look playful but my purpose is serious I help make the team more recognisable memorable and engaging I became the voice of SAHR Racing across digital media branding merchandise and pit display ideas Instead of only showing the technical side of the team I help people connect with our story in a more fun and human way I am here to bring engineering and entertainment together I represent what SAHR Racing stands for fast thinking bold ideas and constant development under pressure";
  }

  if (text.includes("story") || text.includes("who are you")) {
    return "I’m Ashy — SAHR Racing’s side assistant. I was imagined as a friendly helper beside the simulation so the website feels alive, easier to use, and more connected to the team.";
  }

  if (text.includes("lift") || text.includes("downforce")) {
    return "To increase downforce, add controlled negative lift: slightly increase rear wing angle, use a cleaner rear wing profile, lower the body height where legal, and avoid large flat upper surfaces. Don’t overdo it — too much downforce increases drag.";
  }

  if (text.includes("drag")) {
    return "To reduce drag, reduce frontal area, smooth the nose, avoid sharp exposed edges, clean up wheel supports, and keep wings thin. The best setup is low drag with stable lift, not maximum downforce.";
  }

  if (text.includes("frontal") || text.includes("area")) {
    return "Frontal area is the projected front profile of the car. Lower frontal area usually reduces drag, but it still has to stay legal and manufacturable.";
  }

  if (text.includes("regulation") || text.includes("rules") || text.includes("checklist")) {
    return `The regulation checklist is currently ${regSummary?.checkedCount ?? 0}/${regSummary?.totalCount ?? 0} checked. Go item by item and only tick rules you have actually verified.`;
  }

  const allowed = [
    "sahr",
    "stem",
    "racing",
    "car",
    "drag",
    "lift",
    "frontal",
    "area",
    "regulation",
    "portfolio",
    "report",
    "ansys",
    "fusion",
    "cfd",
    "step",
    "wing",
    "wheel",
    "aero",
    "simulation",
    "design",
    "manufacturing",
    "testing",
  ];

  if (!allowed.some((word) => text.includes(word))) {
    return "Sorry, I can only help with SAHR Racing and STEM Racing related topics.";
  }

  if (!analysis) {
    return "Upload a STEP file and I’ll help read the drag, lift, frontal area, and checklist status.";
  }

  return `Current estimate: drag ${analysis.aero.dragN.toFixed(3)} N, lift ${analysis.aero.liftN.toFixed(3)} N, frontal area ${analysis.areas.frontalArea.toFixed(6)} m². Checklist: ${regSummary?.checkedCount ?? 0}/${regSummary?.totalCount ?? 0}.`;
}

app.get("/health", (_, res) => {
  res.json({ ok: true });
});

app.post("/api/buddy", async (req, res) => {
  const { message = "", context = {} } = req.body || {};

  if (isInappropriate(message)) {
    return res.json({
      reply:
        "Sorry, I can’t help with that request. I can help with SAHR Racing, STEM Racing, simulations, drag, lift, frontal area, regulations, and reports.",
      mode: "blocked",
    });
  }

  if (!client) {
    return res.json({
      reply: localReply(message, context),
      mode: "local",
    });
  }

  try {
    const input = `
You are Ashy, SAHR Racing's friendly assistant.

Tone:
- Friendly
- Helpful
- Clear
- Slightly talkative when useful
- Never rude or cold

Scope:
- Only help with SAHR Racing, STEM Racing, car design, simulations, drag, lift, frontal area, regulations, reports, Fusion, ANSYS, CFD, manufacturing, testing, and portfolio-related work.
- Do not help with inappropriate, unsafe, illegal, sexual, hateful, violent, or harmful requests.
- If the user asks for something outside scope, politely redirect them to SAHR Racing/STEM Racing topics.
- Do not claim the website is full CFD.
- Explain that results are estimates and ANSYS validation is recommended when relevant.

Context:
${JSON.stringify(context, null, 2)}

User:
${message}
`;

    const response = await client.responses.create({
      model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
      input,
    });

    return res.json({
      reply: response.output_text || localReply(message, context),
      mode: "openai",
    });
  } catch {
    return res.json({
      reply: localReply(message, context),
      mode: "fallback",
    });
  }
});
 app.use(express.static(path.join(__dirname, "dist")));

app.use((req, res) => {
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});
app.listen(3001, () => {
  console.log("Buddy server running on http://localhost:3001");
});
