import {execFileSync} from 'node:child_process';import assert from 'node:assert/strict';import fs from 'node:fs';
const session='lakefront-check';const report=[];
function b(...args){const r=JSON.parse(execFileSync('agent-browser',['--session',session,'--json',...args],{encoding:'utf8',timeout:60000}));assert(r.success,JSON.stringify(r));return r.data}
const ev=code=>b('eval',code).result;
const visibleTiles="[...document.querySelectorAll('.map-tile')].filter(e=>{const r=e.getBoundingClientRect();return r.bottom>80&&r.top<innerHeight}).every(e=>e.dataset.loaded==='true')";
try{
b('set','media','light','reduced-motion');
for(const [w,h] of [[1440,1000],[390,844],[320,740]]){
 console.log('Checking viewport',w,h);b('set','viewport',String(w),String(h));b('open','http://127.0.0.1:4179/');b('wait','--fn',"document.querySelector('#section-list').children.length===10");b('wait','--fn',visibleTiles);
 assert.equal(ev('document.querySelectorAll("h1").length'),1);assert.equal(ev('document.querySelectorAll(".map-marker").length'),38);assert(!ev('document.documentElement.scrollWidth>innerWidth'));assert.equal(ev('getComputedStyle(document.documentElement).scrollBehavior'),'auto');
 b('click','#search-open');b('fill','#search-input','a place that does not exist');assert.equal(ev('document.querySelectorAll(".search-result").length'),0);
 b('fill','#search-input','Promontory');assert.equal(ev('document.querySelectorAll(".search-result").length'),1);b('click','[data-result="promontory-point"]');b('wait','--fn',visibleTiles);assert.equal(ev('document.querySelector("#card-title").textContent'),'Promontory Point');assert(ev('location.search.includes("place=promontory-point")'));assert(ev('document.querySelector("#place-card").open'));
 const pos=ev('scrollY');const card=ev('document.querySelector("#place-card").getBoundingClientRect().toJSON()');assert(card.left>=0&&card.right<=w);b('press','Escape');assert(!ev('document.querySelector("#place-card").open'));assert(Math.abs(ev('scrollY')-pos)<3,'closing card changed position');
 b('click','#filter-toggle');b('click','[data-filter="beach"]');assert(ev('[...document.querySelectorAll(".map-marker:not(.hidden)")].every(e=>e.classList.contains("beach"))'));b('click','#filter-toggle');b('click','[data-filter="all"]');assert.equal(ev('document.querySelectorAll(".map-marker:not(.hidden)").length'),38);
 b('click','#section-open');b('scrollintoview','[data-region="9"]');b('click','[data-region="9"]');b('wait','--fn',"document.querySelector('#region-number').textContent==='10'");b('wait','--fn',visibleTiles);console.log('Section jump',ev('({region:document.querySelector("#region-number").textContent,scrollY,href:location.href})'));assert.equal(ev('document.querySelector("#region-number").textContent'),'10');
 b('click','#north-jump');assert(ev('scrollY<2'));b('screenshot',`/tmp/lakefront-final-${w}.png`);
 b('open','http://127.0.0.1:4179/places/promontory-point/');assert(ev('document.querySelector("h1").textContent.includes("Promontory")'));assert(!ev('document.documentElement.scrollWidth>innerWidth'));b('click','.back-link');b('wait','--fn','document.querySelector("#place-card").open');assert.equal(ev('document.querySelector("#card-title").textContent'),'Promontory Point');
 report.push({viewport:`${w}x${h}`,status:'pass',checks:['render','no horizontal overflow','38 coordinate markers','lazy tiles','search and empty state','shareable place URL','modal and Escape','position preserved','category filter','section jumps','return from destination','reduced motion']});
}
for(const route of ['/guide/','/history/','/places/','/credits/']){b('open','http://127.0.0.1:4179'+route);assert(!ev('document.documentElement.scrollWidth>innerWidth'));assert.equal(ev('document.querySelectorAll("h1").length'),1);b('wait','--fn','[...document.images].filter(i=>i.getBoundingClientRect().top<innerHeight).every(i=>i.complete&&i.naturalWidth>0)');report.push({route,status:'pass'})}
fs.writeFileSync('data/browser-verification.json',JSON.stringify({tested:'2026-11-18',report},null,2));console.log(JSON.stringify(report,null,2));
}finally{b('close')}
