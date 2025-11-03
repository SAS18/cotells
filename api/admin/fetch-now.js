
import { requireAdmin } from './_guard.js';
export default async function handler(req, res){
  if(!requireAdmin(req, res)) return;
  if(req.method !== 'POST') return res.status(405).end();
  try{
    const url = `https://${req.headers.host}/api/fetch`;
    const r = await fetch(url);
    const j = await r.json();
    res.status(200).json({ ok:true, result:j });
  }catch(e){ res.status(500).json({ ok:false, error:String(e) }); }
}
