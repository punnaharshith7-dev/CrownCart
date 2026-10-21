import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { api, errorMessage } from "../lib/api";
import { inr } from "../lib/format";
import type { Card } from "./ProductCard";

interface Msg {
  role: "user" | "assistant";
  content: string;
  products?: Card[];
  error?: boolean;
}

const KEY = "cc-assistant";
const load = (): Msg[] => {
  try {
    return JSON.parse(sessionStorage.getItem(KEY) ?? "[]");
  } catch {
    return [];
  }
};
const save = (m: Msg[]) => {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(m.slice(-20)));
  } catch {
    /* kept in memory for this page only */
  }
};

let available: Promise<boolean> | null = null;

const SUGGESTIONS = ["Show me sneakers under ₹20,000", "Which watch would you recommend?", "Compare your laptops", "What's new this week?"];

/** Floating AI shopping assistant. Hidden entirely when the server says it isn't configured. */
export function Assistant() {
  const [enabled, setEnabled] = useState(false);
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>(load);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const end = useRef<HTMLDivElement>(null);
  const field = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    (available ??= api.get<{ available: boolean }>("/assistant/status").then((r) => r.available).catch(() => false)).then(setEnabled);
  }, []);
  useEffect(() => {
    end.current?.scrollIntoView({ block: "end" });
    save(msgs);
  }, [msgs, open]);
  useEffect(() => {
    if (open) field.current?.focus();
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", esc);
    return () => document.removeEventListener("keydown", esc);
  }, [open]);

  if (!enabled) return null;

  const send = async (text: string) => {
    const q = text.trim();
    if (!q || busy) return;
    const next: Msg[] = [...msgs.filter((m) => !m.error), { role: "user", content: q }];
    setMsgs(next);
    setInput("");
    setBusy(true);
    try {
      const r = await api.post<{ reply: string; products: Card[] }>("/assistant/chat", {
        messages: next.slice(-20).map((m) => ({ role: m.role, content: m.content.slice(0, 2000) })),
      });
      setMsgs([...next, { role: "assistant", content: r.reply, products: r.products }]);
    } catch (e) {
      setMsgs([...next, { role: "assistant", content: errorMessage(e), error: true }]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      {!open && (
        <button type="button" className="btn assistant-fab" onClick={() => setOpen(true)} aria-haspopup="dialog">
          ✦ Ask CrownCart
        </button>
      )}
      {open && (
        <section className="assistant" role="dialog" aria-label="Shopping assistant">
          <header className="spread">
            <div>
              <strong>Shopping assistant</strong>
              <div className="tiny muted">AI-powered · answers from the live catalog</div>
            </div>
            <div className="row" style={{ "--gap": "4px" } as React.CSSProperties}>
              {msgs.length > 0 && (
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => setMsgs([])}>
                  Clear
                </button>
              )}
              <button type="button" className="icon-btn" aria-label="Close assistant" onClick={() => setOpen(false)}>
                ✕
              </button>
            </div>
          </header>
          <div className="assistant-body" aria-live="polite">
            {msgs.length === 0 && (
              <div className="stack" style={{ "--gap": "8px" } as React.CSSProperties}>
                <p className="small muted">Tell me what you're looking for — a budget, an occasion, a style — and I'll find it in the catalog.</p>
                {SUGGESTIONS.map((s) => (
                  <button key={s} type="button" className="chip" style={{ justifyContent: "flex-start" }} onClick={() => send(s)}>
                    {s}
                  </button>
                ))}
              </div>
            )}
            {msgs.map((m, i) => (
              <div key={i} className={`bubble ${m.role}${m.error ? " error" : ""}`}>
                <p style={{ whiteSpace: "pre-wrap" }}>{m.content}</p>
                {m.products && m.products.length > 0 && (
                  <div className="stack" style={{ "--gap": "6px", marginTop: 8 } as React.CSSProperties}>
                    {m.products.map((p) => (
                      <Link key={p.slug} to={`/product/${p.slug}`} className="assistant-card" onClick={() => setOpen(false)}>
                        {p.image && <img src={p.image} alt="" />}
                        <span style={{ flex: 1 }}>
                          <span className="small" style={{ fontWeight: 600 }}>
                            {p.name}
                          </span>
                          <br />
                          <span className="tiny muted">{p.inStock ? inr(p.pricePaise) : "Out of stock"}</span>
                        </span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {busy && <div className="bubble assistant small muted">Looking through the catalog…</div>}
            <div ref={end} />
          </div>
          <form className="assistant-input" onSubmit={(e) => (e.preventDefault(), send(input))}>
            <label className="sr-only" htmlFor="assistant-q">
              Ask the shopping assistant
            </label>
            <textarea
              id="assistant-q"
              ref={field}
              className="textarea"
              rows={1}
              maxLength={2000}
              placeholder="Ask about products…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send(input);
                }
              }}
            />
            <button type="submit" className="btn btn-sm" disabled={busy || !input.trim()}>
              Send
            </button>
          </form>
          <p className="tiny muted" style={{ padding: "0 14px 10px" }}>
            AI can make mistakes — check prices and details on the product page before you buy.
          </p>
        </section>
      )}
    </>
  );
}
