const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const [places,config]=await Promise.all([fetch(`/places-data.json?v=${$('#atlas').dataset.revision}`).then(r=>r.json()),fetch(`/map-config.json?v=${$('#atlas').dataset.mapRevision}`).then(r=>r.json())]);
const byId=new Map(places.map(p=>[p.id,p]));
const symbols={beach:'≈',nature:'♧',harbor:'⚓',landmark:'◇'};
const regions=[['Edgewater & Montrose',41.979,'Quiet beaches & the Magic Hedge'],['Harbors of Lincoln Park',41.945,'Masts, lawns & open water'],['Lincoln Park & North Avenue',41.920,'Park paths meet the skyline'],['The Gold Coast',41.906,'Sand at the foot of the city'],['Streeterville & Navy Pier',41.895,'A city reaching into the lake'],['The downtown lakefront',41.879,'Grand parks & a thousand sails'],['Museum Campus',41.863,'Big discoveries, wider horizons'],['The southern harbors',41.834,'A different view of downtown'],['Burnham Park & the Point',41.803,'Long lawns & limestone edges'],['Jackson Park & South Shore',41.781,'Lagoons, history & one last beach']];
const boundaries=[41.966,41.926,41.911,41.902,41.888,41.867,41.838,41.820,41.792];
const projection=config.projection;
const mapY=lat=>(projection.originLat-lat)*projection.scaleY+projection.offsetY,mapX=lon=>(lon-projection.originLon)*projection.scaleX+projection.offsetX;
const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let scale=1,zoom=1,shiftX=0,shiftY=0,panX=0,currentLat=41.988,currentMapX=0,filter='all',selected=null,focusPlace=null,lastTrigger=null,raf=0,urlTimer;
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const mobile=()=>innerWidth<=700;
const canvas=$('#map-canvas'),atlas=$('#atlas'),miniDot=$('#mini-dot');
const markers=$$('.map-marker').map(el=>({el,p:byId.get(el.dataset.place),label:el.querySelector('.marker-label')}));
const controls=[$('#map-tools'),$('.overview'),$('.route-key'),$('.map-zoom')];
let lastRegion=-1;
const clampX=x=>Math.max(Math.min(0,innerWidth-config.width*scale),Math.min(0,x));
function viewAnchor(){
 const card=$('#place-card');
 if(card.open){const r=card.getBoundingClientRect();return mobile()?{x:innerWidth*.5,y:(70+r.top)/2}:{x:Math.max(100,r.left*.58),y:innerHeight*.44}}
 return {x:innerWidth*(mobile()?.53:.62),y:innerHeight*.44};
}
function overviewPoint(y){
 const points=config.overview.positionSamples;
 let lo=0,hi=points.length-1;
 while(lo<hi){const mid=(lo+hi)>>1;if(points[mid][0]<y)lo=mid+1;else hi=mid}
 const b=points[lo],a=points[Math.max(0,lo-1)],t=a[0]===b[0]?0:Math.max(0,Math.min(1,(y-a[0])/(b[0]-a[0])));
 return [a[1]+(b[1]-a[1])*t,a[2]+(b[2]-a[2])*t];
}
let keyboardNavigation=false;addEventListener('keydown',e=>{if(e.key==='Tab')keyboardNavigation=true});addEventListener('pointerdown',()=>{keyboardNavigation=false},{passive:true});
function cameraX(y){const points=config.camera,i=Math.max(0,Math.min(points.length-2,Math.floor(y/60))),a=points[i],b=points[i+1],t=Math.max(0,Math.min(1,(y-a[0])/(b[0]-a[0])));return a[1]+(b[1]-a[1])*t}
function matchesFilter(p,value=filter){return value==='all'||(value==='art'?/sculpture|monument|memorial|fountain|public art/.test(p.subtype??''):value==='culture'?/theater|theatre|performance|museum|conservatory|venue/.test(p.subtype??''):p.category===value)}
// Labels are measured and arranged on layout/filter changes, never in the scroll loop.
// Every circle remains centered on the source coordinate, even when its label is hidden.
function arrangeMarkers(){
 const inverse=1/scale,factor=1;
 for(const m of markers){
  m.el.style.transform=`translate(-50%,-50%) scale(${inverse})`;
  const left=mapX(m.p.lon)<cameraX(mapY(m.p.lat))-45;
  m.el.classList.toggle('align-left',left);m.el.classList.remove('label-muted');m.left=left;
 }
 const measurements=markers.map(m=>({...m,width:m.label.offsetWidth*factor,height:m.label.offsetHeight*factor}));
 const occupied=[];
 const pinBoxes=markers.filter(m=>matchesFilter(m.p)).map(m=>{const x=mapX(m.p.lon)*scale,y=mapY(m.p.lat)*scale,r=10;return {id:m.p.id,l:x-r,r:x+r,t:y-r,b:y+r}});
 const intersects=(a,b)=>a.l<b.r&&a.r>b.l&&a.t<b.b&&a.b>b.t;
 measurements.sort((a,b)=>(b.p.featured!==false)-(a.p.featured!==false)||Number(!!b.p.story)-Number(!!a.p.story));
 for(const m of measurements){
  if(!matchesFilter(m.p))continue;
  const x=mapX(m.p.lon)*scale,y=mapY(m.p.lat)*scale,gap=20;
  let chosen=null;
  for(const left of [m.left,!m.left]){
   const box={l:left?x-gap-m.width:x+gap,r:left?x-gap:x+gap+m.width,t:y-m.height/2-4,b:y+m.height/2+4};
   if(!occupied.some(o=>intersects(box,o))&&!pinBoxes.some(o=>o.id!==m.p.id&&intersects(box,o))){chosen=box;m.el.classList.toggle('align-left',left);break}
  }
  m.el.classList.toggle('label-muted',!chosen);if(chosen)occupied.push(chosen);
 }
}
function layout(){
 scale=(mobile()?.72:Math.min(1.12,innerWidth/1440))*zoom;shiftY=mobile()?170:0;
 canvas.style.width=`${config.width}px`;atlas.style.height=`${config.height*scale+shiftY}px`;
 arrangeMarkers();updatePosition();
}
function updatePosition(){
 const rect=atlas.getBoundingClientRect(),anchor=viewAnchor();const y=Math.max(0,Math.min(config.height,(anchor.y-rect.top-shiftY)/scale));currentLat=projection.originLat-(y-projection.offsetY)/projection.scaleY;
 const focusId=focusPlace||(keyboardNavigation?document.activeElement?.dataset?.place:null);
 const focus=focusId&&byId.has(focusId)?mapX(byId.get(focusId).lon):cameraX(y);
 shiftX=clampX(anchor.x-focus*scale+panX);
 currentMapX=(anchor.x-shiftX)/scale;
 canvas.style.transform=`translate(${shiftX.toFixed(2)}px,${shiftY}px) scale(${scale})`;
 let i=boundaries.findIndex(b=>currentLat>=b);if(i<0)i=9;
 if(i!==lastRegion){$('#region-number').textContent=String(i+1).padStart(2,'0');$('#region-name').textContent=regions[i][0];$('#progress-text').textContent=regions[i][0].toUpperCase();lastRegion=i}
 const p=overviewPoint(y);miniDot.setAttribute('cx',p[0]);miniDot.setAttribute('cy',p[1]);
 const atEnd=rect.bottom<innerHeight-24,cardOpen=$('#place-card').open;
 controls.forEach(el=>{const away=atEnd||(cardOpen&&(mobile()||el.classList.contains('overview')));el.classList.toggle('tools-away',away);el.inert=away});
 document.body.classList.toggle('place-open',cardOpen);
 raf=0;
}
function schedulePosition(){if(!raf)raf=requestAnimationFrame(updatePosition)}
addEventListener('scroll',()=>{schedulePosition();clearTimeout(urlTimer);urlTimer=setTimeout(()=>{if(!selected&&!$('#place-card').open&&scrollY>300){const u=new URL(location.href);u.searchParams.set('at',currentLat.toFixed(4));history.replaceState({},'',u)}},500)},{passive:true});
addEventListener('wheel',e=>{if(!e.target.closest('dialog'))releaseCameraFocus()},{passive:true});
function preserveViewLayout(){
 const lat=currentLat,x=currentMapX,atTop=scrollY<2;focusPlace=null;layout();
 const top=atlas.offsetTop+shiftY+mapY(lat)*scale-viewAnchor().y;
 scrollTo({top:atTop?0:Math.max(0,top),behavior:'instant'});
 const y=Math.max(0,Math.min(config.height,(viewAnchor().y-atlas.getBoundingClientRect().top-shiftY)/scale));
 panX=(cameraX(y)-x)*scale;updatePosition();
}
addEventListener('resize',preserveViewLayout);
function jump(lat,{smooth=true,focusId=null}={}){focusPlace=focusId;panX=0;const top=atlas.offsetTop+shiftY+mapY(lat)*scale-viewAnchor().y;scrollTo({top:Math.max(0,top),behavior:smooth&&!reduced.matches?'smooth':'instant'});schedulePosition()}
function changeZoom(direction){zoom=Math.max(1,Math.min(2.5,zoom+direction*.5));preserveViewLayout();$('#zoom-level').textContent=`${zoom}×`;$('#zoom-out').disabled=zoom===1;$('#zoom-in').disabled=zoom===2.5}
$('#zoom-in').onclick=()=>changeZoom(1);$('#zoom-out').onclick=()=>changeZoom(-1);
// Keep the camera where the user leaves it while allowing the route to follow scroll.
function releaseCameraFocus(){
 if(!focusPlace&&!keyboardNavigation)return;
 focusPlace=null;keyboardNavigation=false;
 panX=shiftX-(viewAnchor().x-cameraX(mapY(currentLat))*scale);
}
function holdCamera(){
 focusPlace=null;
 const y=Math.max(0,Math.min(config.height,(viewAnchor().y-atlas.getBoundingClientRect().top-shiftY)/scale));
 panX=shiftX-(viewAnchor().x-cameraX(y)*scale);
}
let drag=null,suppressClickUntil=0;
atlas.addEventListener('pointerdown',e=>{
 if(!e.isPrimary){finishDrag();return}
 if(e.button!==0||e.target.closest('a,button:not(.map-marker),input,summary'))return;
 scrollTo({top:scrollY,behavior:'instant'});
 drag={id:e.pointerId,startX:e.clientX,startY:e.clientY,x:e.clientX,y:e.clientY,moved:false};
});
atlas.addEventListener('pointermove',e=>{
 if(!drag||e.pointerId!==drag.id)return;
 if(!drag.moved&&Math.hypot(e.clientX-drag.startX,e.clientY-drag.startY)<6)return;
 if(!drag.moved){drag.moved=true;releaseCameraFocus();atlas.setPointerCapture(e.pointerId);atlas.classList.add('dragging');$('#filters').hidden=true;$('#filter-toggle').setAttribute('aria-expanded','false')}
 const dx=e.clientX-drag.x,dy=e.clientY-drag.y,wanted=clampX(shiftX+dx);
 drag.x=e.clientX;drag.y=e.clientY;
 scrollTo({top:scrollY-dy,behavior:'instant'});
 const y=Math.max(0,Math.min(config.height,(viewAnchor().y-atlas.getBoundingClientRect().top-shiftY)/scale));
 panX=wanted-(viewAnchor().x-cameraX(y)*scale);updatePosition();e.preventDefault();
});
function finishDrag(e){
 if(!drag||(e&&e.pointerId!==drag.id))return;
 if(drag.moved)suppressClickUntil=performance.now()+300;
 if(atlas.hasPointerCapture(drag.id))atlas.releasePointerCapture(drag.id);
 drag=null;atlas.classList.remove('dragging');
}
addEventListener('pointerup',finishDrag);addEventListener('pointercancel',finishDrag);addEventListener('blur',()=>finishDrag());
atlas.addEventListener('click',e=>{if(performance.now()<suppressClickUntil){e.preventDefault();e.stopImmediatePropagation()}},true);
atlas.addEventListener('dragstart',e=>e.preventDefault());
// Two-dimensional loading: keep both distant rows and offscreen city/lake columns idle.
const tileObserver=new IntersectionObserver(entries=>{for(const e of entries)if(e.isIntersecting){loadTile(e.target);tileObserver.unobserve(e.target)}},{rootMargin:'450px 250px'});
async function loadTile(el){
 if(el.dataset.loaded)return;el.dataset.loaded='loading';
 const img=new Image();img.alt='';img.width=1300;img.height=config.tileHeight;img.decoding='async';
 img.src=`/assets/map/tile-${el.dataset.tile}.webp?v=${atlas.dataset.mapRevision}`;
 try{await img.decode();el.replaceChildren(img);el.dataset.loaded='true'}catch{el.dataset.loaded='';el.innerHTML='<p class="tile-error">This part of the map could not load. <button type="button">Try again</button></p>';el.querySelector('button').onclick=()=>loadTile(el)}
}
$$('.map-tile').forEach(el=>tileObserver.observe(el));

