
import { requireAdmin } from './_guard.js';
import { setJSON } from '../_store.js';
export default async function handler(req,res){
  if(!requireAdmin(req,res)) return;
  if(req.method!=='POST') return res.status(405).end();
  let body=req.body; if(!body || typeof body==='string'){ try{ body=JSON.parse(body);}catch{ body={}; } }
  const { ids } = body || {};
  if(!Array.isArray(ids)) return res.status(400).json({ error:'ids must be array' });
  const unique = Array.from(new Set(ids)).slice(0,10); // max 10
  await setJSON('active', unique);
  res.status(200).json({ ok:true, active: unique });
}
