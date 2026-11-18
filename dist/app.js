const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const [places,config]=await Promise.all([fetch('/places-data.json').then(r=>r.json()),fetch('/map-config.json').then(r=>r.json())]);
const byId=new Map(places.map(p=>[p.id,p]));
const symbols={beach:'≈',nature:'♧',harbor:'⚓',landmark:'◇'};
const regions=[['Edgewater & Montrose',41.979,'Quiet beaches & the Magic Hedge'],['Harbors of Lincoln Park',41.945,'Masts, lawns & open water'],['Lincoln Park & North Avenue',41.920,'Park paths meet the skyline'],['The Gold Coast',41.906,'Sand at the foot of the city'],['Streeterville & Navy Pier',41.895,'A city reaching into the lake'],['The downtown lakefront',41.879,'Grand parks & a thousand sails'],['Museum Campus',41.863,'Big discoveries, wider horizons'],['The southern harbors',41.834,'A different view of downtown'],['Burnham Park & the Point',41.803,'Long lawns & limestone edges'],['Jackson Park & South Shore',41.781,'Lagoons, history & one last beach']];
const boundaries=[41.966,41.926,41.911,41.902,41.888,41.867,41.838,41.820,41.792];
const projection=config.projection;
const mapY=lat=>(projection.originLat-lat)*projection.scaleY+projection.offsetY,mapX=lon=>(lon-projection.originLon)*projection.scaleX+projection.offsetX;
const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let scale=1,shiftX=0,shiftY=0,currentLat=41.988,filter='all',selected=null,lastTrigger=null,raf=0,urlTimer;
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const mobile=()=>innerWidth<=700;
let keyboardNavigation=false;addEventListener('keydown',e=>{if(e.key==='Tab')keyboardNavigation=true});addEventListener('pointerdown',()=>{keyboardNavigation=false},{passive:true});
function cameraX(y){const points=config.camera,i=Math.max(0,Math.min(points.length-2,Math.floor(y/60))),a=points[i],b=points[i+1],t=Math.max(0,Math.min(1,(y-a[0])/(b[0]-a[0])));return a[1]+(b[1]-a[1])*t}
function layout(){scale=mobile()?.72:Math.min(1.12,innerWidth/1440);shiftY=mobile()?170:0;$('#map-canvas').style.width=`${config.width}px`;$('#atlas').style.height=`${config.height*scale+shiftY}px`;updatePosition()}
function updatePosition(){
 const rect=$('#atlas').getBoundingClientRect();const y=Math.max(0,Math.min(config.height,(innerHeight*.44-rect.top-shiftY)/scale));currentLat=projection.originLat-(y-projection.offsetY)/projection.scaleY;
 if(mobile()){const focusId=selected||(keyboardNavigation?document.activeElement?.dataset?.place:null);const focus=focusId&&byId.has(focusId)?mapX(byId.get(focusId).lon):cameraX(y);shiftX=Math.max(innerWidth-config.width*scale,Math.min(0,innerWidth*.53-focus*scale));}else shiftX=Math.max(innerWidth-config.width*scale,Math.min(0,innerWidth*.62-cameraX(y)*scale));
 $('#map-canvas').style.transform=`translate(${shiftX}px,${shiftY}px) scale(${scale})`;
 // Preserve readable labels and minimum touch targets as the map scales.
 $$('.map-marker').forEach(el=>{el.style.setProperty('--map-scale',scale);const screenX=mapX(byId.get(el.dataset.place).lon)*scale+shiftX;el.classList.toggle('mobile-left',mobile()&&screenX>innerWidth*.48);const left=mobile()?el.classList.contains('mobile-left'):el.classList.contains('align-left');el.style.transform=`translate(${left?'calc(-100% + 16px)':'-16px'},-22px) scale(${Math.max(1,1/scale)})`;el.style.transformOrigin=left?'right center':'left center'});
 let i=boundaries.findIndex(b=>currentLat>=b);if(i<0)i=9;
 $('#region-number').textContent=String(i+1).padStart(2,'0');$('#region-name').textContent=regions[i][0];$('#progress-text').textContent=regions[i][0].toUpperCase();
 const progress=Math.max(0,Math.min(1,(y-mapY(41.988))/(mapY(41.7669)-mapY(41.988))));const p=$('#mini-map path').getPointAtLength($('#mini-map path').getTotalLength()*progress);$('#mini-dot').setAttribute('cx',p.x);$('#mini-dot').setAttribute('cy',p.y);
 const atEnd=rect.bottom<innerHeight*.5;$('#map-tools').classList.toggle('tools-away',atEnd);$('.overview').classList.toggle('tools-away',atEnd);$('.route-key').classList.toggle('tools-away',atEnd);
 raf=0;
}
addEventListener('scroll',()=>{if(!raf)raf=requestAnimationFrame(updatePosition);clearTimeout(urlTimer);urlTimer=setTimeout(()=>{if(!selected&&scrollY>300){const u=new URL(location.href);u.searchParams.set('at',currentLat.toFixed(4));history.replaceState({},'',u)}},450)},{passive:true});
addEventListener('resize',layout);
function jump(lat,{smooth=true}={}){const top=$('#atlas').offsetTop+shiftY+mapY(lat)*scale-innerHeight*.4;scrollTo({top:Math.max(0,top),behavior:smooth&&!reduced.matches?'smooth':'instant'});updatePosition()}
// Sections share one coordinate system; neighboring art loads before it comes into view.
const tileObserver=new IntersectionObserver(entries=>{for(const e of entries)if(e.isIntersecting){loadTile(e.target);tileObserver.unobserve(e.target)}},{rootMargin:'1100px 0px'});
function loadTile(el){
 if(el.dataset.loaded)return;el.dataset.loaded='loading';
 const img=new Image();img.alt='';img.width=config.width;img.height=config.tileHeight;img.decoding='async';
 img.onload=()=>{el.replaceChildren(img);el.dataset.loaded='true'};
 img.onerror=()=>{el.dataset.loaded='';el.innerHTML='<p class="tile-error">This part of the illustration could not load. <button type="button">Try again</button></p>';el.querySelector('button').onclick=()=>loadTile(el)};
 img.src=`/assets/map/section-${el.dataset.tile}.svg`;
}
$$('.map-tile').forEach(el=>tileObserver.observe(el));

