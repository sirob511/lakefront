import urllib.request,json,concurrent.futures,re,pathlib
r=pathlib.Path(__file__).resolve().parents[1];places=json.loads((r/'data/places.json').read_text())
def check(p):
 try:
  req=urllib.request.Request(p['officialUrl'],headers={'User-Agent':'Mozilla/5.0'})
  resp=urllib.request.urlopen(req,timeout=20);text=resp.read().decode('utf8','ignore');title=re.findall('<title[^>]*>(.*?)</title>',text,re.I|re.S)
  return {'id':p['id'],'status':resp.status,'url':resp.url,'title':re.sub('<[^>]+>','',title[0] if title else '')}
 except Exception as e:return {'id':p['id'],'error':str(e),'url':p['officialUrl']}
with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool:results=list(pool.map(check,places))
(r/'data/source-checks.json').write_text(json.dumps(results,indent=2));print(json.dumps(results,indent=2))
