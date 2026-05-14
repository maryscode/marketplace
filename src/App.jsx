import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import data from "./data/items.json";

const { items, categories } = data;

const CONTACT = {
  email: "maryschan@gmail.com",
  phone: "+19297770620",
};

const IMG_BASE =
  `${import.meta.env.BASE_URL.endsWith("/") ? import.meta.env.BASE_URL : import.meta.env.BASE_URL + "/"}img`;

function photoSrc(filename) {
  if (/^https?:\/\//i.test(filename)) return filename;
  return `${IMG_BASE}/${filename}`;
}

const FILTERS = [
  { value: "all", label: "All" },
  { value: "Furniture", label: "Furniture" },
  { value: "Storage", label: "Storage" },
  { value: "Electronics", label: "Electronics" },
  { value: "Kids", label: "Kids" },
  { value: "Decor", label: "Decor" },
  { value: "Outdoor", label: "Outdoor" },
  { value: "free", label: "Free only" },
  { value: "noPhoto", label: "No photo (temp)" },
];

/** Matches ItemCard: featured slot only when photos[0] is truthy */
function itemHasFeaturedPhoto(item) {
  const photos = Array.isArray(item.photos) ? item.photos : [];
  return Boolean(photos[0]);
}

function priceBadge(item) {
  if (item.reserved) return { text: "Reserved", cls: "badge-purple" };
  if (item.price === 0) return { text: "Free", cls: "badge-teal" };
  if (item.price == null) return { text: "TBD", cls: "badge-amber" };
  return { text: "$" + item.price, cls: "badge-green" };
}

function priceText(item) {
  if (item.price === 0) return "Free";
  if (item.price == null) return "TBD";
  return "$" + item.price;
}

function buildMessage(claimedItems) {
  const lines = claimedItems.map((i) => `- ${i.name} (${priceText(i)})`);
  return [
    "Hi Mary! From your moving sale page, I'd like to claim:",
    "",
    ...lines,
    "",
    "Let me know when works for pickup. Thanks!",
  ].join("\n");
}

/** Shorter, numbered list — best for SMS prefilled body */
function buildSmsBody(claimedItems) {
  const lines = claimedItems.map(
    (i, n) => `${n + 1}. ${i.name} (${priceText(i)})`
  );
  return [
    "Hi Mary — from your list I want:",
    "",
    ...lines,
    "",
    "Let me know about pickup. Thanks!",
  ].join("\n");
}

function smsHrefForBody(plainBody) {
  const encoded = encodeURIComponent(plainBody);
  const phone = CONTACT.phone?.trim();

  if (typeof navigator !== "undefined" && /iPad|iPhone|iPod/.test(navigator.userAgent)) {
    if (phone) return `sms:${phone}&body=${encoded}`;
    return `sms:&body=${encoded}`;
  }

  if (phone) return `sms:${phone}?body=${encoded}`;
  return `sms:?body=${encoded}`;
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
      activeFilter === "all" || activeFilter === "free" || activeFilter === "noPhoto"
        ? categories
        : categories.filter((c) => c.key === activeFilter);

    return cats
      .map(({ key, label }) => {
        let catItems = items
          .map((item, id) => ({ ...item, id }))
          .filter((i) => i.cat === key);
        if (activeFilter === "free") catItems = catItems.filter((i) => i.price === 0);
        if (activeFilter === "noPhoto") catItems = catItems.filter((i) => !itemHasFeaturedPhoto(i));
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

function SendBar({ claimed, onClear }) {
  const claimedItems = useMemo(
    () => [...claimed].map((id) => items[id]).filter(Boolean),
    [claimed]
  );

  if (claimedItems.length === 0) return null;

  const subject = encodeURIComponent("Moving sale — items I'd like to claim");
  const emailBody = encodeURIComponent(buildMessage(claimedItems));
  const mailto = `mailto:${CONTACT.email}?subject=${subject}&body=${emailBody}`;
  const sms = smsHrefForBody(buildSmsBody(claimedItems));

  return (
    <div className="sendbar">
      <div className="sendbar-inner">
        <div className="sendbar-summary">
          <span className="sendbar-count">
            {claimedItems.length} item{claimedItems.length !== 1 ? "s" : ""} claimed
          </span>
          <button className="sendbar-clear" onClick={onClear}>
            Clear
          </button>
        </div>
        <div className="sendbar-actions">
          <a className="send-btn send-btn-secondary" href={sms}>
            Text Mary list of items
          </a>
          <a className="send-btn send-btn-primary" href={mailto}>
            Email Mary
          </a>
        </div>
      </div>
    </div>
  );
}

function Hero() {
  return (
    <div className="hero">
      <p className="hero-eyebrow">May 2026</p>
      <h1>
        Mary's Free Stuff
      </h1>
      <p className="hero-body">
        Do you guys want any of this stuff before I sell it?
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
          className={`claim-btn${isClaimed ? " active" : ""}`}
          onClick={onClaim}
        >
          {isClaimed ? "✓ I want this!" : "I want this"}
        </button>
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
