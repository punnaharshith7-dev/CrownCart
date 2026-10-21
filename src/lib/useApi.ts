import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "./api";

/** Loads `path` (re-loading when it changes). Pass null to skip. */
export function useApi<T>(path: string | null) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [loading, setLoading] = useState(Boolean(path));
  const seq = useRef(0);

  const load = useCallback(async () => {
    if (!path) return;
    const mine = ++seq.current;
    setLoading(true);
    setError(null);
    try {
      const r = await api.get<T>(path);
      if (mine === seq.current) setData(r);
    } catch (e) {
      if (mine === seq.current) setError(e);
    } finally {
      if (mine === seq.current) setLoading(false);
    }
  }, [path]);

  useEffect(() => {
    load();
  }, [load]);

  return { data, error, loading, reload: load, setData };
}

export function useTitle(title: string, opts: { noindex?: boolean; description?: string } = {}) {
  useEffect(() => {
    document.title = title ? `${title} · CrownCart` : "CrownCart | Beyond Ordinary";
    let robots = document.querySelector<HTMLMetaElement>('meta[name="robots"]');
    if (opts.noindex) {
      if (!robots) {
        robots = document.createElement("meta");
        robots.name = "robots";
        document.head.appendChild(robots);
      }
      robots.content = "noindex, nofollow";
    } else robots?.remove();
    if (opts.description) {
      let d = document.querySelector<HTMLMetaElement>('meta[name="description"]');
      if (!d) {
        d = document.createElement("meta");
        d.name = "description";
        document.head.appendChild(d);
      }
      d.content = opts.description;
    }
  }, [title, opts.noindex, opts.description]);
}
