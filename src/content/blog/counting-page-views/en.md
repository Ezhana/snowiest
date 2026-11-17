---
title: 'Counting Each Page View Once'
description: 'Wiring GTM, GA4 and Search Console into the site: client-side navigations needed their own event, the first page was counted twice, and verifying any of it meant not polluting the data.'
pubDate: '2026-09-15'
tags:
  - engineering
lang: en
---

This site never had analytics. Not out of principle — it just never reached the point where the numbers mattered. When I finally wanted to know which posts people actually read, I didn't even know whether anyone had opened the site at all.

So I wired up Google Tag Manager, GA4 and Search Console together. It looks like pasting two snippets. Most of the time went into one question: why was a single page view reported twice.

## Keep the tag out of the critical path

Use the official snippet from the GTM UI instead of the short version that loads `gtm.js` directly with a `src` attribute. The official one first pushes `gtm.start` and `gtm.js` onto `dataLayer` and only then creates an `async` script; the direct version skips exactly that step, and the container starts at the wrong moment.

The snippet is `is:inline` in `<head>`, so the container starts before the bundled scripts. When ClientRouter swaps the head, identical inline scripts are not executed a second time, so the container runs exactly once per document.

Everything else is the browser's job: `async` never blocks parsing, and analytics only writes to the local `dataLayer` array. If `googletagmanager.com` is blocked or times out, the page still renders — there is simply no data. On networks where the domain is unreachable, that difference matters.

Analytics only ships in production builds (`import.meta.env.PROD`), so `astro dev` traffic never reaches the container, and the `<noscript>` iframe is there for readers without JavaScript.

## On a single-page app, page_view is yours to send

The site uses `<ClientRouter />`, so in-site navigation never reloads the document. GA4's built-in page views follow browser history, and in this setup they didn't fire reliably: navigating with `pushState` produced no page_view, and going back produced one only sometimes.

So I send it myself:

```js
window.dataLayer.push({
  event: 'page_view',
  page_title: document.title,
  page_location: window.location.href,
  page_path: window.location.pathname + window.location.search,
})
```

The timing is `astro:page-load`: the new page's `title` is already in place and the route change has finished. The event also fires on the initial load, so a URL variable deduplicates it — the same URL is never pushed twice, and the equality only breaks when you actually move to another page.

In GTM there is one GA4 event tag with the event name `page_view`, triggered by a custom event named `page_view`. Without that tag, the pushes go nowhere.

## One page view, two hits

After shipping, the check said: two hits on the first page, one per client-side navigation.

One came from the code. The other came from the Google tag: on load it runs `gtag('config', …)`, and `send_page_view` defaults to `true`, so it reports the first page on its own.

I tried two wrong things first. Pausing the `page_view` event tag reduced the first page to one hit — and silently killed client-side navigations too. Deleting the Google tag entirely left nothing at all: a GA4 event tag needs it to initialize the destination, so the event tag alone has nowhere to send.

The right fix is a **parameter in the Google tag's configuration settings**: `send_page_view` = `false`. Two places are easy to get wrong here:

- The Google tag has no checkbox for this; it only accepts configuration parameters. I first added the parameter to the `page_view` event tag's event parameters, which merely adds an unread field to each event and leaves the automatic page view untouched.
- The published container shows which one you did. Configuration parameters land on the destination tag's `vtp_configSettingsTable`; event parameters land on `vtp_eventSettingsTable`. Fetching `gtm.js` once tells you whether the setting took effect.

## Verify without touching the real data

The worst part of analytics debugging is that the verification itself pollutes the data. Every visit to this site lands in the real property, so the checks ran locally: `pnpm build`, `astro preview`, and headless Chrome driven over CDP.

One rule matters: **block the collect requests, not the container**. Let `gtm.js` load for real and let the tags actually run; only block `google-analytics.com`. Then read the URL and body of `Network.requestWillBeSent` and look at four fields — `en`, `dl`, `dt`, and `_s`.

`_s` is the page view sequence and increments with every report. One `_s` per page state means exactly one hit; two different `_s` values for the same page means it was counted twice.

There was one trap here too. My first attempt intercepted with the `Fetch` domain and answered 204 (or aborted the request), and gtag retried once — which looks exactly like a duplicate report. Count requests at the network layer; don't trust the illusion your interception mechanism creates.

## robots.txt and Search Console

I added `public/robots.txt`: allow everything, with `Sitemap` pointing at `sitemap-index.xml`.

That file does not actually apply to Google. The site is a GitHub Pages project site served under `/snowiest/`, and crawlers only read `robots.txt` at the domain root. The root currently answers 404, which means "no restrictions", so indexing is unaffected; the file is mostly for other tools and to declare where the sitemap lives.

In Search Console I added the URL-prefix property `https://ezhana.github.io/snowiest/` and submitted the sitemap. Ownership is verified with an HTML meta tag in `<head>`, which is simpler than the container method — our GTM snippet is assembled at render time, so the page source has no standard script block for a verifier to find.

## What I'm taking away

- Analytics defaults tend to over-count. Work out how many hits one page view produces before looking at a report.
- UI toggles are not evidence; the container configuration is. To confirm a setting, fetch the public `gtm.js` and see which tag carries the parameter.
- Multiple GTM containers share one `dataLayer`: every container processes the same event, so `page_view` has to be configured in exactly one place.
- Debugging analytics requires being able to block reporting, otherwise every check corrupts your own data.
- Treat analytics scripts as a non-critical dependency, especially on networks where Google is blocked.

Each page view now produces exactly one page_view, and reading the report no longer starts with dividing by two.
