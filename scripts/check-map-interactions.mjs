import {execFileSync} from 'node:child_process';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const session='lakefront-interactions',report=[];
function b(...args){const r=JSON.parse(execFileSync('agent-browser',['--session',session,'--json',...args],{encoding:'utf8',timeout:60000}));assert(r.success,JSON.stringify(r));return r.data}
const ev=code=>b('eval',code).result;
const ready=()=>b('wait','--fn',"document.querySelector('#section-list').children.length===10");
const coords=()=>ev(`({scrollY,x:new DOMMatrix(getComputedStyle(document.querySelector('#map-canvas')).transform).m41})`);
try{
 b('set','media','light','reduced-motion');
 for(const [width,height] of [[1440,1000],[390,844],[320,740]]){
  b('set','viewport',String(width),String(height));b('open','http://127.0.0.1:4179/?at=41.895');ready();
  assert(ev(`[...document.querySelectorAll('.marker-dot')].every(e=>!e.textContent.trim()&&getComputedStyle(e).width==='12px'&&getComputedStyle(e).height==='12px')`),'Every discovery uses the same dot');
  assert(ev(`!document.querySelector('#atlas .map-end')`),'End message must not cover map');
  const before=coords(),x=Math.round(width*.4),y=Math.round(height*.45);
  b('mouse','move',String(x),String(y));b('mouse','down');b('mouse','move',String(x+70),String(y-100));b('mouse','up');
  const after=coords();assert(Math.abs(after.scrollY-before.scrollY-100)<3,'Drag vertically');assert(Math.abs(after.x-before.x-70)<3,'Drag horizontally');assert(!ev(`document.querySelector('#place-card').open`),'Drag does not open a place');
  b('mouse','move','10','100');assert(Math.abs(coords().x-after.x)<1,'Pan position retained');
  b('click','#search-open');b('fill','#search-input','Navy Pier');b('click','[data-result="navy-pier"]');
  b('wait','--fn',`document.querySelector('#place-card').open`);
  assert(!ev(`document.querySelector('#place-card').matches(':modal')`),'Details leave map interactive');
  const boxes=ev(`({dot:document.querySelector('[data-place="navy-pier"] .marker-dot').getBoundingClientRect().toJSON(),card:document.querySelector('#place-card').getBoundingClientRect().toJSON()})`);
  assert(ev(`(()=>{const d=document.querySelector('[data-place="navy-pier"] .marker-dot').getBoundingClientRect();return document.elementFromPoint(d.x+d.width/2,d.y+d.height/2)?.closest('[data-place]')?.dataset.place==='navy-pier'})()`),'Navy Pier dot receives clicks');
  assert(boxes.dot.left>=0&&boxes.dot.right<=width&&boxes.dot.top>70,'Navy Pier dot visible');
  assert(!(boxes.dot.right>boxes.card.left&&boxes.dot.left<boxes.card.right&&boxes.dot.bottom>boxes.card.top&&boxes.dot.top<boxes.card.bottom),'Selected dot clear of card');
  if(width<701)assert(boxes.card.height<=height*.46,'Mobile card stays compact');
  const start=coords();b('mouse','move','80','220');b('mouse','down');b('mouse','move','110','180');b('mouse','up');assert(coords().scrollY>start.scrollY+35,'Can drag map with details open');
  b('screenshot',`/tmp/lakefront-navy-${width}.png`);b('press','Escape');assert(!ev(`document.querySelector('#place-card').open`));
  ev(`scrollTo({top:document.querySelector('#atlas').getBoundingClientRect().bottom+scrollY-innerHeight+100,behavior:'instant'})`);
  b('wait','--fn',`document.querySelector('#map-tools').inert`);
  assert(ev(`document.querySelector('.map-end').getBoundingClientRect().top>=document.querySelector('#atlas').getBoundingClientRect().bottom`));
  b('screenshot',`/tmp/lakefront-south-${width}.png`);
  report.push({viewport:`${width}x${height}`,status:'pass',checks:['uniform unnumbered dots','end message below map','two-axis drag','pan retained','drag suppresses clicks','nonmodal details','visible Navy Pier dot','drag with details open','compact mobile card','footer controls hidden']});
 }
 fs.writeFileSync('data/map-interaction-verification.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
}finally{b('close')}
