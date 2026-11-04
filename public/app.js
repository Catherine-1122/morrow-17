import {icon} from './icons.js';
import {placeVisual,appendIllustrationCredit} from './place-visual.js';
import {mountPassportGuide,savedPlaceGuide} from './assets/guides/passport-guide.js';

const $ = selector => document.querySelector(selector);
const el = (tag, text, cls) => {
  const node = document.createElement(tag);
  if (text) node.textContent = text;
  if (cls) node.className = cls;
  return node;
};
const button = (label, action, cls) => {
  const b = el('button',label,cls); b.type='button'; b.addEventListener('click',action); return b;
};
const link = (label,href) => {
  const a = el('a',label); a.href=href; a.target='_blank'; a.rel='noopener noreferrer'; return a;
};
async function api(path, data) {
  const response = await fetch(path,data ? {method:'POST',headers:{'Content-Type':'application/json'}, body:JSON.stringify(data)} : {});
  const result = await response.json();
  if (!response.ok) throw Error(result.error || 'Request failed.');
  return result;
}

const pages = {explore:'Explore',search:'Search',saved:'Saved',book:'Book'};
const navigationIcons = {explore:'compass',search:'search',saved:'bookmark',book:'book'};
let places = [], byId = new Map(), saved = [], liveAvailable = false;
let reader, requestNumber = 0, question = 'Architecture in Venice', mode = 'sample', lastSearch;
const current = () => Object.hasOwn(pages,location.hash.slice(1)) ? location.hash.slice(1) : 'explore';
const status = text => { $('#status').textContent = text; };
const osm = p => 'https://www.openstreetmap.org/?mlat='+p.coordinates[1]+'&mlon='+p.coordinates[0]+'#map=17/'+p.coordinates[1]+'/'+p.coordinates[0];
function saveButton(place) {
  const b = button('',async () => {
    b.disabled = true;
    try {
      const value = !saved.includes(place.id);
      saved = (await api('/api/saved',{id:place.id,saved:value})).saved;
      status(value ? place.name+' saved.' : place.name+' removed from Saved.');
      document.querySelectorAll('[data-save]').forEach(node=>updateSave(node));
      if (current()==='saved') showBoard(saved.map(id=>byId.get(id)), $('#content'));
    } catch (e) {status(e.message);}
    finally {b.disabled = false;}
  },'save');
  b.dataset.save=place.id; updateSave(b); return b;
}
function updateSave(node) {
  const id=node.dataset.save, active=saved.includes(id), name=byId.get(id).name;
  node.setAttribute('aria-pressed',String(active)); node.setAttribute('aria-label',(active?'Remove ':'Save ')+name);
  node.replaceChildren(icon(active?'bookmark-check':'bookmark'));
}
function detail(p) {
  const body=$('#detail-body');
  const image=el('img'); image.src=p.image; image.alt=p.name+' architectural illustration';
  body.replaceChildren(image,el('h2',p.name),el('p',p.area+' · Venice','region'),el('p',p.description));
  body.append(link('Official Biennale listing',p.source),document.createTextNode(' · '),link('View on map',osm(p)),saveButton(p));
  appendIllustrationCredit(body,{credit:p.credit});
  $('#detail').showModal();
}
function card(p,match) {
  const article=el('article',null,'card');
  const artwork=button('',()=>detail(p),'art');artwork.setAttribute('aria-label','Open '+p.name);
  artwork.append(placeVisual({name:p.name,guide_image:p.image}));
  const body=el('div',null,'card-copy');
  body.append(el('h2',p.name),el('p',p.area+' · Venice','region'),el('p',p.description,'description'));
  if (match?.reason) {
    const research=el('p',null,'draft');
    research.append(el('strong','Muse research'),el('br'),document.createTextNode(match.reason),document.createTextNode(' '),link('Source',match.source));body.append(research);
  }
  appendIllustrationCredit(body,{credit:p.credit});
  const actions=el('div',null,'actions');
  const view=button('View place',()=>detail(p),'action');view.append(icon('arrow-right'));
  actions.append(view,saveButton(p));body.append(actions);article.append(artwork,body);return article;
}
function showBoard(items,host,matches=[]) {
  const grid=el('div',null,'board');
  for (const p of items) grid.append(card(p,matches.find(m=>m.id===p.id)));
  host.replaceChildren(items.length ? grid : el('p',current()==='saved'?'Save a place in Explore or Search to start your guide.':'No sample places match this question.'));
}
function searchView(host) {
  const form=el('form',null,'search-form'),label=el('label','What would you like to discover?','question');
  const input=el('input');input.required=true;input.maxLength=400;input.value=question;label.append(input);
  const modeLabel=el('label','Research mode'),choice=el('select');
  for (const [value,name] of [['sample','Sample · offline'],['live','Live Meta']]) {
    const opt=el('option',name);opt.value=value;opt.disabled=value==='live'&&!liveAvailable;choice.append(opt);
  }
  choice.value=mode;modeLabel.append(choice);
  const run=el('button','Search places','primary');run.type='submit';form.append(label,modeLabel,run);
  const results=el('div');host.replaceChildren(form,results);
  const display = response => {
    status((response.mode==='live'?'Live Meta research':'Sample search')+' · '+response.matches.length+' results');
    showBoard(response.matches.map(m=>byId.get(m.id)),results,response.matches);
  };
  if (lastSearch) display(lastSearch);
  form.addEventListener('submit',async e=>{
    e.preventDefault();question=input.value.trim();mode=choice.value;run.disabled=true;
    lastSearch=null;results.replaceChildren();status(mode==='live'?'Muse is researching the official listings…':'Searching the sample…');
    try {
      const result=await api('/api/search',{question,mode});
      if(form.isConnected){lastSearch=result;display(result);}
    } catch(error){if(form.isConnected)status(error.message);}
    finally{run.disabled=false;}
  });
}
function bookView(host) {
  if (!saved.length) {host.textContent='Save a venue to open your pocket guide.';return;}
  const trip={id:'venice',name:'Venice',places:saved};
  const placesForGuide=new Map(places.map(p=>[p.id,{...p,location_label:p.area,address:p.area,
    category:'Venice Biennale',sources:[{url:p.source}],illustration:{url:p.image,credit:p.credit}}]));
  const data=savedPlaceGuide(trip,placesForGuide);
  data.map={image:'/assets/guides/venice-map.webp',width:1760,height:500};
  for(const entry of data.entries) entry.map_point=byId.get(entry.place_id).point;
  const workspace=el('div',null,'trips-workspace');host.append(workspace);
  reader=mountPassportGuide(workspace,{data,trip,onCreateGuide:()=>{location.hash='explore';},
    onOpenPlace:id=>window.open(osm(byId.get(id)),'_blank','noopener,noreferrer')});
}
async function render() {
  const version=++requestNumber, page=current(), host=$('#content');
  reader?.destroy();reader=null;host.replaceChildren();status('');
  $('h1').textContent=pages[page];
  $('#context').textContent=({explore:'Venice Biennale · 3 illustrated places',search:'Searching in Venice, Italy',saved:'Places saved on this demo server',book:'Venice Biennale · Your pocket guide'})[page];
  for(const a of $('nav').children) if(a.hash==='#'+page)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');
  try {
    const state=await api('/api/state');if(version!==requestNumber)return;
    saved=state.saved;liveAvailable=state.liveAvailable;
    if(page==='explore')showBoard(places,host);
    else if(page==='saved')showBoard(saved.map(id=>byId.get(id)),host);
    else if(page==='book')bookView(host);
    else searchView(host);
  }catch(error){if(version===requestNumber)status(error.message);}
}
for(const [id,label] of Object.entries(pages)) {
  const a=el('a');a.href='#'+id;a.append(icon(navigationIcons[id]),document.createTextNode(label));$('nav').append(a);
}
$('#close').addEventListener('click',()=>$('#detail').close());
try {places=await api('/places.json');byId=new Map(places.map(p=>[p.id,p]));await render();window.addEventListener('hashchange',render);}
catch(error){status('Could not load the sample. '+error.message);}
