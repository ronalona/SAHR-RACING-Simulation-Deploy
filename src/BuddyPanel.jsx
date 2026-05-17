import { useState } from "react";

export default function BuddyPanel({ analysis, teamName, regSummary }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "Hey 👋 I’m Ashy. I can help with drag, lift, frontal area, and regulation checks.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  async function send() {
    const message = input.trim();
    if (!message) return;

    setMessages((prev) => [...prev, { role: "user", content: message }]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("http://localhost:3001/api/buddy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, context: { analysis, teamName, regSummary } }),
      });

      const data = await res.json();
      setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Buddy server is offline. Start the backend first." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed right-4 top-24 z-50 flex items-center gap-3 rounded-full border border-slate-200 bg-white px-4 py-3 shadow-xl"
      >
        <img src="ashy.png" alt="Ashy" className="h-10 w-10 rounded-full object-cover" />
        <span className="text-sm font-medium text-slate-800">Chat with Ashy for help</span>
      </button>
    );
  }

  return (
    <div className="fixed right-4 top-24 z-50 w-[360px] overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-2xl">
      <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
        <div className="flex items-center gap-3">
          <img src="ashy.png" alt="Ashy" className="h-10 w-10 rounded-full object-cover" />
          <div>
            <div className="text-sm font-semibold">Ashy</div>
            <div className="text-xs text-slate-500">SAHR Racing assistant</div>
          </div>
        </div>

        <button onClick={() => setOpen(false)} className="rounded-full border px-3 py-1 text-sm">
          X
        </button>
      </div>

      <div className="max-h-[360px] space-y-3 overflow-y-auto bg-slate-50 p-4">
        {messages.map((m, i) => (
          <div key={i} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
            <div
              className={`max-w-[85%] rounded-[1.25rem] px-4 py-3 text-sm leading-6 ${
                m.role === "user" ? "bg-[#2525bf] text-white" : "bg-white text-slate-700"
              }`}
            >
              {m.content}
            </div>
          </div>
        ))}
        {loading && <div className="text-sm text-slate-500">Thinking...</div>}
      </div>

      <div className="border-t p-4">
        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder="Ask Ashy"
            className="min-w-0 flex-1 rounded-full border px-4 py-3 text-sm outline-none"
          />
          <button onClick={send} className="rounded-full bg-[#2525bf] px-5 py-3 text-sm font-semibold text-white">
            Send
          </button>
        </div>
      </div>
    </div>
  );
}