import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import data from "./data/items.json";

const { items, categories } = data;

const IMG_BASE =
  `${import.meta.env.BASE_URL.endsWith("/") ? import.meta.env.BASE_URL : import.meta.env.BASE_URL + "/"}img`;

function photoSrc(filename) {
  if (/^https?:\/\//i.test(filename)) return filename;
  return `${IMG_BASE}/${filename}`;
}

/**
 * When true, items without photos[0] never appear in the grid (see README /
 * .cursor/notes.md). Set false to show placeholder cards again.
 */
const OMIT_ITEMS_WITHOUT_FEATURED_PHOTO = true;

const FILTERS = [
  { value: "all", label: "All" },
  { value: "Furniture", label: "Furniture" },
  { value: "Storage", label: "Storage" },
  { value: "Electronics", label: "Electronics" },
  { value: "Kids", label: "Kids" },
  { value: "Decor", label: "Decor" },
  { value: "Outdoor", label: "Outdoor" },
];

/** Matches ItemCard: featured slot only when photos[0] is truthy */
function itemHasFeaturedPhoto(item) {
  const photos = Array.isArray(item.photos) ? item.photos : [];
  return Boolean(photos[0]);
}

function priceBadge(item) {
  if (item.reserved) return { text: "Reserved", cls: "badge-purple" };
  if (item.price === 0) return { text: "Free for you", cls: "badge-teal" };
  if (item.price == null) return { text: "TBD", cls: "badge-amber" };
  return { text: "$" + item.price, cls: "badge-green" };
}

function priceText(item) {
  if (item.price === 0) return "Free for you";
  if (item.price == null) return "TBD";
  return "$" + item.price;
}

/** Shorter, numbered list — best for SMS prefilled body */
function buildSmsBody(claimedItems) {
  const lines = claimedItems.map(
    (i, n) => `${n + 1}. ${i.name} (${priceText(i)})`
  );
  return [
    "Hi — I'm interested in these from your list:",
    "",
    ...lines,
    "",
    "Let me know about pickup. Thanks!",
  ].join("\n");
}

/**
 * Prefilled SMS bodies are inconsistent across OS/browser.
 * - iOS expects sms:&body=… (ampersand before body when there is no recipient).
 * - Others use sms:?body=…
 * - iPadOS Safari often reports as Macintosh + touch — treat as iOS-style.
 */
function smsHrefForBody(plainBody) {
  const body = encodeURIComponent(plainBody);
  const ua = typeof navigator !== "undefined" ? navigator.userAgent : "";
  const platform = typeof navigator !== "undefined" ? navigator.platform : "";
  const touches = typeof navigator !== "undefined" ? (navigator.maxTouchPoints ?? 0) : 0;
  const isIOSStyleSms =
    /iPad|iPhone|iPod/i.test(ua) ||
    (platform === "MacIntel" && touches > 1); // iPadOS 13+ “desktop” UA

  return isIOSStyleSms ? `sms:&body=${body}` : `sms:?body=${body}`;
}

export default function App() {
  const [activeFilter, setActiveFilter] = useState("all");
  const [claimed, setClaimed] = useState(() => new Set());

  const toggleClaim = (id) => {
    setClaimed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const visibleSections = useMemo(() => {
    const cats =
      activeFilter === "all"
        ? categories
        : categories.filter((c) => c.key === activeFilter);

    return cats
      .map(({ key, label }) => {
        let catItems = items
          .map((item, id) => ({ ...item, id }))
          .filter((i) => i.cat === key);
        if (OMIT_ITEMS_WITHOUT_FEATURED_PHOTO) {
          catItems = catItems.filter((i) => itemHasFeaturedPhoto(i));
        }
        return { key, label, items: catItems };
      })
      .filter((s) => s.items.length > 0);
  }, [activeFilter]);

  return (
    <div className="page">
      <Hero />

      <Toolbar activeFilter={activeFilter} onFilter={setActiveFilter} />

      {visibleSections.length === 0 ? (
        <p className="no-results" style={{ display: "block" }}>
          No items in this category.
        </p>
      ) : (
        visibleSections.map((section) => (
          <Section
            key={section.key}
            label={section.label}
            items={section.items}
            claimed={claimed}
            onClaim={toggleClaim}
          />
        ))
      )}

      <Footer />
      <SendBar claimed={claimed} onClear={() => setClaimed(new Set())} />
    </div>
  );
}

function copyTextToClipboard(text) {
  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    return navigator.clipboard.writeText(text);
  }
  return Promise.reject(new Error("no clipboard API"));
}

function fallbackCopyText(text) {
  const ta = document.createElement("textarea");
  ta.value = text;
  ta.setAttribute("readonly", "");
  ta.style.position = "fixed";
  ta.style.left = "-9999px";
  document.body.appendChild(ta);
  ta.select();
  try {
    document.execCommand("copy");
  } finally {
    document.body.removeChild(ta);
  }
}

function SendBar({ claimed, onClear }) {
  const [copied, setCopied] = useState(false);
  const claimedItems = useMemo(
    () => [...claimed].map((id) => items[id]).filter(Boolean),
    [claimed]
  );

  if (claimedItems.length === 0) return null;

  const body = buildSmsBody(claimedItems);
  const sms = smsHrefForBody(body);

  const onCopyList = () => {
    copyTextToClipboard(body)
      .then(() => {
        setCopied(true);
        window.setTimeout(() => setCopied(false), 2000);
      })
      .catch(() => {
        try {
          fallbackCopyText(body);
          setCopied(true);
          window.setTimeout(() => setCopied(false), 2000);
        } catch {
          window.alert("Could not copy — try Text list instead.");
        }
      });
  };

  return (
    <div className="sendbar">
      <div className="sendbar-inner">
        <div className="sendbar-summary">
          <span className="sendbar-count">
            {claimedItems.length} item{claimedItems.length !== 1 ? "s" : ""} on your list
          </span>
          <button type="button" className="sendbar-clear" onClick={onClear}>
            Clear list
          </button>
        </div>
        <div className="sendbar-actions">
          <button
            type="button"
            className={`send-btn send-btn-secondary${copied ? " is-copied" : ""}`}
            onClick={onCopyList}
          >
            {copied ? "Copied!" : "Copy list"}
          </button>
          <a className="send-btn send-btn-primary" href={sms}>
            Text list
          </a>
        </div>
        <p className="sendbar-hint">
          Nothing is held until you message me. Everything on your list goes in one text — copy and
          paste, or use Text list.
        </p>
      </div>
    </div>
  );
}

function Hero() {
  return (
    <div className="hero">
      <p className="hero-eyebrow">May 2026</p>
      <h1>Do you want any of this before I sell/donate?</h1>
      <p className="hero-body">
        Tap <strong>Add to my list</strong> on anything you want. When you’re ready, use{" "}
        <strong>Copy list</strong> and paste into your text to me — or tap{" "}
        <strong>Text list</strong> to open Messages with the same list. 
      </p>
    </div>
  );
}

function Toolbar({ activeFilter, onFilter }) {
  return (
    <div className="toolbar">
      {FILTERS.map((f) => (
        <button
          key={f.value}
          className={`filter-btn${activeFilter === f.value ? " active" : ""}`}
          onClick={() => onFilter(f.value)}
        >
          {f.label}
        </button>
      ))}
    </div>
  );
}

function Section({ label, items, claimed, onClaim }) {
  return (
    <div className="section">
      <div className="section-header">
        <span className="section-title">{label}</span>
        <span className="section-count">
          {items.length} item{items.length !== 1 ? "s" : ""}
        </span>
      </div>
      <div className="items-grid">
        {items.map((item) => (
          <ItemCard
            key={item.id}
            item={item}
            isClaimed={claimed.has(item.id)}
            onClaim={() => onClaim(item.id)}
          />
        ))}
      </div>
    </div>
  );
}

function ItemCard({ item, isClaimed, onClaim }) {
  const { text, cls } = priceBadge(item);
  const photos = Array.isArray(item.photos) ? item.photos : [];
  const hasFeaturedPhoto = itemHasFeaturedPhoto(item);
  const classes = [
    "item-card",
    hasFeaturedPhoto ? "has-photo" : "has-photo-placeholder",
    isClaimed ? "is-claimed" : "",
    item.reserved ? "is-reserved" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={classes}>
      {hasFeaturedPhoto ? (
        <ItemPhotos caption={item.name} photos={photos} />
      ) : (
        <div className="item-photo-placeholder" aria-hidden="true">
          No photo
        </div>
      )}
      <div className="item-top">
        <span className="item-name">{item.name}</span>
        <span className={`badge ${cls}`}>{text}</span>
      </div>
      {item.note && <p className="item-note">{item.note}</p>}
      {item.link && (
        <a className="item-link" href={item.link} target="_blank" rel="noreferrer">
          View original listing ↗
        </a>
      )}
      {!item.reserved && (
        <button
          type="button"
          className={`claim-btn${isClaimed ? " active" : ""}`}
          onClick={onClaim}
          aria-pressed={isClaimed}
        >
          {isClaimed ? "✓ On my list" : "Add to my list"}
        </button>
      )}
      {item.reserved && item.reserveMessage && (
        <p className="reserved-msg" role="status">
          {item.reserveMessage}
        </p>
      )}
    </div>
  );
}

function ImageLightbox({ photos, index, caption, onClose, setActiveIndex }) {
  const safe = Math.min(Math.max(0, index), photos.length - 1);
  const src = photoSrc(photos[safe]);
  const alt = caption ? `${caption} — photo ${safe + 1}` : `Photo ${safe + 1}`;

  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, []);

  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }
      if (photos.length <= 1) return;
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        setActiveIndex((i) => (i - 1 + photos.length) % photos.length);
      }
      if (e.key === "ArrowRight") {
        e.preventDefault();
        setActiveIndex((i) => (i + 1) % photos.length);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [photos.length, onClose, setActiveIndex]);

  return createPortal(
    <div
      className="lightbox-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label="Enlarged photo"
      onClick={onClose}
    >
      <div className="lightbox-panel" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          className="lightbox-close"
          onClick={onClose}
          aria-label="Close enlarged view"
        >
          Close
        </button>
        {photos.length > 1 && (
          <>
            <button
              type="button"
              className="lightbox-nav lightbox-prev"
              onClick={() =>
                setActiveIndex((i) => (i - 1 + photos.length) % photos.length)
              }
              aria-label="Previous photo"
            >
              ‹
            </button>
            <button
              type="button"
              className="lightbox-nav lightbox-next"
              onClick={() => setActiveIndex((i) => (i + 1) % photos.length)}
              aria-label="Next photo"
            >
              ›
            </button>
          </>
        )}
        <img src={src} alt={alt} className="lightbox-img" />
        <div className="lightbox-footer">
          {caption ? <p className="lightbox-caption">{caption}</p> : null}
          {photos.length > 1 ? (
            <p className="lightbox-counter" aria-live="polite">
              {safe + 1} / {photos.length}
            </p>
          ) : null}
        </div>
      </div>
    </div>,
    document.body
  );
}

