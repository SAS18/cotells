import { supabase } from './_supabase.js';

export default async function handler(req, res) {
  const { data, error } = await supabase
    .from('topics')
    .select('id,title,summary,sentiment,momentum_score,created_at,questions(id,text,active)')
    .order('momentum_score', { ascending: false })
    .limit(20);
  if (error) return res.status(500).json({ error: error.message });
  res.status(200).json({ topics: data });
}
