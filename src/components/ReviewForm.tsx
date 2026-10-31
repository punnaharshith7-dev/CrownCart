import { useEffect, useRef, useState } from "react";
import { Button, TextArea, TextField } from "./ui";
import { api, errorMessage } from "../lib/api";
import { useToast } from "../lib/toast";

const MAX_PHOTOS = 5;
const MAX_BYTES = 8 << 20;

/** Thumbnails of a review's photos; each opens full size in a new tab. */
export function ReviewPhotos({ photos }: { photos?: string[] }) {
  if (!photos?.length) return null;
  return (
    <div className="review-photos">
      {photos.map((url, i) => (
        <a key={url} href={url} target="_blank" rel="noreferrer" aria-label={`Open customer photo ${i + 1}`}>
          <img src={url} alt={`Customer photo ${i + 1}`} loading="lazy" />
        </a>
      ))}
    </div>
  );
}

/** Star rating, with an optional headline, written review and photos. Only customers who received the product can send one. */
export function ReviewForm({ slug, onDone }: { slug: string; onDone: (rating: number) => void }) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [photos, setPhotos] = useState<{ file: File; preview: string }[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();
  const previews = useRef<string[]>([]);
  previews.current = photos.map((p) => p.preview);
  useEffect(() => () => previews.current.forEach((url) => URL.revokeObjectURL(url)), []);

  const addPhotos = (files: File[]) => {
    setError(null);
    const tooBig = files.some((f) => f.size > MAX_BYTES);
    if (tooBig) setError("Each photo can be up to 8 MB.");
    const room = MAX_PHOTOS - photos.length;
    const usable = files.filter((f) => f.size <= MAX_BYTES);
    if (usable.length > room) setError(`You can add up to ${MAX_PHOTOS} photos.`);
    setPhotos([...photos, ...usable.slice(0, room).map((file) => ({ file, preview: URL.createObjectURL(file) }))]);
  };

  return (
    <form
      className="stack card card-flat"
      onSubmit={async (e) => {
        e.preventDefault();
        if (!rating) return setError("Choose a star rating.");
        setBusy(true);
        setError(null);
        try {
          const form = new FormData();
          form.append("rating", String(rating));
          form.append("title", title);
          form.append("body", body);
          photos.forEach((p) => form.append("photos", p.file));
          await api.upload(`/catalog/products/${slug}/reviews`, form);
          toast("Thanks! Your review is live.", "success");
          onDone(rating);
        } catch (err) {
          setError(errorMessage(err));
        } finally {
          setBusy(false);
        }
      }}
    >
      <fieldset style={{ border: 0, padding: 0, margin: 0 }}>
        <legend className="label">Your rating</legend>
        <div className="row" role="radiogroup">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={rating === n}
              aria-label={`${n} star${n > 1 ? "s" : ""}`}
              className={`star-pick${n <= (hover || rating) ? " is-on" : ""}`}
              style={{ "--i": n } as React.CSSProperties}
              onPointerEnter={() => setHover(n)}
              onPointerLeave={() => setHover(0)}
              onClick={() => setRating(n)}
            >
              {/* Remounts when chosen, which replays the pop. */}
              <span key={n <= rating ? "on" : "off"} className={n <= rating ? "star-pick__pop" : undefined}>
                {n <= (hover || rating) ? "★" : "☆"}
              </span>
            </button>
          ))}
        </div>
      </fieldset>
      <TextField label="Headline (optional)" value={title} maxLength={120} onChange={(e) => setTitle(e.target.value)} />
      <TextArea label="Review (optional)" value={body} maxLength={4000} onChange={(e) => setBody(e.target.value)} hint="What did you like or dislike? How did you use it?" />
      <div>
        <span className="label">Photos (optional)</span>
        <div className="review-photos">
          {photos.map((p, i) => (
            <span key={p.preview} className="review-photos__pending">
              <img src={p.preview} alt={`Your photo ${i + 1}`} />
              <button
                type="button"
                aria-label={`Remove photo ${i + 1}`}
                onClick={() => {
                  URL.revokeObjectURL(p.preview);
                  setPhotos(photos.filter((x) => x !== p));
                }}
              >
                ×
              </button>
            </span>
          ))}
          {photos.length < MAX_PHOTOS && (
            <label className="review-photos__add">
              + Add
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                onChange={(e) => {
                  addPhotos(Array.from(e.target.files ?? []));
                  e.target.value = "";
                }}
              />
            </label>
          )}
        </div>
        <div className="tiny muted" style={{ marginTop: 6 }}>
          Up to {MAX_PHOTOS} photos. JPG, PNG or WebP, 8 MB each.
        </div>
      </div>
      {error && <div className="alert alert-danger">{error}</div>}
      <Button loading={busy} type="submit">
        Submit review
      </Button>
    </form>
  );
}
