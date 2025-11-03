import crypto from 'node:crypto';
import { supabase } from './_supabase.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const { question_id, choice } = req.body || {};
  if (!question_id || !['Ja','Nei','Usikker'].includes(choice)) {
    return res.status(400).json({ error: 'Bad input' });
  }
  const ip = (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').toString();
  const ip_hash = crypto.createHash('sha256').update((process.env.SALT || 'cotells') + ip).digest('hex').slice(0,32);

  const since = new Date(Date.now() - 2*60*1000).toISOString();
  const { data: recent } = await supabase.from('votes')
    .select('id').gte('created_at', since).eq('ip_hash', ip_hash);
  if ((recent?.length || 0) > 0) return res.status(429).json({ error: 'Slow down' });

  const { error } = await supabase.from('votes').insert({ question_id, choice, ip_hash });
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json({ ok: true });
}
