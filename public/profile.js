import {appendIllustrationCredit} from './place-visual.js';

const node=(tag,text,className='')=>{const element=document.createElement(tag);element.className=className;if(text)element.textContent=text;return element;};
const preferenceKey='atlas-reduced-motion';
export function restoreMotionPreference(){
  try{document.documentElement.classList.toggle('reduce-motion',localStorage.getItem(preferenceKey)==='true');}catch{}
}

// Public presentation of the prototype's three roles; private workspaces stay private.
export function mountProfile(host,places){
  const intro=node('p','Atlas connects curious travellers, the people behind remarkable places, and the editors who bring their stories together.','profile-intro');
  const grid=node('div',null,'profile-grid');
  const roles=[
    {name:'Explorer',heading:'Discover a world worth knowing.',body:'Find remarkable places, save what you love and create personal guides for wherever curiosity takes you.',art:'finland'},
    {name:'Place Owner',heading:'Help people discover the real story of your place.',body:'Share the details, photographs and local knowledge that help visitors understand your place.',art:'olivetti'},
    {name:'Atlas Editor',heading:'Curated with care. Guided by curiosity.',body:'Research destinations and shape their stories, illustrations and guides. AI assists the research; human editors review what is published.',art:'arsenale'}
  ];
  for(const role of roles){
    const place=places.find(p=>p.id===role.art),card=node('article',null,'profile-card'),image=node('img');
    image.src=place.image;image.alt=place.name+' — Meta-generated illustration';
    const copy=node('div',null,'profile-copy');
    copy.append(node('p',role.name,'profile-role'),node('h2',role.heading),node('p',role.body));
    if(role.name==='Explorer'){
      const explore=node('a','Explore places','profile-action');explore.href='#explore';copy.append(explore);
    }else copy.append(node('p','Workspace available in the full prototype.','profile-access'));
    appendIllustrationCredit(copy,{credit:place.credit});card.append(image,copy);grid.append(card);
  }
  const settings=node('section',null,'profile-settings');settings.append(node('h2','Accessibility'));
  const label=node('label'),input=node('input');input.type='checkbox';input.checked=document.documentElement.classList.contains('reduce-motion');
  input.addEventListener('change',()=>{document.documentElement.classList.toggle('reduce-motion',input.checked);try{localStorage.setItem(preferenceKey,String(input.checked));}catch{}});
  label.append(input,document.createTextNode(' Reduce interface motion'));settings.append(label);
  host.replaceChildren(intro,grid,settings);
}
