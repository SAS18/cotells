import { kv } from '@vercel/kv';
const hasKV = !!process.env.KV_REST_API_URL && !!process.env.KV_REST_API_TOKEN;
const mem = new Map();
export async function setJSON(key, val){ if(hasKV) return kv.set(key, JSON.stringify(val)); mem.set(key, JSON.stringify(val)); }
export async function getJSON(key){ if(hasKV){ const v = await kv.get(key); if(!v) return null; if(typeof v === 'string'){ try{ return JSON.parse(v);}catch{ return v;} } return v; } const v = mem.get(key); return v ? JSON.parse(v) : null; }
export async function incr(key){ if(hasKV) return kv.incr(key); const cur = Number(mem.get(key) || 0) + 1; mem.set(key, String(cur)); return cur; }
