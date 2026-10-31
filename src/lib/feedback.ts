/*
 * Optional touch of feedback when something goes in the bag: a soft click and, on phones, a short
 * vibration. Off unless the customer turns it on in their account settings. The click is synthesised,
 * so there's no audio file to load.
 */

const KEY = "cc-feedback";
let audio: AudioContext | null = null;

export function feedbackEnabled() {
  try {
    return localStorage.getItem(KEY) === "on";
  } catch {
    return false;
  }
}

export function setFeedbackEnabled(on: boolean) {
  try {
    localStorage.setItem(KEY, on ? "on" : "off");
  } catch {
    /* storage unavailable: stays off */
  }
  if (on) playFeedback();
}

export function playFeedback() {
  if (!feedbackEnabled()) return;
  navigator.vibrate?.(12);
  try {
    audio ??= new AudioContext();
    void audio.resume();
    const t = audio.currentTime;
    const gain = audio.createGain();
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.09, t + 0.006);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.09);
    gain.connect(audio.destination);
    const tone = audio.createOscillator();
    tone.type = "sine";
    tone.frequency.setValueAtTime(1250, t);
    tone.frequency.exponentialRampToValueAtTime(640, t + 0.08);
    tone.connect(gain);
    tone.start(t);
    tone.stop(t + 0.1);
  } catch {
    /* no audio available: the vibration, if any, is enough */
  }
}
