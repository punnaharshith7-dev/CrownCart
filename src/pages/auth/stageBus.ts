/** Events between the sign-in card and the 3D scene: "quake" (wrong password), "burst" (signed in), "interests" (detail: count). */
export const stageBus = new EventTarget();
export const emitStage = (type: "quake" | "burst" | "interests", detail?: unknown) => stageBus.dispatchEvent(new CustomEvent(type, { detail }));

export type Phase = "dawn" | "day" | "dusk" | "night";

export function phaseFor(hour = new Date().getHours()): Phase {
  if (hour >= 5 && hour < 8) return "dawn";
  if (hour >= 8 && hour < 17) return "day";
  if (hour >= 17 && hour < 20) return "dusk";
  return "night";
}

export function greeting(hour = new Date().getHours()) {
  if (hour < 4) return "Up late? Welcome back";
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

/** Light colours for the 3D scene in each part of the day. */
export const PHASE_LIGHTS: Record<Phase, { key: string; keyIntensity: number; warm: string; cool: string; ambient: number }> = {
  dawn: { key: "#ffd9c2", keyIntensity: 2.1, warm: "#ff9a7a", cool: "#b9a8ff", ambient: 0.4 },
  day: { key: "#ffffff", keyIntensity: 2.6, warm: "#ffe2a8", cool: "#9fd4ff", ambient: 0.55 },
  dusk: { key: "#ffd08a", keyIntensity: 2.2, warm: "#ff8c3a", cool: "#c48bff", ambient: 0.35 },
  night: { key: "#c9d6ff", keyIntensity: 1.7, warm: "#e8c07d", cool: "#6f8cff", ambient: 0.28 },
};
