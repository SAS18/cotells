// /api/fetch.js
import Parser from 'rss-parser';
import { setJSON } from './_store.js';

const parser = new Parser();

// 1) ÉN sak per hovedavis
const MAIN_SOURCES = {
  NRK: ['https://www.nrk.no/toppsaker.rss'],
  VG: ['https://www.vg.no/rss/feed/?format=rss'],
  Aftenposten: ['https://www.aftenposten.no/rss'],
  E24: ['https://www.e24.no/rss'],
  DN: ['https://www.dn.no/rss'],
  TV2: ['https://www.tv2.no/rss/nyheter/']
  // legg gjerne til flere
};

// 2) ÉN sak per kategori (tar den ferskeste på tvers av kilder)
const CATEGORY_SOURCES = {
  Sport: [
    'https://www.vg.no/rss/sport/',
    'https://www.nrk.no/toppsport.rss',
    'https://www.tv2.no/rss/sport/'
  ],
  Økonomi: [
    'https://www.e24.no/rss',
    'https://www.dn.no/rss',
    'https://www.nrk.no/nyheter/okonomi-1.11761043?rss=1'
  ],
  Kultur: [
    'https://www.nrk.no/kultur/toppsaker.rss',
    'https://www.vg.no/rss/rampelys/'
  ]
  // legg gjerne til flere kategorier/kilder
};

const short = (t) => (t && t.length > 120 ? t.slice(0, 117) + '…' : (t || 'dette forslaget'));
const toTopic = (item, sourceLabel) => ({
  id: 't_' + Math.random().toString(36).slice(2, 9),
  title: item.title?.trim() || 'Uten tittel',
  question: `Støtter du: ${short(item.title)}?`,
  sentiment: 0,
  url: item.link || null,
  source: sourceLabel || (item.link ? new URL(item.link).hostname : 'ukjent'),
  published_at: item.isoDate || item.pubDate || null
});

async function parseFirst(feedUrl) {
  try {
    const feed = await parser.parseURL(feedUrl);
    return feed.items?.[0] || null;
  } catch {
    return null;
  }
}

async function freshestFrom(urls) {
  const results = await Promise.all(urls.map(parseFirst));
  const items = results.filter(Boolean);
  if (!items.length) return null;
  items.sort((a, b) => new Date(b.isoDate || b.pubDate || 0) - new Date(a.isoDate || a.pubDate || 0));
  return items[0];
}

export default async function handler(req, res) {
  try {
    const topics = [];

    // A) én fersk sak per hovedavis
    for (const [label, urls] of Object.entries(MAIN_SOURCES)) {
      const firstOk = await freshestFrom(urls);
      if (firstOk) topics.push(toTopic(firstOk, label));
    }

    // B) én fersk sak per kategori (samler på tvers av kilder)
    for (const [cat, urls] of Object.entries(CATEGORY_SOURCES)) {
      const freshest = await freshestFrom(urls);
      if (freshest) {
        const t = toTopic(freshest, cat);
        // Marker at dette er kategorivalg (greit i admin)
        t.section = cat;
        topics.push(t);
      }
    }

    // Fallback: hvis alt feiler, hent “masse” fra et sett med standardfeeds
    if (!topics.length) {
      const fallbackFeeds = [
        ...Object.values(MAIN_SOURCES).flat(),
        ...Object.values(CATEGORY_SOURCES).flat()
      ];
      const feeds = await Promise.allSettled(fallbackFeeds.map(u => parser.parseURL(u)));
      const items = feeds.flatMap(f => f.value?.items || []).slice(0, 30);
      for (const it of items) topics.push(toTopic(it));
    }

    // Rydd opp: fjern dubletter på tittel + kilde
    const seen = new Set();
    const unique = topics.filter(t => {
      const key = (t.title || '') + '|' + (t.source || '');
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    // Sorter nyest først (valgfritt)
    unique.sort((a, b) => new Date(b.published_at || 0) - new Date(a.published_at || 0));

    await setJSON('topics', unique);
    res.status(200).json({ ok: true, topics: unique.length });
  } catch (e) {
    res.status(500).json({ ok: false, error: String(e) });
  }
}
