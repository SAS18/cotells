
import Parser from 'rss-parser';
import { setJSON } from './_store.js';
const parser = new Parser();

const MAIN_SOURCES = {
  NRK: ['https://www.nrk.no/toppsaker.rss'],
  VG: ['https://www.vg.no/rss/feed/?format=rss'],
  Aftenposten: ['https://www.aftenposten.no/rss'],
  E24: ['https://www.e24.no/rss'],
  DN: ['https://www.dn.no/rss'],
  TV2: ['https://www.tv2.no/rss/nyheter/']
};
const CATEGORY_SOURCES = {
  Sport: ['https://www.vg.no/rss/sport/','https://www.nrk.no/toppsport.rss','https://www.tv2.no/rss/sport/'],
  Økonomi: ['https://www.e24.no/rss','https://www.dn.no/rss','https://www.nrk.no/nyheter/okonomi-1.11761043?rss=1'],
  Kultur: ['https://www.nrk.no/kultur/toppsaker.rss','https://www.vg.no/rss/rampelys/']
};
const short=(t)=> (t && t.length>120 ? t.slice(0,117)+'…' : (t || 'dette forslaget'));
const toTopic=(item,label)=>({
  id:'t_'+Math.random().toString(36).slice(2,9),
  title:item.title?.trim()||'Uten tittel',
  question:`Støtter du: ${short(item.title)}?`,
  sentiment:0,
  url:item.link||null,
  source:label || (item.link ? new URL(item.link).hostname : 'ukjent'),
  published_at:item.isoDate||item.pubDate||null
});
async function parseFirst(url){ try{ const f=await parser.parseURL(url); return f.items?.[0]||null;}catch{return null;} }
async function freshestFrom(urls){
  const res=await Promise.all(urls.map(parseFirst));
  const items=res.filter(Boolean);
  if(!items.length) return null;
  items.sort((a,b)=> new Date(b.isoDate||b.pubDate||0) - new Date(a.isoDate||a.pubDate||0));
  return items[0];
}
export default async function handler(req,res){
  try{
    const topics=[];
    for(const [label,urls] of Object.entries(MAIN_SOURCES)){ const i=await freshestFrom(urls); if(i) topics.push(toTopic(i,label)); }
    for(const [cat,urls] of Object.entries(CATEGORY_SOURCES)){ const f=await freshestFrom(urls); if(f){ const t=toTopic(f,cat); t.section=cat; topics.push(t);} }
    if(!topics.length) return res.status(200).json({ok:true,topics:0});
    await setJSON('topics', topics);
    res.status(200).json({ok:true,topics:topics.length});
  }catch(e){ res.status(500).json({ok:false,error:String(e)}); }
}
