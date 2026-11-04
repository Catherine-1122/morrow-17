import {icon} from './icons.js';

// Pull from the existing description; never generate a quotation or attribution.
export function placeExcerpt(description,limit=112){
 const text=typeof description==='string'?description.split(/https?:\/\//i)[0].replace(/\s+/g,' ').trim():'';
 if(!text||/^(?:Visitor information is being researched\.?|No description(?: available)?\.?)$/i.test(text))return '';
 let first='';
 for(const {segment} of new Intl.Segmenter('en',{granularity:'sentence'}).segment(text)){
  first+=segment;
  // Sentence segmentation can split familiar place-name abbreviations such as St.
  if(!/\b(?:St|Mt|Mr|Mrs|Ms|Dr|Prof|Sr|Jr|Ave|Blvd|Rd|vs|[A-Z])\.$/u.test(first.trim()))break;
 }
 first=first.trim();
 if(first.length<=limit)return first;
 const prefix=first.slice(0,limit-1),space=prefix.lastIndexOf(' ');
 // Prefer a phrase boundary to cutting off a name or leaving a dangling “and”.
 const boundaries=[...prefix.matchAll(/[,;:]|\s+and\s+/g)].map(m=>m.index).filter(i=>i>=45);
 const end=boundaries.at(-1)??(space>limit/2?space:prefix.length);
 return prefix.slice(0,end).replace(/\s+(?:and|or|the|with|to|of|in|at|for|by|a|an)$/i,'').replace(/[\s,;:—–-]+$/,'')+'…';
}
const span=(className,text)=>{const n=document.createElement('span');n.className=className;if(text)n.textContent=text;return n;};

export function placeVisual(place,{compact=false,onFallback=()=>{}}={}){
 const visual=span('place-visual'+(compact?' place-visual-compact':''));
 const fallback=()=>{
  const excerpt=placeExcerpt(place.description,compact?84:112),quote=span('place-quote'+(excerpt?'':' place-quote-name'));
  quote.append(span('place-quote-label',excerpt?'From the guide':'A place to explore'));
  const mark=excerpt?span('place-quote-mark','“'):icon('bookmark');mark.setAttribute('aria-hidden','true');
  const body=span('place-quote-body');body.append(mark,span('place-quote-text',excerpt||place.name||'A place to explore'));quote.append(body);
  visual.replaceChildren(quote);visual.dataset.visual='quote';onFallback();
 };
 const art=place.guide_image||place.curated?.illustration_url||place.illustration?.url;
 if(art){
  const img=document.createElement('img');img.src=art;img.alt=compact?'':place.guide_image_alt||place.name+' — ATLAS illustration';img.loading='lazy';img.decoding='async';
  img.addEventListener('error',fallback,{once:true});visual.dataset.visual='image';visual.append(img);
 }else fallback();
 return visual;
}

// Public attribution follows the artwork; private generation evidence stays in Editor.
export function appendIllustrationCredit(parent,art,{disclosure=true,note=''}={}){
 const c=art?.credit||{},links=[['Source',c.source],['License',c.license_url]].filter(([,url])=>/^https?:\/\//.test(url||''));
 if(!c.text&&!c.license&&!links.length&&!note)return;
 const box=document.createElement(disclosure?'div':'small');box.className='illustration-credit';box.textContent=c.text||'';
 for(const [label,url]of links){const a=document.createElement('a');a.href=url;a.textContent=disclosure&&label==='License'&&c.license?c.license:label;a.target='_blank';a.rel='noopener noreferrer';if(box.textContent)box.append(document.createTextNode(' · '));box.append(a);}
 if(disclosure&&c.license&&!links.some(([label])=>label==='License'))box.append(document.createTextNode((box.textContent?' · ':'')+c.license));
 if(note){const p=document.createElement('p');p.textContent=note;box.append(p);}
 if(!disclosure){parent.append(box);return;}
 const details=document.createElement('details'),summary=document.createElement('summary');details.className='illustration-credits';summary.textContent='Image credits';details.append(summary,box);parent.append(details);
}
