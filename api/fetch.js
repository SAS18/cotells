import Parser from 'rss-parser';
import { setJSON } from './_store.js';
const parser = new Parser();
const SOURCES = [
  'https://www.nrk.no/toppsaker.rss',
  'https://www.vg.no/rss/feed/?limit=50&format=rss',
  'https://www.aftenposten.no/rss',
  'https://www.e24.no/rss',
  'https://www.dn.no/rss',
  'https://www.abcnyheter.no/nyheter/rss',
  'https://www.tu.no/rss'
];
const fallbackQuestion = (title) => (title && title.length > 120 ? title.slice(0,117)+'…' : (title || 'dette forslaget'));
export default async function handler(req, res){
  try{
    const feeds = await Promise.allSettled(SOURCES.map(u => parser.parseURL(u)));
    const items = feeds.flatMap(f => f.value?.items || []).slice(0,40);
    const topics = items.map((it, idx) => ({
      id: `t_${idx}`,
      title: it.title?.trim() || 'Uten tittel',
      question: `Støtter du: ${fallbackQuestion(it.title)}?`,
      sentiment: 0,
      url: it.link || null,
      source: it.link ? new URL(it.link).hostname : 'ukjent',
      published_at: it.isoDate || null
    }));
    await setJSON('topics', topics);
    res.status(200).json({ ok: true, topics: topics.length });
  }catch(e){ res.status(500).json({ ok:false, error: String(e) }); }
}
