import fs from 'node:fs';
import {createHash} from 'node:crypto';
const revision=p=>createHash('sha256').update(fs.readFileSync(p)).digest('hex').slice(0,12);
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
const tiles=Array.from({length:10},(_,row)=>Array.from({length:4},(_,col)=>`<div class="map-tile" data-tile="${row}-${col}" style="left:${col*1300}px;top:${row*MAP.tileHeight}px;width:1300px"><img src="/assets/map/preview-${row}.svg" width="1300" height="${MAP.tileHeight}" alt="" loading="lazy" style="object-position:${col*100/3}% center"></div>`).join('')).join('');
const markers=places.map((p,i)=>`<button class="map-marker ${p.category} ${p.featured===false?'detail':''} ${left.has(p.id)?'align-left':''}" data-place="${p.id}" style="left:${X(p.lon).toFixed(1)}px;top:${Y(p.lat).toFixed(1)}px" aria-label="Discover ${esc(p.name)}"><span class="marker-dot" aria-hidden="true">${p.featured===false?'':String(i+1).padStart(2,'0')}</span><span class="marker-label">${esc(p.name)}${p.story?`<small>${p.category==='nature'?'A LITTLE ESCAPE':p.category==='beach'?'SAND & SKY':p.category==='harbor'?'BY THE WATER':'A CHICAGO STORY'}</small>`:''}</span></button>`).join('');
html=html.replaceAll('{{PLACE_COUNT}}',String(places.length)).replace('<!-- MAP_TILES -->',tiles).replace('<!-- MAP_MARKERS -->',markers);html=html.replace('id="atlas"',`id="atlas" data-revision="${revision('dist/places-data.json')}" data-map-revision="${createHash('sha256').update(fs.readFileSync('dist/map-config.json')).update(fs.readFileSync('data/map-tile-manifest.json')).digest('hex').slice(0,12)}"`).replace('/app.js',`/app.js?v=${revision('dist/app.js')}`).replace('/styles.css',`/styles.css?v=${revision('dist/styles.css')}`);fs.writeFileSync('dist/index.html',html);
fs.writeFileSync('dist/assets/favicon.svg','<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40"><rect width="40" height="40" rx="20" fill="#f6f3e9"/><path d="M7 25q7-7 14-3t13-1M7 30q7-7 14-3t13-1M14 19V10h5v10m4-1V6h5v14" fill="none" stroke="#315849" stroke-width="1.5"/></svg>');
console.log('Built homepage and accessible coordinate-anchored markers.');
