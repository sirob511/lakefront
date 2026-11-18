import fs from 'node:fs';
const places=JSON.parse(fs.readFileSync('data/places.json'));const photos=JSON.parse(fs.readFileSync('data/photos.json'));
for(const p of places){p.photo=photos[p.id]??null;}
fs.writeFileSync('dist/places-data.json',JSON.stringify(places));
const X=lon=>(lon+87.68)*14000+600,Y=lat=>(41.996-lat)*28000+120;
const esc=s=>s.replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;');
const left=new Set(['cricket-hill','north-pond','caldwell-lily-pool','lincoln-park-zoo','millennium-park','buckingham-fountain','field-museum','soldier-field','burnham-harbor','burnham-park','griffin-msi','jackson-park','31st-street-beach']);
const small=new Set(['ardmore-trailhead','cricket-hill','north-pond','caldwell-lily-pool','maggie-daley-park','soldier-field','31st-street-harbor','71st-street-trailhead']);
let html=fs.readFileSync('dist/index.html','utf8');
// Keep the source template separate so the homepage can be rebuilt after data changes.
if(!html.includes('<!-- MAP_TILES -->'))html=fs.readFileSync('data/home-template.html','utf8');else fs.writeFileSync('data/home-template.html',html);
const tiles=Array.from({length:10},(_,i)=>`<div class="map-tile" data-tile="${i}" style="top:${i*690}px">${i===0?fs.readFileSync('dist/assets/map/section-0.svg','utf8'):fs.readFileSync(`dist/assets/map/preview-${i}.svg`,'utf8')}</div>`).join('');
const markers=places.map((p,i)=>`<button class="map-marker ${p.category} ${left.has(p.id)?'align-left':''} ${small.has(p.id)?'small':''}" data-place="${p.id}" style="left:${X(p.lon).toFixed(1)}px;top:${Y(p.lat).toFixed(1)}px" aria-label="Discover ${esc(p.name)}"><span class="marker-dot" aria-hidden="true">${String(i+1).padStart(2,'0')}</span><span class="marker-label">${esc(p.name)}${p.story?`<small>${p.category==='nature'?'A LITTLE ESCAPE':p.category==='beach'?'SAND & SKY':p.category==='harbor'?'BY THE WATER':'A CHICAGO STORY'}</small>`:''}</span></button>`).join('');
html=html.replace('<!-- MAP_TILES -->',tiles).replace('<!-- MAP_MARKERS -->',markers);fs.writeFileSync('dist/index.html',html);
fs.writeFileSync('dist/assets/favicon.svg','<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40"><rect width="40" height="40" rx="20" fill="#f6f3e9"/><path d="M7 25q7-7 14-3t13-1M7 30q7-7 14-3t13-1M14 19V10h5v10m4-1V6h5v14" fill="none" stroke="#315849" stroke-width="1.5"/></svg>');
console.log('Built homepage and accessible coordinate-anchored markers.');
