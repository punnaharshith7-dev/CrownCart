export function pageScrollBehavior(): ScrollBehavior {
  return document.documentElement.dataset.motion === "reduced" ? "auto" : "smooth";
}
