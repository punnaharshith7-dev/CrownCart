const KEY = "cc-interests";

/** Product slugs this browser looked at recently, newest first. Used to personalise the sign-in scene. */
export function interests(): string[] {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    return Array.isArray(v) ? v.filter((s) => typeof s === "string").slice(0, 12) : [];
  } catch {
    return [];
  }
}

export function rememberInterest(slug: string) {
  try {
    localStorage.setItem(KEY, JSON.stringify([slug, ...interests().filter((s) => s !== slug)].slice(0, 12)));
  } catch {
    /* storage unavailable */
  }
}
