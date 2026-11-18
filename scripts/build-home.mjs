import fs from 'node:fs';
import {MAP,project} from './map-coordinates.mjs';
const places=JSON.parse(fs.readFileSync('data/places.json'));const photos=JSON.parse(fs.readFileSync('data/photos.json'));
for(const p of places){p.photo=photos[p.id]??null;}
fs.writeFileSync('dist/places-data.json',JSON.stringify(places));
const X=lon=>project([lon,0])[0],Y=lat=>project([0,lat])[1];
const esc=s=>s.replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;');
const illustrated=new Set(JSON.parse(fs.readFileSync('data/map-landmarks.json')).map(l=>l.place));
const left=new Set(['cricket-hill','north-pond','caldwell-lily-pool','lincoln-park-zoo','millennium-park','buckingham-fountain','field-museum','soldier-field','burnham-harbor','burnham-park','griffin-msi','jackson-park','31st-street-beach']);
const small=new Set(['ardmore-trailhead','cricket-hill','north-pond','caldwell-lily-pool','maggie-daley-park','soldier-field','31st-street-harbor','71st-street-trailhead']);
let html=fs.readFileSync('data/home-template.html','utf8');
const tiles=Array.from({length:10},(_,i)=>`<div class="map-tile" data-tile="${i}" style="top:${i*MAP.tileHeight}px"><img src="/assets/map/${i===0?'section':'preview'}-${i}.svg" width="${MAP.width}" height="${MAP.tileHeight}" alt="" ${i===0?'fetchpriority="high"':'loading="lazy"'}></div>`).join('');
const markers=places.map((p,i)=>`<button class="map-marker ${p.category} ${illustrated.has(p.id)?'illustrated':''} ${left.has(p.id)?'align-left':''} ${small.has(p.id)?'small':''}" data-place="${p.id}" style="left:${X(p.lon).toFixed(1)}px;top:${Y(p.lat).toFixed(1)}px" aria-label="Discover ${esc(p.name)}"><span class="marker-dot" aria-hidden="true">${String(i+1).padStart(2,'0')}</span><span class="marker-label">${esc(p.name)}${p.story?`<small>${p.category==='nature'?'A LITTLE ESCAPE':p.category==='beach'?'SAND & SKY':p.category==='harbor'?'BY THE WATER':'A CHICAGO STORY'}</small>`:''}</span></button>`).join('');
html=html.replace('<!-- MAP_TILES -->',tiles).replace('<!-- MAP_MARKERS -->',markers);fs.writeFileSync('dist/index.html',html);
fs.writeFileSync('dist/assets/favicon.svg','<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40"><rect width="40" height="40" rx="20" fill="#f6f3e9"/><path d="M7 25q7-7 14-3t13-1M7 30q7-7 14-3t13-1M14 19V10h5v10m4-1V6h5v14" fill="none" stroke="#315849" stroke-width="1.5"/></svg>');
console.log('Built homepage and accessible coordinate-anchored markers.');
