# DevCrunch SEO Playbook

**Goal:** consistently rank DevCrunch articles on Google page 1 (incl. Top Stories & Discover) for high-CPC US/UK tech queries.
**Audience:** the auto-content engine (rules baked into prompts/pipeline) **and** the human editor approving articles.
**Last reviewed:** 2026-06-26. Re-verify against the primary sources below after any major Google core update.

> Every rule here cites the Google/web.dev source it rests on. If a rule and Google's docs ever disagree, **Google wins** — update this file.

---

## 0. The five things that actually matter (TL;DR)

1. **Quality + trust beat tricks.** There is no single "helpful content" switch anymore — it was folded into core ranking in March 2024. Win on broad, genuinely useful, trustworthy content. ([Google](https://developers.google.com/search/blog/2024/03/core-update-spam-policies))
2. **Don't trip the spam policies.** "Scaled content abuse" explicitly targets mass-produced/AI content made for search. An auto-publishing blog must add real value + human oversight per article. ([Google](https://developers.google.com/search/blog/2024/03/core-update-spam-policies))
3. **Freshness is query-dependent.** Recency only helps for queries that *deserve* freshness (breaking news). Never fake freshness by re-dating. ([Google](https://developers.google.com/search/docs/appearance/ranking-systems-guide))
4. **Hit Core Web Vitals:** LCP ≤2.5s, INP ≤200ms, CLS ≤0.1. ([web.dev](https://web.dev/articles/vitals/))
5. **Index fast the legitimate way:** news sitemap (48h window) + internal links + IndexNow (Bing/Yandex). **Never** use the Google Indexing API for news. ([news sitemap](https://developers.google.com/search/docs/crawling-indexing/sitemaps/news-sitemap), [Indexing API](https://developers.google.com/search/apis/indexing-api/v3/quickstart))

---

## 1. Pre-writing: topic & keyword selection (daily)

**Objective:** pick ONE specific, currently-trending story that (a) real people are searching for right now, and (b) sits in a high-CPC beat.

### 1.1 Find the trend (real-time discovery)
- **Google Trends → "Trending Now" / realtime** (refreshes ~every 10 min) and **Related Queries → "Rising" / "Breakout"** (Breakout = +5000% surge). Free. ([Backlinko](https://backlinko.com/hub/content/google-trends))
- **Google News** (Technology) + **X/Reddit** (r/technology, r/programming, HN) for what's breaking and the angle people argue about.
- **Exploding Topics / Glimpse** to catch breakouts early. ([Glimpse](https://meetglimpse.com/software-guides/exploding-topics-alternatives/))

### 1.2 Confirm it deserves freshness
Only chase the trend if it's a genuine, time-sensitive event (launch, breach, funding round, regulation, model release) — i.e. a **query that deserves freshness**. Don't write about something *just because it's trending* if DevCrunch wouldn't otherwise cover it. ([Google QDF + search-engine-first warnings](https://developers.google.com/search/docs/fundamentals/creating-helpful-content))

### 1.3 Choose the primary keyword (news intent)
- Pick the **head query a reader would actually type** (e.g. *"OpenAI [X] launch"*, *"[Company] data breach"*), not a generic evergreen phrase.
- News intent = **who / what / when / why it matters, fast.** Don't target it like a 3,000-word how-to guide.
- 1 **primary keyword** + 2–4 **secondary/entity terms** (company, product, people, version numbers).

### 1.4 Bias toward high-CPC beats
For US/UK monetization value, favor angles in **cybersecurity, cloud, enterprise AI/SaaS, fintech-adjacent** topics — these carry the highest CPCs and overlap DevCrunch's beats. ([Ahrefs](https://ahrefs.com/blog/most-expensive-keywords/)) Treat Google Trends/Discover spikes as **bonus traffic**, not the foundation. ([Google Discover](https://developers.google.com/search/docs/appearance/google-discover))

### Tool cheat-sheet
| Need | Use | Cost |
|---|---|---|
| Real-time trend discovery | Google Trends, Google News, X/Reddit, Exploding Topics/Glimpse | Free / freemium |
| Long-tail, low-competition keywords | **Mangools/KWFinder** (best value) | ~$30–80/mo |
| Deep keyword + backlink + SERP analysis | Ahrefs / Semrush | ~$120–130+/mo |

---

## 2. On-page SEO checklist (every article)

| Element | Rule |
|---|---|
| **`<title>` / meta_title** | ≤ **60 chars**, primary keyword near the front, includes a concrete hook (company/number). DevCrunch appends `· DevCrunch` for social only. |
| **Meta description / excerpt** | **150–160 chars**, includes primary keyword + the "why it matters" payoff. |
| **H1** | Exactly one, the article headline, contains the primary keyword. |
| **H2/H3** | 3–5 `<h2>` sections; put the primary (or a secondary) keyword in **at least one H2**. Use `<h3>` for sub-points. |
| **Keyword placement** | Primary keyword in the **first ~100 words**, one H2, naturally in body. No stuffing. |
| **Lead / lede** | First paragraph answers **who/what/when/where/why-it-matters** — news-style, not a slow windup. |
| **Internal links** | **2–3 contextual links** to related DevCrunch articles, descriptive anchors (auto-injected by the pipeline). |
| **Images** | Cover + inline images with descriptive **alt text**, explicit **`width`/`height`** (CLS), `loading="lazy"` (below-fold), cover ≥**1200px** wide for Discover. |
| **`max-image-preview:large`** | Site-wide robots meta so images qualify for Discover/large thumbnails. ([Google](https://developers.google.com/search/docs/appearance/google-discover)) |
| **Canonical** | Self-referential canonical (already auto-set per article). |
| **Schema** | `NewsArticle` + `BreadcrumbList` JSON-LD with `headline`, `datePublished`, `dateModified`, `author`, `publisher`, `image`. |
| **No meta keywords** | ❌ Google ignores them — don't add them. |

---

## 3. Content & E-E-A-T quality rules

**Trust is the #1 E-E-A-T component** — build it on every article. ([Google](https://developers.google.com/search/docs/fundamentals/creating-helpful-content))

- **Sourcing:** ground every claim in real, verifiable facts. Link out to primary sources (the company blog, the filing, the CVE). **Never fabricate** stats, quotes, dates, or figures — write qualitatively if unsure.
- **Originality / added value:** don't just rephrase the press release — add analysis, "why it matters to builders," context, or implications. (Counters "scaled content abuse." [Google](https://developers.google.com/search/blog/2024/03/core-update-spam-policies))
- **Author transparency (E-E-A-T):** real byline, **visible author bio + expertise**, link to author profile, and `author` in JSON-LD.
- **Publisher identity:** clear `Organization` schema, About/contact, consistent "DevCrunch" name.
- **Accuracy & corrections:** if a fact changes, update the article and `dateModified` — *because the content changed*, not to fake freshness.
- **No fixed word count.** Google has **no preferred length** — write what the story needs (DevCrunch's 900–1400 word range is a quality floor, not a ranking target). ([Google](https://developers.google.com/search/docs/fundamentals/creating-helpful-content))
- **Snippet-friendly:** include a 1–2 sentence **summary/TL;DR** near the top and use lists where natural, to win featured snippets.

---

## 4. Technical, freshness & indexing requirements

| Requirement | Spec | Source |
|---|---|---|
| **Core Web Vitals** | LCP ≤2.5s · INP ≤200ms · CLS ≤0.1 (75th pct, mobile+desktop) | [web.dev](https://web.dev/articles/vitals/) |
| **Image dimensions** | Always set `width`/`height` to prevent CLS; reserve space for AdSense slots | [web.dev](https://web.dev/articles/vitals/) |
| **NewsArticle schema** | `headline` (≤110 chars), `datePublished`, `dateModified`, `author`, `image`, `publisher` | [Google](https://developers.google.com/search/docs/appearance/structured-data/article) |
| **News sitemap** | `news:` namespace; **only last-48h** articles; **≤1000** entries/file; prune older entries | [Google](https://developers.google.com/search/docs/crawling-indexing/sitemaps/news-sitemap) |
| **Regular sitemap** | All published articles, `lastmod` | — |
| **IndexNow** | Ping on publish → fast Bing/Yandex/Naver/Seznam/Yep indexing. **Google does NOT use it.** | [indexnow.org](https://www.indexnow.org/) |
| **Google indexing** | News sitemap + internal links + crawl. **Never** the Indexing API (JobPosting/BroadcastEvent only). | [Indexing API](https://developers.google.com/search/apis/indexing-api/v3/quickstart) |
| **Discover large images** | `max-image-preview:large` + ≥1200px wide (>300k px) | [Google Discover](https://developers.google.com/search/docs/appearance/google-discover) |
| **Search Console** | Verify the property; monitor Top Stories/Discover performance & CWV report | — |

**Speed-to-publish:** for breaking stories, being early + accurate + indexed (sitemap/IndexNow/internal links) is the edge. But **never trade accuracy for speed** — a wrong breaking story hurts Trust.

---

## 5. The daily checklist

### 5A. What the engine enforces automatically (pipeline)
- [ ] Trending, specific, current topic (web-search research) — skip near-duplicates of recent coverage
- [ ] Primary keyword chosen → placed in title, first ~100 words, ≥1 H2
- [ ] `meta_title` ≤60 chars · `excerpt` 150–160 chars (both keyword-bearing)
- [ ] News-style lede + TL;DR summary near top
- [ ] 900–1400 words, structured H2/H3 + list + blockquote, no fabricated facts
- [ ] 2–3 internal links to related articles auto-injected
- [ ] Cover + inline images with alt text + width/height; cover ≥1200px
- [ ] `NewsArticle` + `BreadcrumbList` JSON-LD emitted server-side
- [ ] Added to news sitemap (48h) + regular sitemap; IndexNow ping fired on publish
- [ ] Moderation/quality gate passed (else → `needs_review`)

### 5B. What the human editor verifies before/just-after publish
- [ ] **Facts are real** — spot-check names, numbers, dates against a primary source; no hallucinations
- [ ] **Adds value** beyond the press release (analysis/angle) — not thin rephrasing
- [ ] Headline is accurate + compelling (not clickbait), keyword reads naturally
- [ ] Byline author fits the beat; author bio present
- [ ] Outbound links point to real, authoritative sources
- [ ] Renders well on mobile; no layout shift from images/ads
- [ ] (Periodic) check Search Console: which articles hit Top Stories/Discover; double down on what works

---

## 6. Myths to ignore (contradicted by current Google guidance)
- ❌ **"Freshness always wins"** — only for queries that deserve freshness. ([Google](https://developers.google.com/search/docs/appearance/ranking-systems-guide))
- ❌ **"Submit news via the Indexing API"** — JobPosting/BroadcastEvent only. ([Google](https://developers.google.com/search/apis/indexing-api/v3/quickstart))
- ❌ **"Meta keywords help"** — ignored by Google.
- ❌ **"There's an ideal word count"** — Google has no preferred length. ([Google](https://developers.google.com/search/docs/fundamentals/creating-helpful-content))
- ❌ **"Re-date old posts to look fresh"** — flagged as search-engine-first behavior. ([Google](https://developers.google.com/search/docs/fundamentals/creating-helpful-content))
- ❌ **"AMP is required for Top Stories"** — not since 2020. ([Search Engine Land](https://searchengineland.com/amp-wont-be-required-for-googles-top-stories-section-335276))

---

## 7. Backlog (not yet implemented; future SEO wins)
- FAQ schema for explainer pieces; category/pillar pages per beat (AI/Startups/Security) with hub-and-spoke internal links
- Cloudinary image pipeline for WebP/AVIF + responsive `srcset`
- Search-Console-driven feedback loop into topic selection (double down on articles that reach Top Stories/Discover)
- Atom/JSON feeds; `Speakable` schema for voice

---

## Primary sources
- Google — March 2024 core update & spam policies: https://developers.google.com/search/blog/2024/03/core-update-spam-policies
- Google — Creating helpful, people-first content (E-E-A-T, word count, freshness): https://developers.google.com/search/docs/fundamentals/creating-helpful-content
- Google — Ranking systems guide (HCS into core, QDF): https://developers.google.com/search/docs/appearance/ranking-systems-guide
- Google — Core updates & your site: https://developers.google.com/search/docs/appearance/core-updates
- web.dev — Web Vitals (LCP/INP/CLS thresholds): https://web.dev/articles/vitals/ · INP replaces FID: https://web.dev/blog/inp-cwv-march-12
- Google — Discover: https://developers.google.com/search/docs/appearance/google-discover
- Google — News sitemap: https://developers.google.com/search/docs/crawling-indexing/sitemaps/news-sitemap
- Google — Article structured data: https://developers.google.com/search/docs/appearance/structured-data/article
- Google — Indexing API (JobPosting/BroadcastEvent only): https://developers.google.com/search/apis/indexing-api/v3/quickstart
- IndexNow — participating engines: https://www.indexnow.org/
- Top Stories no longer requires AMP: https://searchengineland.com/amp-wont-be-required-for-googles-top-stories-section-335276
