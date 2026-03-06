import { FormEvent, useMemo, useState } from "react";
import {
  askAiQuestion,
  fetchAiDailySummary,
  fetchAiStockAlert,
} from "../services/api";

type ChatRole = "assistant" | "user";

type ChatMessage = {
  id: string;
  role: ChatRole;
  text: string;
};

export default function AiInsights() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      text: "Hello Admin 👋 I can analyze coffee performance. Ask me anything or use quick actions below.",
    },
  ]);

  const quickActionsDisabled = useMemo(() => loading, [loading]);

  function appendMessage(role: ChatRole, text: string) {
    setMessages((prev) => [
      ...prev,
      {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        role,
        text,
      },
    ]);
  }

  async function runDailySummary() {
    appendMessage("user", "Get daily summary");
    try {
      setLoading(true);
      const data = await fetchAiDailySummary();
      appendMessage("assistant", data.analysis || "No analysis returned.");
    } catch (err) {
      appendMessage(
        "assistant",
        err instanceof Error ? err.message : "Failed to fetch AI daily summary",
      );
    } finally {
      setLoading(false);
    }
  }

  async function runStockAlert() {
    appendMessage("user", "Analyze stock alert");
    try {
      setLoading(true);
      const data = await fetchAiStockAlert();
      appendMessage("assistant", data.analysis || "No stock advice returned.");
    } catch (err) {
      appendMessage(
        "assistant",
        err instanceof Error ? err.message : "Failed to fetch AI stock alert",
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleAsk(event: FormEvent) {
    event.preventDefault();
    const trimmed = input.trim();
    if (!trimmed) {
      return;
    }

    appendMessage("user", trimmed);
    setInput("");

    try {
      setLoading(true);
      const data = await askAiQuestion(trimmed);
      appendMessage("assistant", data.answer || "No answer returned.");
    } catch (err) {
      appendMessage(
        "assistant",
        err instanceof Error ? err.message : "Failed to ask AI",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="fixed bottom-6 right-6 z-40">
        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          className="rounded-full bg-[#4B2E2B] px-5 py-3 text-sm font-semibold text-white shadow-lg hover:bg-[#5B3E3B]"
        >
          {open ? "Close AI Chat" : "Open AI Chat"}
        </button>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-end bg-black/20 p-4 md:items-center md:justify-center">
          <div className="flex h-[78vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-[#EAD6C0] bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-[#EAD6C0] px-4 py-3">
              <div>
                <h3 className="text-base font-semibold text-[#4B2E2B]">
                  AI Analyst Chat
                </h3>
                <p className="text-xs text-[#7C5D58]">
                  Admin-only coffee performance assistant
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-md border border-[#EAD6C0] px-2 py-1 text-xs text-[#4B2E2B] hover:bg-[#FFF8F0]"
              >
                Close
              </button>
            </div>

            <div className="flex flex-wrap gap-2 border-b border-[#F1E3D3] px-4 py-3">
              <button
                type="button"
                onClick={runDailySummary}
                disabled={quickActionsDisabled}
                className="rounded-lg bg-[#4B2E2B] px-3 py-2 text-xs font-medium text-white hover:bg-[#5B3E3B] disabled:opacity-60"
              >
                Daily Summary
              </button>
              <button
                type="button"
                onClick={runStockAlert}
                disabled={quickActionsDisabled}
                className="rounded-lg border border-[#D8C2AC] bg-[#FFF8F0] px-3 py-2 text-xs font-medium text-[#4B2E2B] hover:bg-[#F7EBDD] disabled:opacity-60"
              >
                Stock Alert
              </button>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto bg-[#FFF8F0] px-4 py-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap ${
                      message.role === "user"
                        ? "bg-[#4B2E2B] text-white"
                        : "border border-[#EAD6C0] bg-white text-[#4B2E2B]"
                    }`}
                  >
                    {message.text}
                  </div>
                </div>
              ))}

              {loading && (
                <div className="flex justify-start">
                  <div className="rounded-2xl border border-[#EAD6C0] bg-white px-3 py-2 text-sm text-[#7C5D58]">
                    AI is thinking...
                  </div>
                </div>
              )}
            </div>

            <form
              onSubmit={handleAsk}
              className="flex gap-2 border-t border-[#EAD6C0] px-4 py-3"
            >
              <input
                className="flex-1 rounded-lg border border-[#EAD6C0] px-3 py-2 text-sm text-[#4B2E2B] outline-none focus:border-[#B28A6E]"
                placeholder="Ask AI about your coffee shop..."
                value={input}
                onChange={(event) => setInput(event.target.value)}
              />
              <button
                type="submit"
                disabled={loading}
                className="rounded-lg bg-[#8B5E57] px-4 py-2 text-sm font-medium text-white hover:bg-[#7D5049] disabled:opacity-60"
              >
                Send
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
