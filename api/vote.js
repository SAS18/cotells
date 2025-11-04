
import crypto from 'crypto';
import { incr, exists, setValue } from './_store.js';

function parseCookie(header){
  const out={};
  (header||'').split(';').forEach(p=>{ const [k,...v]=p.trim().split('='); if(!k) return; out[k]=decodeURIComponent(v.join('=')); });
  return out;
}
function hashIp(ip,salt){ try{ return crypto.createHash('sha256').update((ip||'') + '|' + (salt||'')).digest('hex').slice(0,24); }catch{ return 'nohash'; } }

export default async function handler(req,res){
  if(req.method!=='POST') return res.status(405).end();
  let body = req.body;
  if(!body || typeof body === 'string'){ try{ body = JSON.parse(body); } catch { body = {}; } }
  const { question_id, choice } = body || {};
  if(!question_id || !['Ja','Nei','Usikker'].includes(choice)) return res.status(400).json({ error:'Bad input' });

  const cookies = parseCookie(req.headers['cookie']);
  const cid = req.headers['x-client-id'] || cookies['cid'] || '';
  const ip = (req.headers['x-forwarded-for']||'').split(',')[0].trim();
  const iphash = hashIp(ip, process.env.SALT || 'cotells');

  // keys for duplicate check
  const k1 = `voted:user:${cid}:${question_id}`;
  const k2 = `voted:ip:${iphash}:${question_id}`;

  if(cid && await exists(k1)) return res.status(409).json({ error:'Du har allerede stemt på denne saken.' });
  if(await exists(k2)) return res.status(409).json({ error:'Du har allerede stemt på denne saken.' });

  await incr(`vote:${question_id}:${choice}`);
  if(cid) await setValue(k1, 1);
  await setValue(k2, 1);

  res.status(201).json({ ok:true });
}
