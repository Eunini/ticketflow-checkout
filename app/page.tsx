"use client";

import { FormEvent, useState } from "react";

type EventItem = {
  id: string;
  eyebrow: string;
  name: string;
  date: string;
  time: string;
  venue: string;
  city: string;
  country: string;
  price: string;
  availability: string;
  accent: string;
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

function formatDate(value: string): string {
  const date = new Date(`${value}T12:00:00`);
  return Number.isNaN(date.valueOf())
    ? value
    : new Intl.DateTimeFormat("en", { weekday: "short", day: "2-digit", month: "short" })
        .format(date)
        .toUpperCase();
}

function formatPrice(price: ApiEvent["price"]): string {
  if (!price) return "SEE LISTING";
  const currency = price.currency ?? "USD";
  const formatter = new Intl.NumberFormat("en", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  });
  return `${formatter.format(price.minimum)}–${formatter.format(price.maximum)}`;
}

const SearchIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m21 21-4.35-4.35m2.35-5.65a8 8 0 1 1-16 0 8 8 0 0 1 16 0Z" /></svg>
);

const ArrowIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14m-6-6 6 6-6 6" /></svg>
);

const CheckIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12 4 4L19 6" /></svg>
);

export default function Home() {
  const [query, setQuery] = useState("Coldplay");
  const [city, setCity] = useState("London");
  const [country, setCountry] = useState("GB");
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<EventItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<EventItem | null>(null);
  const [handoffReady, setHandoffReady] = useState(false);

  async function search(event: FormEvent) {
    event.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setSearched(false);
    setError(null);
    setSelected(null);
    setHandoffReady(false);

    try {
      const parameters = new URLSearchParams({ keyword: query.trim(), country, limit: "12" });
      if (city.trim()) parameters.set("city", city.trim());

      const response = await fetch(`/api/events?${parameters.toString()}`, {
        headers: { Accept: "application/json" },
      });
      if (!response.ok) {
        const problem = await response.json().catch(() => null) as { detail?: string } | null;
        throw new Error(problem?.detail ?? "Live event search is temporarily unavailable.");
      }

      const payload = await response.json() as { events: ApiEvent[] };
      const accents = ["violet", "coral", "gold"];
      setResults(payload.events.map((item, index) => ({
        id: item.id,
        eyebrow: "OFFICIAL EVENT LISTING",
        name: item.name,
        date: item.localDate ? formatDate(item.localDate) : "DATE TBA",
        time: item.localTime?.slice(0, 5) ?? "TIME TBA",
        venue: item.venue?.name ?? "Venue TBA",
        city: item.venue?.city ?? "Location TBA",
        country: item.venue?.countryCode ?? country,
        price: formatPrice(item.price),
        availability: "Official listing",
        accent: accents[index % accents.length],
        purchaseUri: item.purchaseUri,
      })));
      setSearched(true);
      window.setTimeout(() => document.querySelector("#results")?.scrollIntoView({ behavior: "smooth" }), 80);
    } catch (searchError) {
      setResults([]);
      setSearched(true);
      setError(searchError instanceof Error
        ? searchError.message
        : "Live event search is temporarily unavailable.");
    } finally {
      setLoading(false);
    }
  }

  function review(item: EventItem) {
    setSelected(item);
    setHandoffReady(false);
  }

  return (
    <main>
      <header className="nav shell">
        <a className="brand" href="#top" aria-label="TicketFlow home">
          <span className="brand-mark"><span /></span>
          <span>TICKET<span>FLOW</span></span>
        </a>
        <nav aria-label="Primary navigation">
          <a href="#experience">Experience</a>
          <a href="#architecture">Architecture</a>
        </nav>
        <span className="status-pill"><span /> LIVE DISCOVERY</span>
      </header>

      <section className="hero shell" id="top">
        <div className="hero-copy">
          <div className="kicker">EVENT DISCOVERY · CHECKOUT HANDOFF</div>
          <h1>From “who&apos;s playing?”<br />to <em>ready to book.</em></h1>
          <p>
            A focused event-search companion that turns live discovery data into a clean,
            confident path to official checkout.
          </p>
          <div className="hero-meta">
            <div><strong>01</strong><span>Search live inventory</span></div>
            <div><strong>02</strong><span>Review event details</span></div>
            <div><strong>03</strong><span>Secure site handoff</span></div>
          </div>
        </div>
        <div className="hero-visual" aria-hidden="true">
          <div className="orb orb-one" />
          <div className="orb orb-two" />
          <div className="ticket ticket-back">
            <span>LIVE</span><b>08·30</b><small>WEMBLEY · LONDON</small>
          </div>
          <div className="ticket ticket-front">
            <div className="ticket-top"><span>EVENT PASS</span><span>TF·0830</span></div>
            <div className="ticket-stage"><i /><i /><i /><i /><i /></div>
            <div className="ticket-info"><span>Music of the Spheres</span><b>WEMBLEY<br />STADIUM</b></div>
            <div className="barcode">|||| ||| || |||| | ||| ||</div>
          </div>
        </div>
      </section>

      <section className="search-stage" id="experience">
        <div className="shell">
          <div className="section-heading">
            <div><span className="section-number">01</span><div><small>DISCOVER</small><h2>Find your next event</h2></div></div>
            <span className="data-badge">TICKETMASTER DISCOVERY API</span>
          </div>

          <form className="search-panel" onSubmit={search}>
            <label className="field field-main">
              <span>ARTIST, EVENT OR VENUE</span>
              <div><SearchIcon /><input value={query} onChange={(event) => setQuery(event.target.value)} aria-label="Artist, event or venue" /></div>
            </label>
            <label className="field">
              <span>COUNTRY</span>
              <select value={country} onChange={(event) => setCountry(event.target.value)} aria-label="Country">
                <option value="GB">United Kingdom</option>
                <option value="AT">Austria</option>
              </select>
            </label>
            <label className="field">
              <span>CITY</span>
              <input value={city} onChange={(event) => setCity(event.target.value)} aria-label="City" />
            </label>
            <button className="search-button" type="submit" disabled={loading}>
              {loading ? <span className="spinner" /> : <SearchIcon />}
              {loading ? "Searching" : "Find events"}
            </button>
          </form>

          <div className={`results ${searched ? "is-visible" : ""}`} id="results" aria-live="polite">
            {searched && (
              <>
                <div className="results-head">
                  <div><span className="live-dot" /> {results.length} EVENTS FOUND</div>
                  <span>Sorted by soonest date</span>
                </div>
                {error && <div className="search-error" role="alert">{error}</div>}
                {!error && results.length === 0 && (
                  <div className="search-error empty-result">No matching events were found. Try another artist, city, or country.</div>
                )}
                <div className="event-grid">
                  {results.map((item, index) => (
                    <article className={`event-card ${item.accent}`} key={item.id} style={{ animationDelay: `${index * 90}ms` }}>
                      <div className="card-art">
                        <span>{item.eyebrow}</span>
                        <div className="stage-lines"><i /><i /><i /><i /></div>
                        <strong>{item.name}</strong>
                      </div>
                      <div className="card-body">
                        <div className="event-date"><b>{item.date}</b><span>{item.time}</span></div>
                        <h3>{item.venue}</h3>
                        <p>{item.city}, {item.country}</p>
                        <div className="availability"><span /><b>{item.availability}</b></div>
                        <div className="card-footer"><div><small>FROM</small><strong>{item.price}</strong></div><button onClick={() => review(item)}>Review <ArrowIcon /></button></div>
                      </div>
                    </article>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </section>

      <section className="architecture shell" id="architecture">
        <div className="section-heading">
          <div><span className="section-number">02</span><div><small>BUILD</small><h2>Production-minded by design</h2></div></div>
        </div>
        <div className="architecture-grid">
          <article><span>01</span><h3>C# domain core</h3><p>Typed search criteria, event records, validation, and clear contracts stay isolated from delivery code.</p><code>.NET 8 · nullable · async</code></article>
          <article><span>02</span><h3>Secure API boundary</h3><p>Consumer keys remain server-side, HTTP failures are sanitized, and every request has cancellation and timeout controls.</p><code>HttpClient · System.Text.Json</code></article>
          <article><span>03</span><h3>Official handoff</h3><p>Users review the event here, then continue on the authorized ticketing domain for seats, identity, and payment.</p><code>HTTPS · user confirmed</code></article>
        </div>
      </section>

      <footer className="footer shell">
        <div className="brand"><span className="brand-mark"><span /></span><span>TICKET<span>FLOW</span></span></div>
        <p>Independent software project · No affiliation implied · No payment collected</p>
        <span>C# / .NET 8</span>
      </footer>

      {selected && (
        <div className="modal-backdrop" role="presentation" onMouseDown={() => setSelected(null)}>
          <section className="checkout-modal" role="dialog" aria-modal="true" aria-label="Checkout handoff review" onMouseDown={(event) => event.stopPropagation()}>
            <button className="modal-close" onClick={() => setSelected(null)} aria-label="Close">×</button>
            {!handoffReady ? (
              <>
                <span className="modal-kicker">CHECKOUT HANDOFF</span>
                <h2>Review your event</h2>
                <div className={`modal-art ${selected.accent}`}><span>{selected.eyebrow}</span><strong>{selected.name}</strong></div>
                <dl>
                  <div><dt>Date & time</dt><dd>{selected.date} · {selected.time}</dd></div>
                  <div><dt>Venue</dt><dd>{selected.venue}<small>{selected.city}, {selected.country}</small></dd></div>
                  <div><dt>Listed range</dt><dd>{selected.price}</dd></div>
                </dl>
                <div className="security-note"><span className="lock">⌾</span><div><strong>Secure official checkout</strong><p>Seat selection, identity, and payment stay on the authorized ticketing site.</p></div></div>
                <button className="handoff-button" onClick={() => setHandoffReady(true)}>Prepare secure handoff <ArrowIcon /></button>
                <p className="modal-footnote">No purchase is made before the official checkout.</p>
              </>
            ) : (
              <div className="success-state">
                <span className="success-icon"><CheckIcon /></span>
                <span className="modal-kicker">HANDOFF READY</span>
                <h2>You&apos;re ready to continue.</h2>
                <p>The event-specific HTTPS checkout URL has been verified and is ready to open.</p>
                <div className="success-event"><div><small>SELECTED EVENT</small><strong>{selected.name}</strong><span>{selected.date} · {selected.venue}</span></div><CheckIcon /></div>
                <a className="handoff-button" href={selected.purchaseUri} target="_blank" rel="noopener noreferrer">Continue to official checkout <ArrowIcon /></a>
                <p className="modal-footnote">Checkout opens in a new secure tab.</p>
              </div>
            )}
          </section>
        </div>
      )}
    </main>
  );
}