function toast(message){$('#toast').textContent=message;$('#toast').classList.add('visible');clearTimeout(toast.timer);toast.timer=setTimeout(()=>$('#toast').classList.remove('visible'),3200)}
async function share(id){const url=new URL(location.origin+'/');if(id)url.searchParams.set('place',id);else url.searchParams.set('at',currentLat.toFixed(4));try{await navigator.clipboard.writeText(url.href);toast('Link copied. Share a little lakefront.')}catch{if(navigator.share){try{await navigator.share({title:'Lakefront Trail · Chicago',url:url.href})}catch{}}else{prompt('Copy this lakefront link:',url.href)}}}
function openCard(id,{travel=false,historyUpdate=true}={}){
 const p=byId.get(id);if(!p)return;selected=id;lastTrigger=document.activeElement;
 $$('.map-marker').forEach(el=>el.classList.toggle('selected',el.dataset.place===id));
 if(travel)jump(p.lat);
 const photo=p.photo;const image=photo?`<img class="card-photo" src="${escape(photo.src)}" alt="${escape(photo.alt)}" width="960" height="640">`:`<div class="card-location"><span aria-hidden="true">${symbols[p.category]}</span><p>${escape(p.regionName)}<small>${p.lat.toFixed(4)}° N · ${Math.abs(p.lon).toFixed(4)}° W</small></p></div>`;
 $('#card-content').innerHTML=`${image}<div class="card-content"><p class="eyebrow">${symbols[p.category]} ${escape(p.category.toUpperCase())} <span>·</span> ${escape(p.access.toUpperCase())}</p><h2 id="card-title">${escape(p.name)}</h2><p class="card-description">${escape(p.description)}</p><p class="card-fact">${escape(p.fact)}</p><div class="card-practical"><strong>A little before-you-go.</strong><br>${escape(p.practical)}</div><div class="card-actions"><a href="${p.story?`/places/${p.id}/`:`/places/#${p.id}`}">Discover this place <span aria-hidden="true">↗</span></a><button id="share-place">Share ↗</button></div>${photo?`<p class="photo-credit">Photo: ${escape(photo.author)} · <a href="${escape(photo.licenseUrl)}" target="_blank" rel="noopener">${escape(photo.license)}</a> · <a href="${escape(photo.sourceUrl)}" target="_blank" rel="noopener">Source</a></p>`:'<p class="photo-credit">Visitor information from the linked official source.</p>'}</div>`;
 $('#share-place').onclick=()=>share(id);if(!$('#place-card').open)$('#place-card').showModal();$('#place-card .close-button').focus({preventScroll:true});
 if(historyUpdate){const url=new URL(location.href);url.searchParams.delete('at');url.searchParams.set('place',id);history.pushState({place:id},'',url)}
 updatePosition();
}
function cleanSelection(){selected=null;$$('.map-marker').forEach(el=>el.classList.remove('selected'));const u=new URL(location.href);u.searchParams.delete('place');u.searchParams.set('at',currentLat.toFixed(4));history.replaceState({},'',u);updatePosition();if(lastTrigger?.isConnected)lastTrigger.focus({preventScroll:true})}
$('#place-card').addEventListener('close',cleanSelection);
$$('.map-marker').forEach(el=>{el.addEventListener('click',()=>openCard(el.dataset.place));el.addEventListener('focus',()=>{if(mobile()&&!$('#place-card').open){const p=byId.get(el.dataset.place),x=mapX(p.lon)*scale+shiftX;if(x<20||x>innerWidth-50){shiftX=Math.max(innerWidth-config.width*scale,Math.min(0,innerWidth*.5-mapX(p.lon)*scale));$('#map-canvas').style.transform=`translate(${shiftX}px,${shiftY}px) scale(${scale})`}}})});
$$('[data-close]').forEach(b=>b.onclick=()=>$('#'+b.dataset.close).close());
$$('dialog').forEach(d=>d.addEventListener('click',e=>{if(e.target===d){const r=d.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)d.close()}}));
function search(query=''){
 const q=query.toLowerCase().trim();const matches=places.filter(p=>[p.name,p.category,p.description,p.regionName,p.id,p.id==='osterman-beach'?'Hollywood':''].join(' ').toLowerCase().includes(q));
 $('#search-count').textContent=q?`${matches.length} ${matches.length===1?'discovery':'discoveries'} found`:'From the northern beaches to South Shore';
 $('#search-results').innerHTML=matches.length?matches.map(p=>`<button class="search-result" data-result="${p.id}"><span>${symbols[p.category]}</span><span><strong>${escape(p.name)}</strong><small>${escape(p.regionName)} · ${escape(p.access)}</small></span><span class="result-arrow">↗</span></button>`).join(''):'<p class="empty-search">No places found. Try “beach,” “museum,” or a neighborhood name.</p>';
 $$('[data-result]').forEach(el=>el.onclick=()=>{$('#search-dialog').close();setFilter('all');openCard(el.dataset.result,{travel:true})});
}
function openSearch(){if($('#place-card').open)$('#place-card').close();search();$('#search-dialog').showModal();$('#search-input').value='';$('#search-input').focus()}
$('#search-open').onclick=openSearch;$('#search-input').addEventListener('input',e=>search(e.target.value));
addEventListener('keydown',e=>{if(((e.metaKey||e.ctrlKey)&&e.key==='k')||(e.key==='/'&&!['INPUT','TEXTAREA'].includes(document.activeElement?.tagName))){e.preventDefault();openSearch()}if(e.key==='Escape'){$('#filters').hidden=true;$('#filter-toggle').setAttribute('aria-expanded','false')}});
$('#search-input').addEventListener('keydown',e=>{if(e.key==='ArrowDown'){e.preventDefault();$('#search-results button')?.focus()}if(e.key==='Enter')$('#search-results button')?.click()});
$('#section-list').innerHTML=regions.map((r,i)=>`<button class="section-list-item" data-region="${i}"><span>${String(i+1).padStart(2,'0')}</span><div><strong>${r[0]}</strong><small>${r[2]}</small></div></button>`).join('');
$('#section-open').onclick=()=>$('#section-dialog').showModal();$$('[data-region]').forEach(el=>el.onclick=()=>{const latitude=regions[+el.dataset.region][1];$('#section-dialog').close();requestAnimationFrame(()=>jump(latitude))});
$('#filter-toggle').onclick=()=>{const h=$('#filters').hidden;$('#filters').hidden=!h;$('#filter-toggle').setAttribute('aria-expanded',String(h))};
function setFilter(value){filter=value;const list=places.filter(p=>value==='all'||p.category===value);$$('.map-marker').forEach(el=>el.classList.toggle('hidden',value!=='all'&&byId.get(el.dataset.place).category!==value));$$('[data-filter]').forEach(el=>el.setAttribute('aria-pressed',String(el.dataset.filter===value)));$('#filter-label').textContent={all:'All discoveries',beach:'Beaches',nature:'Nature & quiet corners',harbor:'Harbors',landmark:'Landmarks'}[value];$('#filter-count').textContent=list.length;$('#filters').hidden=true;$('#filter-toggle').setAttribute('aria-expanded','false')}
$$('[data-filter]').forEach(el=>el.onclick=()=>setFilter(el.dataset.filter));
addEventListener('click',e=>{if(!e.target.closest('.filter-control')){$('#filters').hidden=true;$('#filter-toggle').setAttribute('aria-expanded','false')}});
$('#begin').onclick=()=>jump(41.977);$('#back-north').onclick=()=>scrollTo({top:0,behavior:reduced.matches?'instant':'smooth'});$('#north-jump').onclick=$('#back-north').onclick;$('#south-jump').onclick=()=>jump(41.7669);$('#share-map').onclick=()=>share();
layout();
const params=new URLSearchParams(location.search);if(params.has('place')&&byId.has(params.get('place')))openCard(params.get('place'),{travel:true,historyUpdate:false});else if(params.has('at')){const at=Number(params.get('at'));if(at>=41.76&&at<=42)jump(at,{smooth:false})}
addEventListener('popstate',()=>{const id=new URLSearchParams(location.search).get('place');if(id&&byId.has(id))openCard(id,{travel:true,historyUpdate:false});else if($('#place-card').open)$('#place-card').close()});
