# MyPrivate-Jet

The production web app for MyPrivate-Jet: premium private jet charter with **one recommended cabin and one final Assured Price**, a free membership with a mandate, a client **Private Office**, and an **Advisor desk** that runs most of each booking automatically.

It is built from the approved Private Office prototype and the business model. Prices match the prototype to the euro (see `tests/pricing.test.ts`).

---

## What is in it

| Area | Address | What it does |
|---|---|---|
| Plan a flight | `/` | The brief as one sentence. One recommended standard, one all-inclusive price, a "worth knowing" lesson, the five standards side by side. |
| Membership | from any "Confirm" or "Chat" | Name, email, mobile and one tick (Terms + mandate), then a 6-digit SMS code. The mandate acceptance is recorded with date, version, IP and browser. |
| Private Office | `/office` | Every flight with its 7-step checklist (only payment and passengers are the client's), passengers and passports, payment, flight brief, documents, and the Private Aviation Desk. |
| Profile | `/office/profile` | Filled in at leisure; saves as you type. |
| Demo Office | `/demo` | A sample client, for prospects and for sales conversations. |
| Advisor desk | `/advisor` | 12-stage pipeline, offers with margin, "confirmed or free" exception handling, money in and out, flight brief builder, operator mail, Flight Ops assistant, client messages (`/advisor/inbox`). |
| Public content | `/standards`, `/routes/…`, `/guides/…`, `/faq`, `/assured-price` | Indexable pages for search engines and AI assistants. |

Rules built into the code:

- Clients never see ranges, operator names or competing quotes. The price model runs only on the server.
- The price is recomputed on the server when a client books; the browser's figure is never trusted.
- We absorb nothing: an offer above the Assured Price can't be chosen; the advisor uses upgrade / one new price / free release.
- No instant guarantee within 7 days of departure or on peak dates: the price is confirmed with the aircraft.
- No payment is requested until the aircraft is confirmed. The client pays MyPrivate-Jet; MyPrivate-Jet pays the operator.
- Internal brief fields (callsign, captain mobile, operator ops line) never reach the client.
- `/office` and `/advisor` are never indexed by search engines.

## The technology, in plain words

| Piece | Choice | Why |
|---|---|---|
| Website and app | **Next.js 16 + React + TypeScript** | One codebase for public pages and the app; pages are rendered on the server, which is fast and what search engines and AI assistants read best. |
| Database | **PostgreSQL** with **Drizzle** | Reliable, standard, cheap to host. Bookings, members, offers, payments, briefs, mail and an audit trail of every step. |
| Hosting | **Vercel** (app) + **Supabase** or **Neon** (database, EU region) | Push to GitHub and the site updates. Each pull request gets its own preview link. |
| SMS codes | **Twilio Verify** | Sends and checks the 6-digit codes; we never store them. |
| Card payments | **Stripe Checkout** | Secure payment page; the webhook marks the booking paid. Bank transfer works without it. |
| Email | **Resend** | Flight brief and notifications. |
| AI | **Anthropic Claude** | Reads operator briefs (PDF/photo) into the flight brief, drafts operator emails, answers the Flight Ops assistant. Advisor-only; it drafts, the advisor decides. |
| Analytics | **Plausible** (and optionally Google tag) | Conversion events without cookies or personal data. |

Until a service is connected, the app runs in **test mode** for that piece and says so: any 6 digits work for SMS, card payment is simulated, AI falls back to templates and sample briefs. Test mode is refused in production unless `ALLOW_SIMULATIONS=true` (for a staging site only).

## Accounts Pascal needs to open

| Service | What to create | What to send us (into Vercel's environment settings, never by email) |
|---|---|---|
| **GitHub** | Done: this repository. | – |
| **Vercel** | Account (Pro plan recommended for a business), import this repository, add the domain. | Nothing: the keys below go into Vercel → Project → Settings → Environment Variables. |
| **Supabase** (or Neon) | A project in an EU region (Frankfurt). | `DATABASE_URL` |
| **Twilio** | Account, then a **Verify** service. Enable SMS to the countries you serve. | `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_VERIFY_SERVICE_SID` |
| **Stripe** | Account in the name of the contracting company; a webhook to `https://<your-domain>/api/webhooks/stripe` for `checkout.session.completed`. | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` |
| **Resend** | Account, verify the sending domain. | `RESEND_API_KEY`, `EMAIL_FROM` |
| **Anthropic** | API account at console.anthropic.com, with billing. | `ANTHROPIC_API_KEY` |
| **Plausible** | Site for your domain (optional). | `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` |
| Domain | The domain you want, pointed at Vercel. | `NEXT_PUBLIC_SITE_URL` |

Also set `SESSION_SECRET` (any long random text) and `ADVISOR_EMAIL` / `ADVISOR_PASSWORD` for the first advisor account.

Later, for the fully automated desk: a shared operator mailbox (Microsoft 365 or Google Workspace), e-signature (e.g. DocuSign or Yousign), a bank feed, aviation weather/NOTAM and flight-tracking feeds, an FBO directory, and a licensed news source for the Desk's live wire.

## Still to decide or review (not code)

- **Legal**: Membership Terms, the mandate wording, booking terms, client money, agency position, data protection (GDPR / UK / Swiss FADP, passports). All marked *draft* in the app.
- **Pricing policy**: margin and corridor buffers; the 2-hour confirmation and replacement-at-our-cost promises are shown as proposals.
- **Translations**: the site frame is in English, French, Italian and Arabic; a native speaker should review FR/IT/AR. Guides are English for now. Next step for SEO: language-specific addresses (`/fr/…`) with hreflang.

## Run it on your computer (for developers)

```bash
cp .env.example .env          # then fill DATABASE_URL at least
docker compose up -d          # local Postgres (or use any Postgres)
npm install
npm run db:setup              # create tables + sample data and the advisor login
npm run dev                   # http://localhost:3000
```

Advisor desk: `http://localhost:3000/advisor` (development login printed by the seed: `advisor@example.com` / `change-me-now`).

Checks: `npm run typecheck`, `npm test`, `npm run build`. GitHub runs all of them on every pull request.

## Where things are

```
src/app/(site)/        public pages, membership, Office, Demo, guides
src/app/advisor/       advisor desk (sign-in required)
src/app/api/           airport search, quote, Stripe webhook
src/lib/pricing/       Assured Price engine (server only), standards, airport knowledge
src/lib/booking/       pipeline stages, client checklist, terms, profile, brief fields
src/server/actions/    everything a button does (member and advisor)
src/server/integrations/ Twilio, Stripe, Resend, Anthropic — each with a labelled test mode
src/server/db/         database tables; migrations in drizzle/
src/content/           route guides, articles, FAQ
src/i18n/              interface languages
```
