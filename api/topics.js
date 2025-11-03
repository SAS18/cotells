import { getJSON } from './_store.js';
export default async function handler(req, res){
  const topics = await getJSON('topics');
  if(!topics){
    return res.status(200).json({ topics: [{
      id: 'demo1', title: 'Grønt industriløft',
      question: 'Støtter du økte statlige investeringer i grønn industri?', sentiment: 0.2
    }] });
  }
  res.status(200).json({ topics });
}
