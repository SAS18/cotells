import Parser from 'rss-parser';
import crypto from 'node:crypto';
import { supabase } from './_supabase.js';

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

function fingerprint(item) {
  const s = (item.title || '') + '|' + (item.link || '');
  return crypto.createHash('sha256').update(s).digest('hex').slice(0, 16);
}

function naiveSentiment(text='') {
  const pos = ['vekst','bedre','rekord','opp','vinner','styrke'];
  const neg = ['krise','ned','tap','mindre','svikt','svak'];
  let score = 0;
  for (const w of pos) if (text.toLowerCase().includes(w)) score += 0.1;
  for (const w of neg) if (text.toLowerCase().includes(w)) score -= 0.1;
  return Math.max(-1, Math.min(1, score));
}

export default async function handler(req, res) {
  try {
    const feeds = await Promise.allSettled(SOURCES.map(u => parser.parseURL(u)));
    const items = feeds.flatMap(f => f.value?.items || []);

    const byKey = new Map();
    for (const it of items) {
      const key = fingerprint(it);
      if (!byKey.has(key)) byKey.set(key, it);
    }
    const unique = [...byKey.values()].slice(0, 80);

    for (const it of unique) {
      const title = it.title?.trim() || 'Uten tittel';
      const url = it.link;
      const published = it.isoDate ? new Date(it.isoDate).toISOString() : new Date().toISOString();
      const summary = title;
      const sent = naiveSentiment(title);
      const ageHrs = Math.max(1, (Date.now() - new Date(published).getTime()) / 36e5);
      const momentum = Math.max(0, 1 / ageHrs) + 1;

      const { data: t } = await supabase
        .from('topics')
        .select('id')
        .eq('summary', summary)
        .maybeSingle();

      let topicId = t?.id;
      if (!topicId) {
        const { data: ins, error } = await supabase
          .from('topics')
          .insert({ title, summary, sentiment: sent, momentum_score: momentum })
          .select('id').single();
        if (error) continue;
        topicId = ins.id;

        await supabase.from('questions').insert({
          topic_id: topicId,
          text: `Støtter du: ${title}?`,
          lang: 'no',
          active: true
        });
      } else {
        await supabase.from('topics')
          .update({ momentum_score: momentum, sentiment: sent })
          .eq('id', topicId);
      }

      await supabase.from('news_items')
        .upsert({
          topic_id: topicId,
          source: new URL(url).hostname,
          url,
          published_at: published
        }, { onConflict: 'url' });
    }

    res.status(200).json({ ok: true, added: unique.length });
  } catch (e) {
    res.status(500).json({ ok: false, error: String(e) });
  }
}
