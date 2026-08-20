"use client";

import { FormEvent, useEffect, useRef, useState } from "react";

type EventItem = {
  id: string;
  name: string;
  dateLabel: string;
  day: string;
  month: string;
  time: string;
  venue: string;
  city: string;
  country: string;
  price: string;
  purchaseUri: string;
};

type ApiEvent = {
  id: string;
  name: string;
  purchaseUri: string;
  localDate: string | null;
  localTime: string | null;
  venue: { name: string | null; city: string | null; countryCode: string | null } | null;
  price: { currency: string | null; minimum: number; maximum: number } | null;
};

function BrandMark() {
  return (
    <svg className="brand-mark" viewBox="0 0 40 40" aria-hidden="true">
      <rect width="40" height="40" rx="11" fill="currentColor" />
      <path d="M12 12h16M12 20h16M12 28h10" stroke="white" strokeWidth="3" strokeLinecap="round" />
      <path d="m24 25 4 4 7-9" stroke="#79E2A9" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SearchIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m16.5 16.5 4 4" /></svg>;
}

function LocationIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2.5" /></svg>;
}

function ArrowIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14m-5-5 5 5-5 5" /></svg>;
}

function CloseIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" /></svg>;
}

function ShieldIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3 5 6v5c0 4.6 2.9 8.5 7 10 4.1-1.5 7-5.4 7-10V6l-7-3Z" /><path d="m9 12 2 2 4-5" /></svg>;
}

