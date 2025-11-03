
import { requireAdmin } from './_guard.js';
import { setValue } from '../_store.js';
export default async function handler(req, res){
  if(!requireAdmin(req, res)) return;
  if(req.method !== 'POST') return res.status(405).end();
  let body = req.body;
  if (!body || typeof body === 'string') { try { body = JSON.parse(body) } catch { body = {}; } }
  const { id } = body || {};
  if(!id) return res.status(400).json({ error:'Missing id' });
  for (const c of ['Ja','Nei','Usikker']){ await setValue(`vote:${id}:${c}`, 0); }
  res.status(200).json({ ok:true });
}
