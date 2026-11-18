import time
import urllib.request,urllib.parse,json,pathlib,re,concurrent.futures,subprocess
root=pathlib.Path(__file__).resolve().parents[1];out=root/'dist/assets/photos';out.mkdir(exist_ok=True)
queries={'osterman-beach':'Osterman Beach Chicago','foster-beach':'Foster Beach Chicago','montrose-beach':'Montrose Beach Chicago -plover -Monty -bird','montrose-point':'Montrose Point Bird Sanctuary Chicago','belmont-harbor':'Belmont Harbor Chicago','diversey-harbor':'Diversey Harbor Chicago','north-avenue-beach':'North Avenue Beach Chicago skyline','oak-street-beach':'Oak Street Beach Chicago','navy-pier':'Navy Pier Chicago aerial','buckingham-fountain':'Buckingham Fountain Chicago','field-museum': 'intitle:"Field Museum" Chicago -postcard -interior -exhibit -dinosaur' ,'shedd-aquarium':'Shedd Aquarium Chicago exterior','adler-planetarium':'Adler Planetarium Chicago exterior','31st-street-beach': 'intitle:"31st" intitle:"Beach" Chicago' ,'promontory-point': 'intitle:"Promontory Point" Chicago -weathervane -Weather -Field -plaque' ,'63rd-street-beach': 'intitle:"63rd" intitle:"Beach"' ,'south-shore-cultural-center':'South Shore Cultural Center Chicago','jackson-park':'Jackson Park Chicago lagoon'}
def get(url):return urllib.request.urlopen(urllib.request.Request(url,headers={'User-Agent':'LakefrontAtlas/1.0 (educational travel guide; photo attribution included)'}),timeout=30).read()
existing=json.loads((root/'data/photos.json').read_text()) if (root/'data/photos.json').exists() else {}
def task(pair):
 key,q=pair
 if key in existing:return key,existing[key]
 time.sleep(2)
 try:
  args={'action':'query','generator':'search','gsrsearch':q+' filetype:bitmap','gsrnamespace':6,'gsrlimit':5,'prop':'imageinfo','iiprop':'url|extmetadata|size','iiurlwidth':960,'format':'json'}
  j=json.loads(get('https://commons.wikimedia.org/w/api.php?'+urllib.parse.urlencode(args)))
  pages=sorted(j.get('query',{}).get('pages',{}).values(),key=lambda p:p.get('index',999))
  choices=[p for p in pages if p.get('imageinfo') and p['imageinfo'][0]['width']>p['imageinfo'][0]['height']*1.15]
  if not choices:choices=pages
  for p in choices:
   i=p['imageinfo'][0];m=i.get('extmetadata',{});lic=m.get('LicenseShortName',{}).get('value','')
   if not any(x in lic.lower() for x in ['cc','public domain']):continue
   url=i.get('thumburl',i['url']);dest=out/(key+'.jpg')
   try:dest.write_bytes(get(url))
   except:continue
   # Format conversion and responsive sizing only; photographic content unchanged.
   subprocess.run(['convert',str(dest),'-resize','960x960>','-quality','84',str(out/(key+'.webp'))],check=True,capture_output=True);dest.unlink()
   result={'src':'/assets/photos/'+key+'.webp','alt':p['title'].replace('File:','').rsplit('.',1)[0].replace('_',' '),'title':p['title'],'author':re.sub('<[^>]+>','',m.get('Artist',{}).get('value','Wikimedia Commons contributor')),'license':lic,'licenseUrl':m.get('LicenseUrl',{}).get('value','https://commons.wikimedia.org/'),'sourceUrl':i['descriptionurl']}
   print(key,lic,p['title'],flush=True);return key,result
  print('NO PHOTO',key,flush=True)
 except Exception as e:print('PHOTO ERROR',key,str(e),flush=True)
 return key,None
with concurrent.futures.ThreadPoolExecutor(max_workers=1) as pool:results=dict(pool.map(task,queries.items()))
(root/'data/photos.json').write_text(json.dumps({k:v for k,v in results.items() if v},ensure_ascii=False,indent=2))
