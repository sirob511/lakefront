import {execFileSync} from 'node:child_process';
import fs from 'node:fs';
import assert from 'node:assert/strict';
const session='lakefront-hotspots';
const places=JSON.parse(fs.readFileSync('data/places.json'));
const b=(...args)=>{const r=JSON.parse(execFileSync('agent-browser',['--session',session,'--json',...args],{encoding:'utf8',timeout:60000}));assert(r.success,JSON.stringify(r));return r.data};
const ev=code=>b('eval',code).result;
const reports=[];
try{
 b('set','media','light','reduced-motion');
 for(const [w,h] of [[1440,1000],[390,844],[320,740]]){
  b('set','viewport',String(w),String(h));b('open','http://127.0.0.1:4179/');b('wait','--fn',"document.querySelector('#search-dialog').siteSearch");
  const records=[];
  // Small batches keep each browser evaluation responsive on slow machines.
  for(let start=0;start<places.length;start+=15){
   const batch=places.slice(start,start+15).map(p=>({id:p.id,name:p.name}));
   records.push(...ev(`(async()=>{const places=${JSON.stringify(batch)},records=[],frame=()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))),push=history.pushState,replace=history.replaceState;history.pushState=()=>{};history.replaceState=()=>{};try{for(const p of places){document.querySelector('#search-dialog').siteSearch.open();document.querySelector('[data-result="'+p.id+'"]').click();await frame();const dot=document.querySelector('[data-place="'+p.id+'"] .marker-dot'),d=dot.getBoundingClientRect(),c=document.querySelector('#place-card').getBoundingClientRect();const visible=d.left>=0&&d.right<=innerWidth&&d.top>=70&&d.bottom<=innerHeight,coveredByCard=d.right>c.left&&d.left<c.right&&d.bottom>c.top&&d.top<c.bottom;document.querySelector('#place-card').close();await frame();const r=dot.getBoundingClientRect(),x=r.x+r.width/2,y=r.y+r.height/2,target=document.elementFromPoint(x,y);target?.dispatchEvent(new PointerEvent('pointermove',{bubbles:true,pointerType:'mouse',isPrimary:true,clientX:x,clientY:y}));await frame();document.elementFromPoint(x,y)?.dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true,detail:1,clientX:x,clientY:y}));const filtersClosed=document.querySelector('#filters').hidden,openedCorrectPlace=document.querySelector('#place-card').open&&document.querySelector('#card-title').textContent===p.name;document.querySelector('#place-card').close();await frame();const focusReturned=document.activeElement?.dataset.place===p.id;records.push({id:p.id,visible,coveredByCard,openedCorrectPlace,filtersClosed,focusReturned})}return records}finally{history.pushState=push;history.replaceState=replace}})()`));
  }
  const failures=records.filter(p=>!p.visible||p.coveredByCard||!p.openedCorrectPlace||!p.filtersClosed||!p.focusReturned);
  console.log(JSON.stringify({viewport:[w,h],checked:records.length,failures}));
  reports.push({viewport:`${w}x${h}`,checked:records.length,failures});
  assert.deepEqual(failures,[],'Every exact dot center must open its own discovery and stay clear of the card');
 }
 fs.writeFileSync('data/hotspot-interaction-audit.json',JSON.stringify({reviewedAt:'2026-11-18',method:'Search each discovery, verify its dot is visible outside its card, close the card, then dispatch a coordinate-based hover and pointer click through the actual element under the dot. Includes overlapping hit targets at all three viewport sizes.',reports},null,2)+'\n');
}finally{b('close')}
