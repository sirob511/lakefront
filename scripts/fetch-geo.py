import urllib.request,xml.etree.ElementTree as E,concurrent.futures,json,time,pathlib
root=pathlib.Path(__file__).resolve().parents[1]
cache=root/'data/raw';cache.mkdir(exist_ok=True)
anchors=[(41.995,-87.654),(41.979,-87.649),(41.966,-87.635),(41.945,-87.637),(41.928,-87.630),(41.914,-87.625),(41.903,-87.621),(41.892,-87.609),(41.878,-87.614),(41.866,-87.605),(41.852,-87.609),(41.838,-87.603),(41.823,-87.595),(41.807,-87.583),(41.795,-87.577),(41.780,-87.574),(41.764,-87.562)]
def lonat(lat):
 for (a,b),(c,d) in zip(anchors,anchors[1:]):
  if c<=lat<=a:return b+(d-b)*(a-lat)/(a-c)
 return anchors[-1][1]
def fetch(box,key,depth=0):
 p=cache/(str(key)+'.xml')
 if p.exists() and p.stat().st_size>200:return p.read_bytes()
 url='https://api.openstreetmap.org/api/0.6/map?bbox='+','.join(f'{n:.5f}' for n in box)
 try:
  req=urllib.request.Request(url,headers={'User-Agent':'LakefrontTrailAtlas/1.0 (illustrated geographic guide)'})
  data=urllib.request.urlopen(req,timeout=45).read();E.fromstring(data);p.write_bytes(data);print(key,len(data),flush=True);return data
 except Exception as e:
  if depth<2:
   a,b,c,d=box;m=(b+d)/2
   return [fetch((a,b,c,m),str(key)+'a',depth+1),fetch((a,m,c,d),str(key)+'b',depth+1)]
  print('FAIL',key,str(e),flush=True);return None
boxes=[]
for i in range(24):
 lo=41.760+i*.01;hi=lo+.011;c=lonat((lo+hi)/2);boxes.append((c-.014,lo,c+.012,hi))
with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool:list(pool.map(lambda a:fetch(a[1],a[0]),enumerate(boxes)))
nodes={};ways={};shoreids=set()
for p in cache.glob('*.xml'):
 try:r=E.parse(p).getroot()
 except:continue
 for n in r.findall('node'):nodes[n.attrib['id']]=[float(n.attrib['lon']),float(n.attrib['lat'])]
 for w in r.findall('way'):ways[w.attrib['id']]=w
 for rel in r.findall('relation'):
  if rel.attrib['id']=='1205149':shoreids.update(m.attrib['ref'] for m in rel.findall('member') if m.attrib['type']=='way' and m.attrib.get('role')=='outer')
out={'shorePaths':[],'trails':[],'roads':[],'parks':[],'beaches':[],'water':[],'buildings':[],'piers':[],'sourceUrls':['https://www.openstreetmap.org/copyright','https://www.chicagoparkdistrict.com/lakefront-trail'],'retrieved':'2026-11-18'}
for wid,w in ways.items():
 t={e.attrib['k']:e.attrib['v'] for e in w.findall('tag')};coords=[nodes[n.attrib['ref']] for n in w.findall('nd') if n.attrib['ref'] in nodes]
 if len(coords)<2 or not any(-87.682<x<-87.548 and 41.755<y<42.002 for x,y in coords):continue
 # Round coordinates, retaining native OSM geometry.
 coords=[[round(x,6),round(y,6)] for x,y in coords]
 feature={'id':wid,'name':t.get('name',''),'points':coords}
 if wid in shoreids:out['shorePaths'].append(feature)
 elif 'Lakefront Trail' in t.get('name','') and t.get('highway') in ['path','cycleway','footway']:feature['mode']='walk' if t.get('bicycle')=='no' else 'bike';out['trails'].append(feature)
 elif t.get('highway') in ['primary','secondary','trunk','tertiary']:out['roads'].append(feature)
 elif t.get('leisure') in ['park','garden','nature_reserve','golf_course'] or t.get('landuse') in ['grass','forest'] or t.get('natural') in ['wood','scrub']:out['parks'].append(feature)
 elif t.get('natural')=='beach':out['beaches'].append(feature)
 elif t.get('natural')=='water':out['water'].append(feature)
 elif t.get('man_made') in ['pier','breakwater']:out['piers'].append(feature)
 elif 'building' in t:out['buildings'].append(feature)
paths=[f['points'][:] for f in out['shorePaths']];chains=[]
while paths:
 c=paths.pop();changed=True
 while changed:
  changed=False
  for i,p in enumerate(paths):
   if c[-1]==p[0]:c+=p[1:]
   elif c[-1]==p[-1]:c+=p[-2::-1]
   elif c[0]==p[-1]:c=p[:-1]+c
   elif c[0]==p[0]:c=p[:0:-1]+c
   else:continue
   paths.pop(i);changed=True;break
 chains.append(c)
out['shoreline']=max(chains,key=len)
if out['shoreline'][0][1]<out['shoreline'][-1][1]:out['shoreline'].reverse()
(root/'data/geography.json').write_text(json.dumps(out,separators=(',',':')))
print({k:len(v) for k,v in out.items() if isinstance(v,list)},flush=True)
