import { useEffect, useRef, type ReactNode } from "react";

/**
 * A panel that slides in from the right over a dimmed backdrop (Quick view, the bag drawer).
 * Escape, the ✕ button or a click on the backdrop closes it; focus moves into it on open and
 * page scrolling is paused while it's open.
 */
export function SidePanel({ open, onClose, title, children, footer, wide = false }: { open: boolean; onClose: () => void; title: string; children: ReactNode; footer?: ReactNode; wide?: boolean }) {
  const panel = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement as HTMLElement | null;
    panel.current?.focus();
    const esc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", esc);
    const { overflow } = document.documentElement.style;
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", esc);
      document.documentElement.style.overflow = overflow;
      prev?.focus?.();
    };
  }, [open, onClose]);

  return (
    <div className={`side-panel${open ? " is-open" : ""}`} aria-hidden={!open} data-lenis-prevent>
      <div className="side-panel__backdrop" onClick={onClose} />
      <section ref={panel} className={`side-panel__sheet${wide ? " side-panel__sheet--wide" : ""}`} role="dialog" aria-modal="true" aria-label={title} tabIndex={-1}>
        <header className="side-panel__head">
          <strong>{title}</strong>
          <button type="button" className="icon-btn" aria-label="Close" onClick={onClose}>
            ✕
          </button>
        </header>
        <div className="side-panel__body">{open && children}</div>
        {open && footer && <footer className="side-panel__foot">{footer}</footer>}
      </section>
    </div>
  );
}