function toast(message){$('#toast').textContent=message;$('#toast').classList.add('visible');clearTimeout(toast.timer);toast.timer=setTimeout(()=>$('#toast').classList.remove('visible'),3200)}
async function share(id){const url=new URL(location.origin+'/');if(id)url.searchParams.set('place',id);else url.searchParams.set('at',currentLat.toFixed(4));try{await navigator.clipboard.writeText(url.href);toast('Link copied. Share a little lakefront.')}catch{if(navigator.share){try{await navigator.share({title:'Lakefront Trail · Chicago',url:url.href})}catch{}}else{prompt('Copy this lakefront link:',url.href)}}}
function openCard(id,{travel=false,historyUpdate=true}={}){
 const p=byId.get(id);if(!p)return;selected=id;lastTrigger=document.activeElement;
 $$('.map-marker').forEach(el=>el.classList.toggle('selected',el.dataset.place===id));
 const photo=p.photo;const image=photo?`<img class="card-photo${photo.fit==='contain'?' photo-fit-contain':''}" src="${escape(photo.src)}" alt="${escape(photo.alt)}" width="${photo.width||960}" height="${photo.height||640}" decoding="async">`:`<div class="card-location"><span aria-hidden="true">${symbols[p.category]}</span><p>${escape(p.regionName)}<small>${p.lat.toFixed(4)}° N · ${Math.abs(p.lon).toFixed(4)}° W</small></p></div>`;
 $('#card-content').innerHTML=`${image}${photo?.caption?`<p class="card-photo-caption">${escape(photo.caption)}</p>`:''}<div class="card-content"><p class="eyebrow">${symbols[p.category]} ${escape((p.subtype||p.category).toUpperCase())} <span>·</span> ${escape(p.access.toUpperCase())}</p><h2 id="card-title">${escape(p.name)}</h2><p class="card-description">${escape(p.description)}</p><p class="card-fact">${escape(p.fact)}</p><div class="card-practical"><strong>A little before-you-go.</strong><br>${escape(p.practical)}</div><p class="card-location-source"><a href="${escape(p.coordinateUrl||p.officialUrl)}" target="_blank" rel="noopener">View mapped location ↗</a></p><div class="card-actions"><a href="${p.story?`/places/${p.id}/`:`/places/#${p.id}`}">Discover this place <span aria-hidden="true">↗</span></a><button id="share-place">Share ↗</button></div>${photo?`<p class="photo-credit">Photo: ${escape(photo.author)} · <a href="${escape(photo.licenseUrl)}" target="_blank" rel="noopener">${escape(photo.license)}</a> · <a href="${escape(photo.sourceUrl)}" target="_blank" rel="noopener">Source</a></p>`:'<p class="photo-credit">Visitor information from the linked official source.</p>'}</div>`;
 $('#share-place').onclick=()=>share(id);if(!$('#place-card').open)$('#place-card').show();$('#card-content').scrollTop=0;$('#place-card .close-button').focus({preventScroll:true});
 const marker=markers.find(m=>m.p.id===id).el.getBoundingClientRect(),card=$('#place-card').getBoundingClientRect();
 const obscured=marker.right>card.left&&marker.left<card.right&&marker.bottom>card.top&&marker.top<card.bottom;
 if(travel||obscured)jump(p.lat,{focusId:id});
 else holdCamera();
 if(historyUpdate){const url=new URL(location.href);url.searchParams.delete('at');url.searchParams.set('place',id);history.pushState({place:id},'',url)}
 updatePosition();
}
function cleanSelection(){if($('#place-card').open)return;selected=null;holdCamera();$$('.map-marker').forEach(el=>el.classList.remove('selected'));const u=new URL(location.href);u.searchParams.delete('place');u.searchParams.set('at',currentLat.toFixed(4));history.replaceState({},'',u);updatePosition();if(lastTrigger?.isConnected)lastTrigger.focus({preventScroll:true})}
$('#place-card').addEventListener('close',cleanSelection);
$$('.map-marker').forEach(el=>{el.addEventListener('click',()=>openCard(el.dataset.place));el.addEventListener('focus',()=>{if(keyboardNavigation){focusPlace=el.dataset.place;panX=0;schedulePosition()}})});
$$('[data-close]').forEach(b=>b.onclick=()=>$('#'+b.dataset.close).close());
$$('dialog').forEach(d=>d.addEventListener('click',e=>{if(e.target===d){const r=d.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)d.close()}}));
function search(query=''){
 const q=query.toLowerCase().trim();const matches=places.filter(p=>[p.name,p.category,p.subtype,...(p.aliases??[]),p.description,p.regionName,p.id,p.id==='osterman-beach'?'Hollywood':''].join(' ').toLowerCase().includes(q));
 $('#search-count').textContent=q?`${matches.length} ${matches.length===1?'discovery':'discoveries'} found`:'From the northern beaches to South Shore';
 $('#search-results').innerHTML=matches.length?matches.map(p=>`<button class="search-result" data-result="${p.id}"><span>${symbols[p.category]}</span><span><strong>${escape(p.name)}</strong><small>${escape(p.regionName)} · ${escape(p.access)}</small></span><span class="result-arrow">↗</span></button>`).join(''):'<p class="empty-search">No places found. Try “beach,” “museum,” or a neighborhood name.</p>';
 $$('[data-result]').forEach(el=>el.onclick=()=>{$('#search-dialog').close();setFilter('all');openCard(el.dataset.result,{travel:true})});
}
function openSearch(){if($('#place-card').open)$('#place-card').close();search();$('#search-dialog').showModal();$('#search-input').value='';$('#search-input').focus()}
$('#search-open').onclick=openSearch;$('#search-input').addEventListener('input',e=>search(e.target.value));
addEventListener('keydown',e=>{if(((e.metaKey||e.ctrlKey)&&e.key==='k')||(e.key==='/'&&!['INPUT','TEXTAREA'].includes(document.activeElement?.tagName))){e.preventDefault();openSearch()}if(e.key==='Escape'){$('#filters').hidden=true;$('#filter-toggle').setAttribute('aria-expanded','false');if($('#place-card').open)$('#place-card').close()}});
$('#search-input').addEventListener('keydown',e=>{if(e.key==='ArrowDown'){e.preventDefault();$('#search-results button')?.focus()}if(e.key==='Enter')$('#search-results button')?.click()});
$('#section-list').innerHTML=regions.map((r,i)=>`<button class="section-list-item" data-region="${i}"><span>${String(i+1).padStart(2,'0')}</span><div><strong>${r[0]}</strong><small>${r[2]}</small></div></button>`).join('');
$('#section-open').onclick=()=>{if($('#place-card').open)$('#place-card').close();$('#section-dialog').showModal()};$$('[data-region]').forEach(el=>el.onclick=()=>{const latitude=regions[+el.dataset.region][1];$('#section-dialog').close();requestAnimationFrame(()=>jump(latitude))});
$('#filter-toggle').onclick=()=>{const h=$('#filters').hidden;$('#filters').hidden=!h;$('#filter-toggle').setAttribute('aria-expanded',String(h))};
function setFilter(value){filter=value;const list=places.filter(p=>matchesFilter(p,value));markers.forEach(({el,p})=>el.classList.toggle('hidden',!matchesFilter(p,value)));$$('[data-filter]').forEach(el=>el.setAttribute('aria-pressed',String(el.dataset.filter===value)));$('#filter-label').textContent={all:'All discoveries',beach:'Beaches',nature:'Nature & quiet corners',harbor:'Harbors',landmark:'Landmarks',art:'Art & monuments',culture:'Stages & museums'}[value];$('#filter-count').textContent=list.length;$('#filters').hidden=true;$('#filter-toggle').setAttribute('aria-expanded','false');arrangeMarkers()}
$$('[data-filter]').forEach(el=>el.onclick=()=>setFilter(el.dataset.filter));
addEventListener('click',e=>{if(!e.target.closest('.filter-control')){$('#filters').hidden=true;$('#filter-toggle').setAttribute('aria-expanded','false')}});
$('#begin').onclick=()=>jump(41.977);$('#back-north').onclick=()=>{focusPlace=null;panX=0;scrollTo({top:0,behavior:reduced.matches?'instant':'smooth'});schedulePosition()};$('#north-jump').onclick=$('#back-north').onclick;$('#south-jump').onclick=()=>jump(41.7669);$('#share-map').onclick=()=>share();
layout();
document.fonts.ready.then(arrangeMarkers);
const params=new URLSearchParams(location.search);if(params.has('place')&&byId.has(params.get('place')))openCard(params.get('place'),{travel:true,historyUpdate:false});else if(params.has('at')){const at=Number(params.get('at'));if(at>=41.76&&at<=42)jump(at,{smooth:false})}
addEventListener('popstate',()=>{const id=new URLSearchParams(location.search).get('place');if(id&&byId.has(id))openCard(id,{travel:true,historyUpdate:false});else if($('#place-card').open)$('#place-card').close()});
