import fs from 'node:fs';
const geo=JSON.parse(fs.readFileSync('data/geography.json'));
export const W=3000,H=6900;
export function project([lon,lat]){return [(lon+87.68)*14000+600,(41.996-lat)*28000+120]}
const n=v=>Math.round(v*10)/10;
const pts=arr=>arr.map(project);
function simplify(p,tol=1.1){if(p.length<4)return p;const out=[p[0]];for(let i=1;i<p.length-1;i++){const a=out.at(-1),b=p[i],c=p[i+1];const cross=Math.abs((b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]));if(cross/Math.max(1,Math.hypot(c[0]-a[0],c[1]-a[1]))>tol||Math.hypot(b[0]-a[0],b[1]-a[1])>35)out.push(b)}out.push(p.at(-1));return out}
const path=(p,close=false)=>p.map((v,i)=>(i?'L':'M')+n(v[0])+','+n(v[1])).join('')+(close?'Z':'');
const shore=simplify(pts(geo.shoreline),.6);const coast=path(shore);const land='M-800,-1000L'+n(shore[0][0])+','+n(shore[0][1])+coast.replace(/^M[^L]+/,'')+'L-800,10000Z';
const layers={};for(const k of ['roads','parks','beaches','water','buildings','piers','trails'])layers[k]=geo[k].map(f=>{let p=simplify(pts(f.points),k==='buildings'?.5:1);return {...f,p,minY:Math.min(...p.map(v=>v[1])),maxY:Math.max(...p.map(v=>v[1])),cx:p.reduce((a,v)=>a+v[0],0)/p.length,cy:p.reduce((a,v)=>a+v[1],0)/p.length,d:path(p,['parks','beaches','water','buildings'].includes(k))}});
function shorelineX(y){let xs=[];for(let i=0;i<shore.length-1;i++){const a=shore[i],b=shore[i+1];if((a[1]<=y&&b[1]>=y)||(b[1]<=y&&a[1]>=y)){const t=(y-a[1])/(b[1]-a[1]||1);xs.push(a[0]+t*(b[0]-a[0]))}}return xs.length?Math.max(...xs):850}
let seed=4281;const rand=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296};
const groves=[];for(let y=120;y<H;y+=88){const x=shorelineX(y);for(let j=0;j<(y>2700&&y<3600?1:2);j++){let width=115+rand()*110;groves.push({x:x-90-rand()*145-j*60,y:y-60+rand()*70,w:width,h:width*.67,flip:rand()>.5})}}
const boats=[];for(let y=500;y<H-200;y+=240){const x=shorelineX(y)+70+rand()*260;if(x<W-60)boats.push({x,y,s:.65+rand()*.6,rot:rand()*40-20})}
const labels=[[-87.663,41.978,'EDGEWATER'],[-87.656,41.966,'UPTOWN'],[-87.651,41.942,'LAKEVIEW'],[-87.644,41.924,'LINCOLN PARK'],[-87.640,41.907,'GOLD COAST'],[-87.629,41.892,'STREETERVILLE'],[-87.630,41.879,'GRANT PARK'],[-87.622,41.864,'MUSEUM CAMPUS'],[-87.622,41.839,'BRONZEVILLE'],[-87.608,41.816,'BURNHAM PARK'],[-87.599,41.796,'HYDE PARK'],[-87.598,41.780,'JACKSON PARK'],[-87.584,41.769,'SOUTH SHORE']].map(([lon,lat,text])=>({p:project([lon,lat]),text}));
const landmarks=[
[-87.639,41.961,'harbor',230,140],[-87.6355,41.940,'harbor',200,120],[-87.636,41.9328,'harbor',180,108],
[-87.6233,41.8988,'skyline',255,240],[-87.6045,41.8917,'navy-pier',290,193],
[-87.617,41.8663,'museum',190,130],[-87.614,41.8676,'shedd',160,105],[-87.6167,41.8623,'soldier-field',170,130],[-87.614,41.858,'harbor',210,130],[-87.6055,41.835,'harbor',185,120],
[-87.5741,41.7823,'beach-house',190,130],[-87.5639,41.7685,'south-shore',230,150]
].map(([lon,lat,id,w,h])=>({p:project([lon,lat]),id,w,h}));
const defs=`<defs>
<linearGradient id="water" x1="0" y1="0" x2="1" y2="0"><stop stop-color="#bad7cd"/><stop offset="1" stop-color="#cee1d9"/></linearGradient>
<linearGradient id="city" x1="0" y1="0" x2="1" y2="0"><stop stop-color="#f5f2e8" stop-opacity=".97"/><stop offset=".4" stop-color="#f5f2e8" stop-opacity=".65"/><stop offset=".8" stop-color="#f5f2e8" stop-opacity="0"/></linearGradient>
<pattern id="ripples" width="86" height="57" patternUnits="userSpaceOnUse"><path d="M9 9q8-2 16 0m25 20q8-2 16 0M-4 47h17" stroke="#648f89" stroke-width=".6" opacity=".22" fill="none"/><path d="M35 12h10M10 38h19M61 54h17" stroke="#fff" stroke-width="1" opacity=".24"/></pattern>
<filter id="paper"><feTurbulence type="fractalNoise" baseFrequency=".65" numOctaves="3" stitchTiles="stitch"/><feColorMatrix type="saturate" values="0"/><feComponentTransfer><feFuncA type="linear" slope=".055"/></feComponentTransfer><feBlend in="SourceGraphic" mode="multiply"/></filter>
<clipPath id="land"><path d="${land}"/></clipPath>
<g id="boat"><ellipse cx="4" cy="9" rx="15" ry="4" fill="#6e9891" opacity=".15"/><path d="M-13 3Q1 11 14 3l-3 7H-9Z" fill="#fdf9e9" stroke="#78918a" stroke-width=".7"/><path d="M0-23V3H-12Z" fill="#fffdf3" stroke="#9ba99b" stroke-width=".5"/><path d="M2-20L13 2H2Z" fill="#e3d9c2"/><path d="M0-25V9" stroke="#71847b" stroke-width="1"/></g>
<g id="person"><ellipse cx="2" cy="5" rx="4" ry="1.5" fill="#5b7461" opacity=".18"/><circle cy="-6" r="2" fill="#bf8c65"/><path d="M0-3v5m-2 4 2-4 2 4m-4-7 2-2 2 3" stroke="#657b79" stroke-width="1.5" fill="none"/></g>
</defs>`;
fs.mkdirSync('dist/assets/map',{recursive:true});
for(let section=0;section<10;section++){
 const top=section*690,bottom=top+690;
 const visible=f=>f.maxY>=top-50&&f.minY<=bottom+50;
 let s=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 ${top} ${W} 690" width="${W}" height="690">${defs}<rect x="0" y="${top}" width="${W}" height="690" fill="url(#water)"/><rect y="${top}" width="${W}" height="690" fill="url(#ripples)"/><path d="${coast}" fill="none" stroke="#ecf2db" stroke-width="28" opacity=".25"/><path d="${land}" fill="#eee9d9" stroke="#a4b7a0" stroke-width="1.5"/>`;
 s+='<g clip-path="url(#land)">';
 for(const f of layers.parks.filter(visible))s+=`<path d="${f.d}" fill="${['#d2d8ad','#d6dcba','#ccd5aa','#d9ddbc'][Number(f.id)%4]}" stroke="#bac7a3" stroke-width=".55"/>`;
 for(const f of layers.roads.filter(visible))s+=`<path d="${f.d}" fill="none" stroke="#c9c4af" stroke-width="${/Shore|Drive/.test(f.name)?7:3.5}"/><path d="${f.d}" fill="none" stroke="#f7f2e3" stroke-width="${/Shore|Drive/.test(f.name)?4:1.5}"/>`;
 s+='<g fill="#d7d3c1" stroke="#b5b5a4" stroke-width=".35" opacity=".7">';for(const f of layers.buildings.filter(visible)){if(f.cx<shorelineX(f.cy)-480)continue;s+=`<path d="${f.d}" transform="translate(2,3)" fill="#aaa997" opacity=".35"/><path d="${f.d}"/>`}s+='</g>';
 for(const f of layers.beaches.filter(visible))s+=`<path d="${f.d}" fill="#eddbad" stroke="#e2cfa1" stroke-width="1"/>`;
 for(const g of groves){if(g.y>bottom+100||g.y+g.h<top-100)continue;s+=`<image href="/assets/grove.webp" x="${n(g.x)}" y="${n(g.y)}" width="${n(g.w)}" height="${n(g.h)}" opacity=".86"/>`}
 s+='</g>';
 for(const f of layers.water.filter(visible))s+=`<path d="${f.d}" fill="#abcac1" stroke="#97b5a7" stroke-width="1.3"/>`;
 for(const f of layers.piers.filter(visible))s+=`<path d="${f.d}" fill="none" stroke="#ece5cf" stroke-width="2"/>`;
 for(const f of layers.trails.filter(visible))s+=`<path d="${f.d}" fill="none" stroke="#fff8e7" stroke-width="${f.mode==='bike'?6:3.8}" stroke-linecap="round" stroke-linejoin="round"/><path d="${f.d}" fill="none" stroke="${f.mode==='bike'?'#b96844':'#8d9168'}" stroke-width="${f.mode==='bike'?2.4:1.3}" ${f.mode==='walk'?'stroke-dasharray="3 4"':''} stroke-linecap="round" stroke-linejoin="round"/>`;
 for(const b of boats){if(b.y<top-40||b.y>bottom+40)continue;s+=`<use href="#boat" transform="translate(${n(b.x)} ${n(b.y)}) scale(${b.s}) rotate(${b.rot})"/>`}
 for(const l of landmarks){const [x,y]=l.p;if(y<top-250||y>bottom+250)continue;s+=`<image href="/assets/${l.id}.webp" x="${n(x-l.w/2)}" y="${n(y-l.h*.78)}" width="${l.w}" height="${l.h}"/>`}
 // Small original architectural accents are map-native vector details.
 const adler=project([-87.6068,41.8663]);if(adler[1]>top-100&&adler[1]<bottom+100)s+=`<g transform="translate(${adler.join(' ')})"><ellipse cy="10" rx="48" ry="14" fill="#a2ac91" opacity=".25"/><path d="M-38 0h76v22h-76Z" fill="#e6dcc1" stroke="#b3ad91"/><path d="M-31 0a31 24 0 0 1 62 0Z" fill="#819b83" stroke="#64816e"/><path d="M-30 4h60M-30 17h60" stroke="#b5ad90"/><path d="M-24 6v10M-12 6v10M0 6v10M12 6v10M24 6v10" stroke="#8c927c" stroke-width="3"/></g>`;
 const fountain=project([-87.6189,41.8758]);if(fountain[1]>top-80&&fountain[1]<bottom+80)s+=`<g transform="translate(${fountain.join(' ')})"><ellipse rx="40" ry="20" fill="#d2c8ac" stroke="#b8ab8f"/><ellipse rx="34" ry="15" fill="#a3c5bd"/><ellipse cy="-4" rx="19" ry="8" fill="#dac4a4" stroke="#ac9a7f"/><path d="M-7-6q7-40 14 0M0-5v-30" fill="none" stroke="#eef9e9" stroke-width="2.5"/><ellipse cy="-5" rx="11" ry="4" fill="#bda98b"/></g>`;
 // The city recedes softly so the shoreline remains the focal point.
 s+=`<rect y="${top}" width="600" height="690" fill="url(#city)"/>`;
 for(const l of labels){if(l.p[1]>top&&l.p[1]<bottom)s+=`<text x="${n(l.p[0])}" y="${n(l.p[1])}" font-family="Georgia,serif" font-size="15" letter-spacing="4" fill="#5e6f5b" opacity=".65">${l.text}</text>`}
 if(section===0)s+=`<g transform="translate(1430 110)" fill="#43655a"><text x="0" y="-30" text-anchor="middle" font-family="Georgia" font-size="15">N</text><path d="M0-18L9 18 0 10-9 18Z"/><path d="M0-18V10L-9 18Z" fill="#8ea99b"/></g><text x="1420" y="440" text-anchor="middle" font-family="Georgia,serif" font-size="38" font-style="italic" fill="#477e78" letter-spacing="2">Lake Michigan</text><text x="1420" y="470" text-anchor="middle" font-family="sans-serif" font-size="9" letter-spacing="4" fill="#668d83">ONE EXTRAORDINARY SHORELINE</text>`;
 if([2,4,7,9].includes(section))s+=`<text x="${section<5?1230:1410}" y="${top+360}" text-anchor="middle" font-family="Georgia,serif" font-size="29" font-style="italic" fill="#5d8b7f" opacity=".65" transform="rotate(-90 ${section<5?1230:1410} ${top+360})">Lake Michigan</text>`;
 s+=`<rect y="${top}" width="${W}" height="690" fill="transparent" filter="url(#paper)" opacity=".32"/></svg>`;
 fs.writeFileSync(`dist/assets/map/section-${section}.svg`,s);
 const coarse=simplify(shore,5);const coarseLand='M-800,-1000'+path(coarse).replace(/^M/,'L')+'L-800,10000Z';
 const preview=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 ${top} ${W} 690" width="${W}" height="690"><rect y="${top}" width="${W}" height="690" fill="#c6dcd2"/><path d="${coarseLand}" fill="#eee9d9" stroke="#a8bba4" stroke-width="2"/></svg>`;
 fs.writeFileSync(`dist/assets/map/preview-${section}.svg`,preview);
}
const cam=[];for(let y=0;y<H;y+=60)cam.push([y,n(shorelineX(y))]);
fs.writeFileSync('dist/map-config.json',JSON.stringify({width:W,height:H,camera:cam}));
console.log('Built 10 continuous map sections from OSM geometry.');