function ItemPhotos({ photos, caption }) {
  const [active, setActive] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const safe = Math.min(active, photos.length - 1);

  return (
    <div className="item-photo-block">
      <div className="item-photo-main">
        <button
          type="button"
          className="item-photo-enlarge"
          onClick={() => setLightboxOpen(true)}
          aria-label={
            caption ? `View enlarged: ${caption}` : "View enlarged photo"
          }
        >
          <img
            src={photoSrc(photos[safe])}
            alt={caption ? `${caption} — photo ${safe + 1}` : `Photo ${safe + 1}`}
            loading="lazy"
            decoding="async"
            className="item-photo-img"
          />
          <span className="item-photo-enlarge-hint" aria-hidden="true">
            Enlarge
          </span>
        </button>
      </div>
      {photos.length > 1 && (
        <div className="item-photo-thumbs" role="toolbar" aria-label="More photos">
          {photos.map((file, i) => (
            <button
              key={file}
              type="button"
              className={`item-photo-thumb${i === safe ? " is-active" : ""}`}
              onClick={() => setActive(i)}
              aria-label={`Photo ${i + 1}`}
              aria-pressed={i === safe}
            >
              <img src={photoSrc(file)} alt="" loading="lazy" decoding="async" />
            </button>
          ))}
        </div>
      )}
      {lightboxOpen && (
        <ImageLightbox
          photos={photos}
          index={safe}
          caption={caption}
          onClose={() => setLightboxOpen(false)}
          setActiveIndex={setActive}
        />
      )}
    </div>
  );
}

function Footer() {
  return (
    <div className="footer">
      <p>TV is not available — promised to Melissa. Chabudai is being kept.</p>
      <p>Last updated May 2026.</p>
    </div>
  );
}
