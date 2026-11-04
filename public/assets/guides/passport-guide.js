import {appendIllustrationCredit} from '../../place-visual.js';
import {icon} from '../../icons.js';
const el=(tag,cls='',text)=>{const n=document.createElement(tag);n.className=cls;if(text!==undefined)n.textContent=text;return n;};
const button=(text,action,cls='',name)=>{const b=el('button',cls);b.type='button';if(name)b.append(icon(name));b.append(document.createTextNode(text));b.addEventListener('click',action);return b;};
const link=(label,url)=>{const a=el('a','',label);if(/^https?:\/\//.test(url||'')){a.href=url;a.target='_blank';a.rel='noopener noreferrer';}return a;};
// Preview dimensions match the print layout; pan stays inside the map edges.
export function previewGeometry(stage,width,height,{zoom=false,pan={x:0,y:0}}={}){
 const [w,h]=stage==='closed'?[352,500]:stage==='map'?[3520,1000]:[1824,1016];
 const inset=width<600?24:80,fit=Math.max(.01,Math.min((width-inset)/w,(height-inset)/h));
 const scale=stage==='map'&&zoom?Math.max(1,fit):Math.min(stage==='closed'?1.3:1,fit);
 const limitX=Math.max(0,(w*scale-width)/2),limitY=Math.max(0,(h*scale-height)/2);
 const x=Math.max(-limitX,Math.min(limitX,pan.x)),y=Math.max(-limitY,Math.min(limitY,pan.y));
 return {w,h,scale,x:(width-w*scale)/2+x,y:(height-h*scale)/2+y,pan:{x,y}};
}
export function guideFaces(data,ids){
 const included=new Set(ids);
 const guide=data.entries.map((e,i)=>({...e,generic:data.generic,guide_title:data.title,count:data.entries.length,kind:i?'feature':'cover',included:included.has(e.place_id)}));
 const sketches=Array.from({length:10},(_,i)=>({kind:'sketch',n:i+1,heading:i?'Sketch page '+(i+1):'Sketches',generic:data.generic}));
 return {guide,sketches};
}
function area(e){if(e.generic)return e.area||'Saved places';return /Giardini/.test(e.venue)?'Giardini':/Arsenale/.test(e.venue)?'Arsenale':/San Marco/.test(e.venue)?'San Marco':'Venice';}
function panel(face){
 const p=el('div','passport-page passport-page-'+face.kind);p.dataset.folio=face.n;
 if(face.kind==='cover'){
  const brand=el('div','passport-cover-brand');brand.append(el('span','','ATLAS'),el('span','passport-mono','by Hado Labs'));
  const img=el('img','passport-cover-image');if(face.img)img.src=face.img;img.alt=face.caption;img.width=304;img.height=230;
  const title=el('div','passport-cover-title');title.append(el('span','passport-mono',face.generic?'Illustrated places':'61st Venice Art Biennale'),el('span','passport-cover-city',face.generic?face.guide_title:'Venice'),el('span','passport-literary',face.generic?'From your saved discoveries':'In Minor Keys · a personal guide'));
  p.append(brand,...(face.img?[img]:[el('p','','Illustration awaiting review')]),title,el('div','passport-cover-foot passport-mono',face.generic?'Saved places · stories and sketches':'9 May–22 November 2026 · unfold for the map'));return p;
 }
 const header=el('div','passport-page-running');header.append(el('span','passport-mono',face.kind==='sketch'?'Sketches':area(face)),el('span','passport-mono',face.kind==='sketch'?'S'+String(face.n).padStart(2,'0'):String(face.n).padStart(2,'0')+' / '+face.count));p.append(header);
 if(face.n===10&&face.kind==='feature')header.insertBefore(el('span','passport-back-brand','ATLAS'),header.lastChild);
 const body=el('div','passport-page-body');p.append(body);
 if(face.kind==='sketch'){
  if(face.n===1){const title=el('div','passport-sketch-title');title.append(el('strong','','Sketches'),el('span','',face.generic?'Draw what you want to remember. Note the date and the place.':'Draw what you want to remember. Note the date and the pavilion.'));body.append(title);}
  const lines=el('div','passport-sketch-lines passport-mono');for(const label of ['Date','Place']){const line=el('span','',label);line.append(el('i'));lines.append(line);}const space=el('div','passport-sketch-space');space.setAttribute('aria-label','Blank sketch space');space.append(el('span','passport-mono',String(face.n).padStart(2,'0')));body.append(lines,space);return p;
 }
 if(!face.included){body.append(el('h3','','This page is not in your trip'),el('p','','Add '+face.heading.split(' — ')[0]+' from Saved to include it in this guide.'));return p;}
 const img=el('img','passport-feature-image');if(face.img)img.src=face.img;img.alt=face.caption;img.width=304;img.height=104;if(face.img)body.append(img);else body.append(el('p','','Illustration awaiting review'));
 const heading=el('div','passport-feature-heading');heading.append(el('span','passport-number'+(face.coords?'':' passport-outline'),String(face.n)),el('h3','',face.heading));body.append(heading);
 const credits=el('div','passport-feature-credits');if(face.generic)credits.append(el('span','passport-literary',face.category||''));else credits.append(el('span','passport-literary',face.exhibition),el('span','passport-artists',face.artists),el('span','passport-mono','Curator · '+face.curator));body.append(credits,el('p','passport-feature-copy',face.copy));
 const foot=el('div','passport-feature-foot');foot.append(el('span','passport-mono',face.venue));if(face.n===3&&face.notes)foot.append(el('span','passport-practical',face.notes));body.append(foot);return p;
}
export function mountPassportGuide(parent,{data,trip,onOpenPlace,onCreateGuide}){
 const root=el('section','passport-guide');root.setAttribute('aria-label',data.generic?data.title+' pocket guide':'Venice pocket guide');parent.append(root);
 const {guide,sketches}=guideFaces(data,trip.places),available=new Set(trip.places);
 let state='closed',zoom=false,pan={x:0,y:0},geometry,disposed=false,read=null,returnFocus=null,pointer=null,suppressClick=false;
 const header=el('header','passport-header'),label=el('p','passport-eyebrow passport-mono','Pocket guide · '+(data.generic?data.title:'Venice Biennale 2026'));
 const tabs=el('div','passport-tabs');tabs.setAttribute('role','tablist');tabs.setAttribute('aria-label','Guide view');
 const actions=el('div','passport-header-actions');
 function comingSoon(label,primary=false,name){const b=button(label,()=>{},'passport-action'+(primary?' passport-action-primary':''),name);b.disabled=true;b.title='Coming soon';b.append(el('span','passport-soon','Coming soon'));return b;}
 actions.append(comingSoon('Download free',true,'download'),comingSoon('Order printed'),button('New guide',()=>onCreateGuide?.(),'passport-action passport-action-ghost','plus'));
 header.append(label,tabs,actions);root.append(header);
 const body=el('div','passport-body'),preview=el('div','passport-preview'),viewport=el('div','passport-viewport'),stage=el('div','passport-stage');
 viewport.id='pocket-preview-'+trip.id;viewport.setAttribute('role','tabpanel');viewport.setAttribute('aria-label','Guide preview');viewport.append(stage);preview.append(viewport);body.append(preview);root.append(body);
 const copy=el('aside','passport-copy');
 const intro=el('div','passport-intro');intro.append(el('p','passport-eyebrow passport-mono','Atlas pocket guides'),el('h2','','Your travels, beautifully collected.'),el('p','passport-lead',"Turn the places you've discovered and saved into a personal pocket guide, made just for you."),el('p','passport-description',"Each guide brings together your favourite places, curated stories, illustrations and maps in a format designed for exploring. Keep it on your phone, or turn it into a beautifully printed booklet to carry, annotate and treasure."));
 const features=el('div','passport-features');
 for(const [name,title,text]of [['smartphone','Take it with you, even offline.','Coming soon: download your guide to your phone for free, with your saved places, stories and map ready to explore without a connection.'],['book-open','Make it something to keep.','Coming soon: a printed pocket edition with illustrated pages, a fold-out map and space for your own sketches and notes. A little book of everywhere you’ve been, and everywhere you hope to go.']]){const feature=el('div');feature.append(icon(name),el('h3','',title),el('p','',text));features.append(feature);}
 const ctas=el('div','passport-ctas');ctas.append(comingSoon('Download free offline guide',false,'download'),comingSoon('Order printed pocket guide',true));
 const another=el('div','passport-another'),anotherCopy=el('div');anotherCopy.append(el('strong','','Planning somewhere else?'),el('p','','Start a new guide from any of your saved places.'));another.append(anotherCopy,button('Create another guide',()=>onCreateGuide?.(),'passport-action','plus'));
 copy.append(intro,features,ctas,button('Open the guide',()=>go('guide'),'passport-open-guide','arrow-right'),another);body.append(copy);
 const mapStatus=button('Click the map to zoom in',()=>toggleZoom(),'passport-map-status','zoom-in');mapStatus.setAttribute('aria-label','Zoom in on map');preview.append(mapStatus);
 const attribution=el('p','passport-map-attribution');attribution.append(link('© OpenStreetMap contributors','https://www.openstreetmap.org/copyright'),document.createTextNode(' · '),link('OpenMapTiles','https://openmaptiles.org/'),document.createTextNode(' · '),link('OpenFreeMap','https://openfreemap.org/'));preview.append(attribution);
 const states=[['closed','Cover','book'],['guide','Guide','book-open'],...(data.map?[['map','Map','map']]:[]),['journal','Sketches','pencil']];
 const tabButtons=states.map(([key,text,name],i)=>{const b=button(text,()=>go(key),'passport-tab',name);b.id='pocket-tab-'+trip.id+'-'+key;b.setAttribute('role','tab');b.setAttribute('aria-controls',viewport.id);b.dataset.stage=key;b.addEventListener('keydown',event=>{let n;if(event.key==='ArrowRight')n=(i+1)%states.length;if(event.key==='ArrowLeft')n=(i+states.length-1)%states.length;if(event.key==='Home')n=0;if(event.key==='End')n=states.length-1;if(n!==undefined){event.preventDefault();tabButtons[n].focus();go(states[n][0]);}});tabs.append(b);return b;});
 const dialog=el('dialog','passport-reader');dialog.setAttribute('aria-label','Guide page reader');
 const readerHeader=el('header','passport-reader-header'),readerEyebrow=el('p','passport-mono'),close=button('',()=>dialog.close(),'passport-close','x');close.setAttribute('aria-label','Close guide reader');readerHeader.append(readerEyebrow,close);
 const readerBody=el('div','passport-reader-body'),pageSlot=el('div','passport-reader-page'),pageScale=el('div','passport-reader-scale');pageSlot.append(pageScale);
 const prev=button('',()=>readAt(read.side,read.i-1),'passport-reader-previous','arrow-left'),next=button('',()=>readAt(read.side,read.i+1),'passport-reader-next','arrow-right');prev.setAttribute('aria-label','Previous page');next.setAttribute('aria-label','Next page');
 readerBody.append(prev,pageSlot,next);const readerMeta=el('details','passport-reader-meta illustration-credits'),readerMetaSummary=el('summary','','Image credits'),readerMetaBody=el('div','passport-reader-meta-body');readerMeta.append(readerMetaSummary,readerMetaBody);dialog.append(readerHeader,readerBody,readerMeta);root.append(dialog);
 function mapSheet(){
  const sheet=el('div','passport-map-sheet'),img=el('img','passport-map-image');img.src=data.map.image;img.alt='Venice street map with numbered guide locations';img.draggable=false;sheet.append(img);
  const folds=el('div','passport-fold-lines');folds.setAttribute('aria-hidden','true');for(let i=0;i<10;i++)folds.append(el('span'));sheet.append(folds);
  for(const e of data.entries){
   if((e.n!==1&&!available.has(e.place_id))||!e.map_point)continue;
   const pin=button(String(e.n),()=>openReader('guide',e.n-1),'passport-map-pin'+(e.n===1?' passport-site-pin':''));pin.dataset.pin=e.n;pin.setAttribute('aria-label',(e.n+' · '+e.heading)+' — open guide page');pin.style.left=e.map_point.x*3520/data.map.width+'px';pin.style.top=e.map_point.y*1000/data.map.height+'px';sheet.append(pin);
  }
  const legend=el('div','passport-map-key'),keyHead=el('div','passport-key-header');keyHead.append(el('strong','','What to see'),el('span','passport-mono','9 May–22 Nov 2026'));legend.append(keyHead);
  const keyList=el('div','passport-key-list');for(const e of data.entries.filter(e=>available.has(e.place_id))){const row=button('',()=>openReader('guide',e.n-1),'passport-key-item'),text=el('span','',e.heading.split(' — ')[0]);text.append(el('span','passport-mono',' · '+area(e)));row.append(el('span','passport-number',String(e.n)),text);keyList.append(row);}
  legend.append(keyList,el('p','','Building and pavilion markers are not verified entrances. The Arsenale pin marks the general site.'));sheet.append(legend);
  sheet.addEventListener('click',event=>{if(event.target.closest('button,a'))return;if(suppressClick){suppressClick=false;return;}toggleZoom(event);});return sheet;
 }
 function renderStage(){
  stage.replaceChildren();
  if(state==='map')stage.append(mapSheet());
  else{
   const list=state==='closed'?[guide[0]]:state==='journal'?sketches:guide,grid=el('div',state==='closed'?'passport-cover-preview':'passport-page-grid');
   list.forEach((face,i)=>{const b=button('',()=>openReader(state==='journal'?'journal':'guide',i),'passport-page-button');b.setAttribute('aria-label',(state==='closed'?'Zoom in on the cover':state==='journal'?'Open sketch page '+(i+1):'Read guide page '+(i+1)+': '+(i?face.heading:'Cover')));b.append(panel(face));const col=i%5,row=Math.floor(i/5);b.style.setProperty('--dx',(912-(col*368+176))+'px');b.style.setProperty('--dy',(508-(row*516+250))+'px');b.style.setProperty('--ry',(i%2?80:-80)+'deg');b.style.setProperty('--delay',(state==='journal'?i*45:Math.abs(col-2)*90+row*140)+'ms');b.style.transformOrigin=col<2?'right center':col>2?'left center':'center';grid.append(b);});stage.append(grid);
  }
 }
 function layout(){
  if(disposed||!viewport.clientWidth||!viewport.clientHeight)return;
  geometry=previewGeometry(state,viewport.clientWidth,viewport.clientHeight,{zoom,pan});pan=geometry.pan;
  Object.assign(stage.style,{width:geometry.w+'px',height:geometry.h+'px',transform:`translate(${geometry.x}px,${geometry.y}px) scale(${geometry.scale})`});
 }
 function updateMapState(){root.dataset.zoomed=String(zoom);mapStatus.replaceChildren(icon(zoom?'zoom-out':'zoom-in'),document.createTextNode(zoom?'Drag to move · click to fit':'Click the map to zoom in'));mapStatus.setAttribute('aria-label',zoom?'Fit map to preview':'Zoom in on map');}
 function go(value){
  if(disposed)return;state=value;zoom=false;pan={x:0,y:0};pointer=null;suppressClick=false;root.dataset.stage=state;
  if(dialog.open)dialog.close();copy.hidden=state!=='closed';actions.hidden=state==='closed';mapStatus.hidden=attribution.hidden=state!=='map';
  viewport.tabIndex=state==='map'?0:-1;viewport.setAttribute('aria-label',state==='map'?'Guide map. Click to zoom, then drag or use arrow keys to move. Escape fits the map.':'Guide preview');
  tabButtons.forEach((b,i)=>{const selected=states[i][0]===state;b.setAttribute('aria-selected',String(selected));b.tabIndex=selected?0:-1;if(selected)viewport.setAttribute('aria-labelledby',b.id);});
  renderStage();updateMapState();layout();
 }
 function toggleZoom(event){
  if(state!=='map'||!geometry)return;
  if(zoom){zoom=false;pan={x:0,y:0};}
  else{const rect=viewport.getBoundingClientRect(),px=event?event.clientX-rect.left:rect.width/2,py=event?event.clientY-rect.top:rect.height/2,wx=(px-geometry.x)/geometry.scale,wy=(py-geometry.y)/geometry.scale;zoom=true;const nextGeometry=previewGeometry(state,rect.width,rect.height,{zoom});pan={x:(1760-wx)*nextGeometry.scale,y:(500-wy)*nextGeometry.scale};}
  updateMapState();layout();
 }
 viewport.addEventListener('pointerdown',event=>{if(state!=='map'||!zoom||event.button!==0||event.target.closest('button,a'))return;suppressClick=false;pointer={id:event.pointerId,x:event.clientX,y:event.clientY,pan:{...pan},moved:false};viewport.setPointerCapture(event.pointerId);});
 viewport.addEventListener('pointermove',event=>{if(!pointer||event.pointerId!==pointer.id)return;const dx=event.clientX-pointer.x,dy=event.clientY-pointer.y;if(Math.hypot(dx,dy)>5)pointer.moved=true;pan={x:pointer.pan.x+dx,y:pointer.pan.y+dy};layout();});
 function endPointer(event){if(!pointer||event.pointerId!==pointer.id)return;suppressClick=pointer.moved;if(viewport.hasPointerCapture(event.pointerId))viewport.releasePointerCapture(event.pointerId);pointer=null;}
 viewport.addEventListener('pointerup',endPointer);viewport.addEventListener('pointercancel',endPointer);
 // Pointer capture can retarget the click to the frame rather than the map sheet.
 viewport.addEventListener('click',event=>{if(event.target===viewport){if(suppressClick){suppressClick=false;return;}toggleZoom(event);}});
 viewport.addEventListener('keydown',event=>{if(event.target!==viewport||state!=='map')return;if(event.key==='Enter'||event.key===' '){event.preventDefault();toggleZoom();}else if(event.key==='Escape'&&zoom){event.preventDefault();toggleZoom();}else if(zoom&&['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(event.key)){event.preventDefault();pan.x+=event.key==='ArrowLeft'?120:event.key==='ArrowRight'?-120:0;pan.y+=event.key==='ArrowUp'?120:event.key==='ArrowDown'?-120:0;layout();}});
 function resizeReader(){if(!dialog.open)return;const small=innerWidth<600,scale=Math.max(.1,Math.min((innerHeight-(small?190:160))/500,(innerWidth-(small?40:240))/352,1.8));pageSlot.style.width=352*scale+'px';pageSlot.style.height=500*scale+'px';pageScale.style.transform='scale('+scale+')';}
 function readAt(side,i){
  const list=side==='guide'?guide:sketches;if(i<0||i>=list.length)return;read={side,i};const f=list[i];readerEyebrow.textContent=(side==='guide'?'Guide':'Sketch')+' page '+(i+1)+' of '+list.length+' · ← → to turn · Esc to close';pageScale.replaceChildren(panel(f));readerMeta.open=false;readerMetaBody.replaceChildren();readerMeta.hidden=side!=='guide';
  if(side==='guide'&&(f.included||f.kind==='cover')){
   if(f.kind==='cover')readerMetaBody.append(el('p','',f.copy));readerMetaBody.append(el('p','',f.notes),el('p','passport-reader-caption',f.caption));
   const links=el('div','passport-reader-actions');links.append(link('Official listing',f.source));if(onOpenPlace&&available.has(f.place_id))links.append(button('Open in OpenStreetMap',()=>{dialog.close();onOpenPlace(f.place_id);},'passport-action','map'));readerMetaBody.append(links);
   if(f.art)appendIllustrationCredit(readerMetaBody,f.art,{disclosure:false});
   const c=f.image_credit;if(c){readerMetaBody.append(el('p','',(f.image_approval_status==='approved'?'Approved illustration. ':'Illustration draft. ')+'Depicts architecture or historical displays, not the 2026 installation.'),el('p','',c['Adaptation / credit']),el('p','',c['Reference photographer']+' · '+c['Reference date']+' · '+c['Reference license']));if(/^https?:\/\//.test(c['Reference source']))readerMetaBody.append(link('Reference photograph',c['Reference source']));if(c['License link'])readerMetaBody.append(document.createTextNode(' · '),link('License',c['License link']));}
  }
  prev.disabled=i===0;next.disabled=i===list.length-1;resizeReader();
 }
 function openReader(side,i){returnFocus=document.activeElement;readAt(side,i);if(!dialog.open)dialog.showModal();resizeReader();close.focus();}
 dialog.addEventListener('click',event=>{if(event.target===dialog||event.target===readerBody)dialog.close();});
 dialog.addEventListener('close',()=>{read=null;if(returnFocus?.isConnected)returnFocus.focus({preventScroll:true});});
 dialog.addEventListener('keydown',event=>{if(event.key==='ArrowLeft'&&read){event.preventDefault();readAt(read.side,read.i-1);}if(event.key==='ArrowRight'&&read){event.preventDefault();readAt(read.side,read.i+1);}});
 const observer=new ResizeObserver(()=>{layout();resizeReader();});observer.observe(viewport);window.addEventListener('resize',resizeReader);go('closed');
 return {openPage:i=>openReader('guide',i),destroy(){disposed=true;observer.disconnect();window.removeEventListener('resize',resizeReader);if(dialog.open)dialog.close();root.remove();}};
}

export function savedPlaceGuide(trip,places){
 const selected=trip.places.map(id=>places.get(id)).filter(Boolean).slice(0,10);if(!selected.length)return null;
 const entries=selected.map((p,i)=>({n:i+1,place_id:p.id,heading:p.name,img:p.illustration?.url||p.curated?.illustration_url||null,caption:p.name+' — ATLAS illustration',copy:(p.description||'').slice(0,420),category:p.category||'',area:p.location_label||'Saved places',venue:p.address||p.location_label||'',notes:'Saved place '+(i+1)+' of '+trip.places.length+'.',source:p.sources?.find(s=>s.url)?.url||'',coords:p.coordinates,art:p.illustration}));
 return {generic:true,title:trip.name.replace(' — illustrated discoveries',''),entries,related_place_ids:trip.places,map:null};
}
