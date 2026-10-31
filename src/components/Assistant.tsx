import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import { api } from "../lib/api";
import { useAuth, type Me } from "../lib/auth";

/*
 * The AI shopping and delivery assistant is for customer accounts only. Staff accounts
 * (admins, store owners, delivery partners) also hold the customer role, so they're
 * excluded explicitly; the server enforces the same rule. The chat itself lives on its
 * own page (src/pages/AssistantPage.tsx), opened from the header button.
 */

export const isShopper = (user: Me | null | undefined): user is Me =>
  Boolean(user && user.roles.includes("customer") && user.roles.every((r) => r === "customer") && !user.stores.length);

const status = new Map<number, Promise<boolean>>();

/** Whether the signed-in customer can use the assistant (configured on the server and switched on). */
export function useAssistantAvailable() {
  const { user } = useAuth();
  const userId = isShopper(user) ? user.id : undefined;
  const [available, setAvailable] = useState(false);
  useEffect(() => {
    if (userId == null) {
      setAvailable(false);
      return;
    }
    let live = true;
    if (!status.has(userId))
      status.set(
        userId,
        api
          .get<{ available: boolean }>("/assistant/status")
          .then((r) => r.available)
          .catch(() => false),
      );
    status.get(userId)!.then((on) => live && setAvailable(on));
    return () => {
      live = false;
    };
  }, [userId]);
  return available;
}

function SparkIcon() {
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 3.5l1.9 5.1 5.1 1.9-5.1 1.9L12 17.5l-1.9-5.1L5 10.5l5.1-1.9L12 3.5Z" />
      <path d="M18.5 15.5l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8.8-2Z" />
    </svg>
  );
}

/** Header button next to the bag and profile icons; only rendered for customers when the assistant is available. */
export function AssistantHeaderButton() {
  const available = useAssistantAvailable();
  if (!available) return null;
  return (
    <NavLink to="/assistant" className={({ isActive }) => `icon-btn assistant-btn${isActive ? " is-active" : ""}`} aria-label="AI shopping assistant" title="Ask CrownCart AI">
      <SparkIcon />
    </NavLink>
  );
}
