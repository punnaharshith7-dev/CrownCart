import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { StoreLayout } from "../components/SiteHeader";
import { ProductCard, type Card } from "../components/ProductCard";
import { Empty } from "../components/ui";
import { isShopper, useAssistantAvailable } from "../components/Assistant";
import { api, errorMessage } from "../lib/api";
import { useAuth } from "../lib/auth";
import { useTitle } from "../lib/useApi";
import { BounceHeading } from "../components/BounceHeading";

interface Msg {
  role: "user" | "assistant";
  content: string;
  products?: Card[];
  error?: boolean;
}

// Chats are kept per account, so a different customer on the same browser never sees them.
const keyFor = (userId: number) => `cc-assistant-${userId}`;
const load = (userId: number): Msg[] => {
  try {
    return JSON.parse(sessionStorage.getItem(keyFor(userId)) ?? "[]");
  } catch {
    return [];
  }
};
const save = (userId: number, m: Msg[]) => {
  try {
    sessionStorage.setItem(keyFor(userId), JSON.stringify(m.slice(-20)));
  } catch {
    /* kept in memory for this page only */
  }
};

const SUGGESTIONS = [
  "Find me sneakers under ₹20,000",
  "A gift watch for my dad — what do you suggest?",
  "Where is my latest order?",
  "Can you deliver to my PIN code?",
  "Is my bag ready to check out?",
];

/** **bold** spans inside one line of a reply. */
function inline(text: string) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) => (part.startsWith("**") && part.endsWith("**") && part.length > 4 ? <strong key={i}>{part.slice(2, -2)}</strong> : part));
}

/** Renders the small slice of markdown the model uses (paragraphs, bullet lists, bold) as plain React elements. */
function Reply({ text }: { text: string }) {
  const blocks: { list: boolean; lines: string[] }[] = [];
  for (const raw of text.split("\n")) {
    const line = raw.trimEnd();
    if (!line.trim()) {
      blocks.push({ list: false, lines: [] });
      continue;
    }
    const bullet = /^\s*(?:[*•-]|\d+\.)\s+(.*)$/.exec(line);
    const last = blocks[blocks.length - 1];
    if (bullet) {
      if (last?.list) last.lines.push(bullet[1]);
      else blocks.push({ list: true, lines: [bullet[1]] });
    } else if (last && !last.list && last.lines.length) last.lines.push(line);
    else blocks.push({ list: false, lines: [line] });
  }
  return (
    <>
      {blocks
        .filter((b) => b.lines.length)
        .map((b, i) =>
          b.list ? (
            <ul key={i}>
              {b.lines.map((l, j) => (
                <li key={j}>{inline(l)}</li>
              ))}
            </ul>
          ) : (
            <p key={i}>
              {b.lines.map((l, j) => (
                <span key={j}>
                  {j > 0 && <br />}
                  {inline(l)}
                </span>
              ))}
            </p>
          ),
        )}
    </>
  );
}

/** Full-page AI assistant for customers: shopping picks, their bag, orders, tracking and delivery checks. */
export default function AssistantPage() {
  useTitle("AI assistant", { noindex: true });
  const { user } = useAuth();
  const available = useAssistantAvailable();

  if (!isShopper(user)) {
    return (
      <StoreLayout>
        <Empty title="For customer accounts" action={<Link className="btn btn-outline" to="/shop">Go to the shop</Link>}>
          The AI assistant helps customers shop and track deliveries. It isn't available for staff accounts.
        </Empty>
      </StoreLayout>
    );
  }
  return (
    <StoreLayout>
      {available ? (
        <Chat userId={user.id} firstName={user.name.split(" ")[0]} />
      ) : (
        <Empty title="The assistant is resting">The AI assistant isn't available right now. Please try again later, or browse the shop.</Empty>
      )}
    </StoreLayout>
  );
}

function Chat({ userId, firstName }: { userId: number; firstName: string }) {
  const [msgs, setMsgs] = useState<Msg[]>(() => load(userId));
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const end = useRef<HTMLDivElement>(null);
  const field = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    field.current?.focus();
  }, []);
  useEffect(() => {
    save(userId, msgs);
    if (msgs.length) end.current?.scrollIntoView({ block: "end", behavior: "smooth" });
  }, [msgs, busy, userId]);

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
      field.current?.focus();
    }
  };

  return (
    <div className="container ai-page">
      <header className="ai-head">
        <div>
          <div className="eyebrow">CrownCart AI</div>
          <BounceHeading className="display">{`Hi ${firstName}, what are you looking for?`}</BounceHeading>
          <p className="muted">Shopping picks for your budget and occasion, plus your bag, orders, tracking and delivery to your PIN code.</p>
        </div>
        {msgs.length > 0 && (
          <button type="button" className="btn btn-outline btn-sm" onClick={() => setMsgs([])} disabled={busy}>
            New chat
          </button>
        )}
      </header>

      <section className="ai-thread" aria-live="polite" aria-label="Conversation">
        {msgs.length === 0 && (
          <div className="ai-suggest">
            {SUGGESTIONS.map((s) => (
              <button key={s} type="button" className="chip" onClick={() => send(s)}>
                {s}
              </button>
            ))}
          </div>
        )}
        {msgs.map((m, i) => (
          <article key={i} className={`ai-msg ai-msg--${m.role}${m.error ? " ai-msg--error" : ""}`}>
            {m.role === "assistant" && !m.error ? <Reply text={m.content} /> : <p>{m.content}</p>}
            {m.products && m.products.length > 0 && (
              <div className="product-grid ai-results">
                {m.products.map((p) => (
                  <ProductCard key={p.slug} p={p} />
                ))}
              </div>
            )}
          </article>
        ))}
        {busy && (
          <div className="ai-msg ai-msg--assistant ai-msg--thinking">
            <span className="ai-dots" aria-hidden="true">
              <i />
              <i />
              <i />
            </span>
            Checking the catalog and your account…
          </div>
        )}
        <div ref={end} />
      </section>

      <form className="ai-input" onSubmit={(e) => (e.preventDefault(), send(input))}>
        <label className="sr-only" htmlFor="ai-q">
          Ask the assistant
        </label>
        <textarea
          id="ai-q"
          ref={field}
          className="textarea"
          rows={1}
          maxLength={2000}
          placeholder="Ask about products, orders or delivery…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send(input);
            }
          }}
        />
        <button type="submit" className="btn" disabled={busy || !input.trim()}>
          Send
        </button>
      </form>
      <p className="tiny muted ai-note">AI can make mistakes — check prices and details on the product page before you buy.</p>
    </div>
  );
}
