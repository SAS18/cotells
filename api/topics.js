import { getJSON, getValue } from './_store.js';
function computeSentiment({ Ja=0, Nei=0, Usikker=0 }){ const total = Ja+Nei+Usikker; if(!total) return 0; return (Ja - Nei)/total; }
export default async function handler(req, res){
  const topics = (await getJSON('topics')) || [];
  const featured = await getJSON('featured');
  const enriched = await Promise.all(topics.map(async t => {
    const Ja = Number(await getValue(`vote:${t.id}:Ja`)) || 0;
    const Nei = Number(await getValue(`vote:${t.id}:Nei`)) || 0;
    const Usikker = Number(await getValue(`vote:${t.id}:Usikker`)) || 0;
    const votes = { Ja, Nei, Usikker, total: Ja+Nei+Usikker };
    const sentiment = computeSentiment(votes);
    return { ...t, votes, sentiment };
  }));
  let out = enriched;
  if(featured){ const i = enriched.findIndex(t=>t.id===featured); if(i>0) out=[enriched[i], ...enriched.slice(0,i), ...enriched.slice(i+1)]; }
  res.status(200).json({ topics: out, featured: featured || null });
}
