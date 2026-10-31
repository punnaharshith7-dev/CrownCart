/**
 * Which states a PIN code can belong to, from India Post's 3-digit sorting districts.
 * Deliberately lenient at shared borders (e.g. 500–535 Telangana/Andhra Pradesh) so real
 * addresses are never rejected; it exists to catch a PIN typed for the wrong state.
 * Shared by the browser (instant feedback) and the server (enforcement).
 */
const RANGES: [number, number, string[]][] = [
  [110, 110, ["Delhi"]],
  [121, 136, ["Haryana"]],
  [140, 160, ["Punjab"]],
  [160, 160, ["Chandigarh", "Haryana"]],
  [171, 177, ["Himachal Pradesh"]],
  [180, 194, ["Jammu and Kashmir"]],
  [194, 194, ["Ladakh"]],
  [201, 285, ["Uttar Pradesh"]],
  [244, 263, ["Uttarakhand"]],
  [301, 345, ["Rajasthan"]],
  [360, 396, ["Gujarat"]],
  [362, 362, ["Dadra and Nagar Haveli and Daman and Diu"]],
  [396, 396, ["Dadra and Nagar Haveli and Daman and Diu"]],
  [400, 445, ["Maharashtra"]],
  [403, 403, ["Goa"]],
  [450, 488, ["Madhya Pradesh"]],
  [490, 497, ["Chhattisgarh"]],
  [500, 535, ["Telangana", "Andhra Pradesh"]],
  [533, 533, ["Puducherry"]],
  [560, 591, ["Karnataka"]],
  [600, 643, ["Tamil Nadu"]],
  [605, 609, ["Puducherry"]],
  [670, 695, ["Kerala"]],
  [673, 673, ["Puducherry"]],
  [682, 682, ["Lakshadweep"]],
  [700, 743, ["West Bengal"]],
  [737, 737, ["Sikkim"]],
  [744, 744, ["Andaman and Nicobar Islands"]],
  [751, 770, ["Odisha"]],
  [781, 788, ["Assam"]],
  [790, 792, ["Arunachal Pradesh"]],
  [793, 794, ["Meghalaya"]],
  [795, 795, ["Manipur"]],
  [796, 796, ["Mizoram"]],
  [797, 798, ["Nagaland"]],
  [799, 799, ["Tripura"]],
  [800, 855, ["Bihar", "Jharkhand"]],
];

/** States a PIN code may belong to, or null when the range isn't known (then it isn't checked). */
export function statesForPincode(pincode: string): string[] | null {
  if (!/^[1-9]\d{5}$/.test(pincode)) return null;
  const p = Number(pincode.slice(0, 3));
  const states = RANGES.filter(([lo, hi]) => p >= lo && p <= hi).flatMap(([, , s]) => s);
  return states.length ? [...new Set(states)] : null;
}

/** An error message when the PIN code clearly belongs to another state, else null. */
export function pincodeStateError(pincode: string, state: string): string | null {
  const states = statesForPincode(pincode.trim());
  if (!states || !state.trim()) return null;
  if (states.some((s) => s.toLowerCase() === state.trim().toLowerCase())) return null;
  return `PIN code ${pincode.trim()} is in ${states.join(" / ")}, not ${state.trim()}. Check the PIN code or state.`;
}