function formatEventDate(value: string | null) {
  if (!value) return { dateLabel: "Date to be announced", day: "—", month: "TBA" };
  const parsed = new Date(`${value}T12:00:00`);
  if (Number.isNaN(parsed.valueOf())) return { dateLabel: value, day: "—", month: "TBA" };
  return {
    dateLabel: new Intl.DateTimeFormat("en", { weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(parsed),
    day: new Intl.DateTimeFormat("en", { day: "2-digit" }).format(parsed),
    month: new Intl.DateTimeFormat("en", { month: "short" }).format(parsed).toUpperCase(),
  };
}

function formatPrice(price: ApiEvent["price"]) {
  if (!price) return "See listing";
  const formatter = new Intl.NumberFormat("en", {
    style: "currency",
    currency: price.currency ?? "USD",
    maximumFractionDigits: 0,
  });
  return `From ${formatter.format(price.minimum)}`;
}

export default function Home() {
  const [query, setQuery] = useState("Coldplay");
  const [city, setCity] = useState("London");
  const [country, setCountry] = useState("GB");
  const [results, setResults] = useState<EventItem[]>([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<EventItem | null>(null);
  const captureCursor = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("recording") !== "1") return;
    document.documentElement.classList.add("recording-cursor");
    const moveCursor = (event: MouseEvent) => {
      if (captureCursor.current) {
        captureCursor.current.style.transform = `translate3d(${event.clientX}px, ${event.clientY}px, 0)`;
      }
    };
    window.addEventListener("mousemove", moveCursor);
    return () => {
      window.removeEventListener("mousemove", moveCursor);
      document.documentElement.classList.remove("recording-cursor");
    };
  }, []);

  async function search(event: FormEvent) {
    event.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setError(null);
    setSearched(false);

    try {
      const parameters = new URLSearchParams({ keyword: query.trim(), country, limit: "12" });
      if (city.trim()) parameters.set("city", city.trim());
      const response = await fetch(`/api/events?${parameters.toString()}`, { headers: { Accept: "application/json" } });
      if (!response.ok) {
        const problem = await response.json().catch(() => null) as { detail?: string } | null;
        throw new Error(problem?.detail ?? "Event search is temporarily unavailable.");
      }

      const payload = await response.json() as { events: ApiEvent[] };
      setResults(payload.events.map((item) => {
        const date = formatEventDate(item.localDate);
        return {
          id: item.id,
          name: item.name,
          ...date,
          time: item.localTime?.slice(0, 5) ?? "Time TBA",
          venue: item.venue?.name ?? "Venue to be announced",
          city: item.venue?.city ?? "Location TBA",
          country: item.venue?.countryCode ?? country,
          price: formatPrice(item.price),
          purchaseUri: item.purchaseUri,
        };
      }));
      setSearched(true);
      window.setTimeout(() => document.querySelector("#events")?.scrollIntoView({ behavior: "smooth", block: "start" }), 80);
    } catch (searchError) {
      setResults([]);
      setSearched(true);
      setError(searchError instanceof Error ? searchError.message : "Event search is temporarily unavailable.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div ref={captureCursor} className="capture-cursor" aria-hidden="true" />
      <header className="topbar">
        <div className="container topbar-inner">
          <a className="brand" href="#top" aria-label="TicketFlow home"><BrandMark /><span>TicketFlow</span></a>
          <nav aria-label="Main navigation">
            <a className="active" href="#events">Events</a>
            <a href="#how-it-works">How it works</a>
          </nav>
          <div className="topbar-actions">
            <span className="header-location"><LocationIcon /> London, UK</span>
            <span className="profile" aria-label="Account">TF</span>
          </div>
        </div>
      </header>

      <main id="top">
        <section className="search-hero">
          <div className="container hero-inner">
            <p className="eyebrow">OFFICIAL EVENT DISCOVERY</p>
            <h1>Find a night worth remembering.</h1>
            <p className="hero-copy">Search events, compare dates and continue to the official ticketing page when you&apos;re ready.</p>

            <form className="search-form" onSubmit={search}>
              <label className="search-field keyword-field">
                <span>What do you want to see?</span>
                <div><SearchIcon /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Artist, event or venue" aria-label="Artist, event or venue" /></div>
              </label>
              <label className="search-field">
                <span>City</span>
                <div><LocationIcon /><input value={city} onChange={(event) => setCity(event.target.value)} placeholder="Any city" aria-label="City" /></div>
              </label>
              <label className="search-field country-field">
                <span>Country</span>
                <select value={country} onChange={(event) => setCountry(event.target.value)} aria-label="Country">
                  <option value="GB">United Kingdom</option>
                  <option value="US">United States</option>
                  <option value="CA">Canada</option>
                  <option value="DE">Germany</option>
                  <option value="AU">Australia</option>
                </select>
              </label>
              <button className="primary-button search-submit" type="submit" disabled={loading}>
                {loading ? <span className="spinner" /> : <SearchIcon />}
                {loading ? "Searching" : "Search events"}
              </button>
            </form>

            <div className="quick-searches" aria-label="Popular searches">
              <span>Popular:</span>
              {["Coldplay", "Premier League", "Comedy"].map((term) => (
                <button key={term} onClick={() => setQuery(term)}>{term}</button>
              ))}
            </div>
          </div>
        </section>

        <section className="events-section" id="events">
          <div className="container">
            <div className="section-header">
              <div>
                <p className="section-label">EVENTS</p>
                <h2>{searched ? `Results for “${query}”` : "Search current listings"}</h2>
              </div>
              {searched && !error && <span className="result-count">{results.length} {results.length === 1 ? "event" : "events"}</span>}
            </div>

            {!searched && (
              <div className="empty-state">
                <SearchIcon />
                <h3>Start with an artist, event or venue</h3>
                <p>Live listings and official checkout links will appear here.</p>
              </div>
            )}

            {searched && error && <div className="message-state error-state" role="alert"><h3>We couldn&apos;t complete that search</h3><p>{error}</p></div>}
            {searched && !error && results.length === 0 && <div className="message-state"><h3>No matching events found</h3><p>Try changing the artist, city or country.</p></div>}

            {results.length > 0 && (
              <div className="event-list">
                {results.map((item) => (
                  <article className="event-row" key={item.id}>
                    <div className="date-block"><strong>{item.day}</strong><span>{item.month}</span></div>
                    <div className="event-details">
                      <span className="event-time">{item.dateLabel} · {item.time}</span>
                      <h3>{item.name}</h3>
                      <p><LocationIcon /> {item.venue}, {item.city}</p>
                    </div>
                    <div className="event-country">{item.country}</div>
                    <div className="event-price"><span>Listed price</span><strong>{item.price}</strong></div>
                    <button className="secondary-button" onClick={() => setSelected(item)}>View tickets <ArrowIcon /></button>
                  </article>
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="trust-section" id="how-it-works">
          <div className="container trust-inner">
            <div><ShieldIcon /><span><strong>Official checkout</strong><small>Payment stays with the authorized ticketing provider.</small></span></div>
            <div><span className="number-icon">1</span><span><strong>Search and review</strong><small>Compare the event details that matter.</small></span></div>
            <div><span className="number-icon">2</span><span><strong>Continue securely</strong><small>Open the event-specific official listing.</small></span></div>
          </div>
        </section>
      </main>

      <footer>
        <div className="container footer-inner">
          <a className="brand footer-brand" href="#top"><BrandMark /><span>TicketFlow</span></a>
          <p>Independent event discovery service. Ticket availability and pricing are provided by the ticketing platform.</p>
          <span>© 2026 TicketFlow</span>
        </div>
      </footer>

      {selected && (
        <div className="drawer-backdrop" onMouseDown={() => setSelected(null)}>
          <aside className="checkout-drawer" role="dialog" aria-modal="true" aria-label="Review event" onMouseDown={(event) => event.stopPropagation()}>
            <button className="drawer-close" onClick={() => setSelected(null)} aria-label="Close"><CloseIcon /></button>
            <p className="section-label">REVIEW EVENT</p>
            <h2>{selected.name}</h2>
            <div className="selected-date">
              <div className="date-block large"><strong>{selected.day}</strong><span>{selected.month}</span></div>
              <div><strong>{selected.dateLabel}</strong><span>{selected.time}</span></div>
            </div>
            <dl className="event-summary">
              <div><dt>Venue</dt><dd>{selected.venue}<span>{selected.city}, {selected.country}</span></dd></div>
              <div><dt>Pricing</dt><dd>{selected.price}<span>Final prices shown by provider</span></dd></div>
            </dl>
            <div className="secure-note"><ShieldIcon /><div><strong>Continue on the official ticketing site</strong><p>Seat selection, account verification and payment happen securely with the provider.</p></div></div>
            <a className="primary-button checkout-button" href={selected.purchaseUri} target="_blank" rel="noopener noreferrer">Continue to official checkout <ArrowIcon /></a>
            <button className="text-button" onClick={() => setSelected(null)}>Back to results</button>
          </aside>
        </div>
      )}
    </>
  );
}
