import urllib.request,urllib.parse,json,re,subprocess,pathlib,time
r=pathlib.Path(__file__).resolve().parents[1];photos=json.loads((r/'data/photos.json').read_text())
def get(url):return urllib.request.urlopen(urllib.request.Request(url,headers={'User-Agent':'LakefrontAtlas/1.0'}),timeout=25).read()
for id,fn in [('63rd-street-beach','20070602 Jackson Park Beach (6).JPG'),('field-museum','Field Museum Exterior, March 2024.jpg')]:
 try:
  title='63rd Street Beach pavilion in Chicago' if id=='63rd-street-beach' else 'Field Museum exterior in Chicago'
  j=json.loads(get('https://commons.wikimedia.org/w/api.php?'+urllib.parse.urlencode({'action':'query','titles':'File:'+fn,'prop':'imageinfo','iiprop':'url|extmetadata','iiurlwidth':960,'format':'json'})))
  p=next(iter(j['query']['pages'].values()));i=p['imageinfo'][0];m=i['extmetadata'];src=i.get('thumburl',i['url']);tmp=pathlib.Path('/tmp')/(id+'.image');tmp.write_bytes(get(src));dest=r/'dist/assets/photos'/f'{id}.webp';subprocess.run(['convert',str(tmp),'-resize','960x960>','-quality','84',str(dest)],check=True)
  photos[id]={'src':'/assets/photos/'+id+'.webp','alt':title+' in Chicago','title':p['title'],'author':re.sub('<[^>]+>','',m.get('Artist',{}).get('value','Wikimedia Commons contributor')),'license':m.get('LicenseShortName',{}).get('value',''),'licenseUrl':m.get('LicenseUrl',{}).get('value','https://commons.wikimedia.org/'),'sourceUrl':i['descriptionurl']}
  print(id,photos[id]['license'],flush=True)
 except Exception as e:print(id,str(e),flush=True)
 time.sleep(3)
(r/'data/photos.json').write_text(json.dumps(photos,ensure_ascii=False,indent=2))
