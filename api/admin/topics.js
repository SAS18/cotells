
import { requireAdmin } from './_guard.js';
import { getJSON, getValue } from '../_store.js';
export default async function handler(req,res){
  if(!requireAdmin(req,res)) return;
  const topics = await getJSON('topics') || [];
  const featured = await getJSON('featured');
  // attach vote counts
  const withCounts = await Promise.all(topics.map(async t => {
    const ja = Number(await getValue(`vote:${t.id}:Ja`)) || 0;
    const nei = Number(await getValue(`vote:${t.id}:Nei`)) || 0;
    const us = Number(await getValue(`vote:${t.id}:Usikker`)) || 0;
    return { ...t, votes: { Ja: ja, Nei: nei, Usikker: us, total: ja+nei+us } };
  }));
  res.status(200).json({ topics: withCounts, featured: featured || null });
}
