export function icon(name, className='') {
  const node=document.createElement('span');
  node.className=`ui-icon icon-${name}${className?' '+className:''}`;
  node.setAttribute('aria-hidden','true');
  return node;
}
