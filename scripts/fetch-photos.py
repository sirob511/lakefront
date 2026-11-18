"""Acquire only exact, visually reviewed Commons files.

Edit data/reviewed-photos.json after inspecting the subject and its license.
Search results are never automatically promoted to published photographs.
Run with --refresh to re-download already installed files.
"""
import argparse
import html
import json
import pathlib
import re
import subprocess
import tempfile
import time
import urllib.parse
import urllib.request

ROOT = pathlib.Path(__file__).resolve().parents[1]
OUT = ROOT / 'dist/assets/photos'
OUT.mkdir(exist_ok=True)
MANIFEST = json.loads((ROOT / 'data/reviewed-photos.json').read_text())
PHOTO_FILE = ROOT / 'data/photos.json'
photos = json.loads(PHOTO_FILE.read_text()) if PHOTO_FILE.exists() else {}
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--refresh', action='store_true')
args = parser.parse_args()


def get(url):
    request = urllib.request.Request(url, headers={
        'User-Agent': 'LakefrontAtlas/1.0 (reviewed photograph acquisition; attribution included)'
    })
    with urllib.request.urlopen(request, timeout=45) as response:
        return response.read()


for place_id, reviewed in MANIFEST.items():
    dest = OUT / f'{place_id}.webp'
    existing = photos.get(place_id)
    if (not args.refresh and dest.exists() and existing
            and existing['title'] == reviewed['title']):
        existing['alt'] = reviewed['alt']
        continue
    query = urllib.parse.urlencode({
        'action': 'query', 'titles': reviewed['title'], 'prop': 'imageinfo',
        'iiprop': 'url|extmetadata', 'iiurlwidth': 960, 'format': 'json'
    })
    result = json.loads(get('https://commons.wikimedia.org/w/api.php?' + query))
    page = next(iter(result['query']['pages'].values()))
    if page['title'] != reviewed['title'] or not page.get('imageinfo'):
        raise RuntimeError(f'Exact reviewed source was not found: {reviewed["title"]}')
    info = page['imageinfo'][0]
    metadata = info['extmetadata']
    license_name = metadata['LicenseShortName']['value']
    license_url = metadata.get('LicenseUrl', {}).get('value')
    if not license_name.startswith(('CC BY', 'CC0')) or not license_url:
        raise RuntimeError(f'License requires manual review for {place_id}: {license_name}')
    with tempfile.TemporaryDirectory(prefix='lakefront-photo-') as temporary:
        original = pathlib.Path(temporary) / 'source.image'
        original.write_bytes(get(info.get('thumburl', info['url'])))
        # Resize and format conversion only; do not generate or alter the subject.
        subprocess.run(['convert', str(original), '-resize', '960x960>',
                        '-quality', '84', str(dest)], check=True)
    photos[place_id] = {
        'src': f'/assets/photos/{place_id}.webp',
        'alt': reviewed['alt'],
        'title': page['title'],
        'author': html.unescape(re.sub('<[^>]+>', '', metadata['Artist']['value'])),
        'license': license_name,
        'licenseUrl': license_url.replace('http://', 'https://'),
        'sourceUrl': info['descriptionurl'],
    }
    # Save successful files individually so a rate limit does not discard work.
    PHOTO_FILE.write_text(json.dumps(photos, ensure_ascii=False, indent=2) + '\n')
    print(f'{place_id}: {page["title"]} ({license_name})', flush=True)
    time.sleep(1)

photos = {place_id: photos[place_id] for place_id in MANIFEST}
PHOTO_FILE.write_text(json.dumps(photos, ensure_ascii=False, indent=2) + '\n')
print(f'{len(photos)} exact reviewed photographs installed.')
