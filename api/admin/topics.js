
import { requireAdmin } from './_guard.js';
import { getJSON, getValue } from '../_store.js';
function computeSentiment({ Ja=0, Nei=0, Usikker=0 }){ const tot=Ja+Nei+Usikker; if(!tot) return 0; return (Ja-Nei)/tot; }
export default async function handler(req,res){
  if(!requireAdmin(req,res)) return;
  const topics = (await getJSON('topics')) || [];
  const active = (await getJSON('active')) || [];
  const enriched = await Promise.all(topics.map(async t=>{
    const Ja = Number(await getValue(`vote:${t.id}:Ja`)) || 0;
    const Nei = Number(await getValue(`vote:${t.id}:Nei`)) || 0;
    const Usikker = Number(await getValue(`vote:${t.id}:Usikker`)) || 0;
    const votes = { Ja, Nei, Usikker, total: Ja+Nei+Usikker };
    return { ...t, votes, sentiment: computeSentiment(votes) };
  }));
  res.status(200).json({ topics: enriched, active });
}
