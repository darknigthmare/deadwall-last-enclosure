from pathlib import Path
import json, hashlib, struct
from PIL import Image

ROOT = Path(__file__).resolve().parent

def audit(row):
    path = Path(row['generatedSourcePath'])
    raw = path.read_bytes()
    with Image.open(path) as test:
        test.verify()
    with Image.open(path) as image:
        assert image.mode == 'RGBA', (path, image.mode)
        alpha = image.getchannel('A')
        width, height = image.size
        histogram = alpha.histogram()
        bounds, margins = {}, {}
        for threshold in (1, 8, 32, 128, 240):
            box = alpha.point(lambda a: 255 if a >= threshold else 0).getbbox()
            bounds[str(threshold)] = list(box) if box else None
            margins[str(threshold)] = dict(zip(('left', 'top', 'right', 'bottom'), (box[0], box[1], width-box[2], height-box[3]))) if box else None
        border = {'top': alpha.crop((0, 0, width, 1)).getextrema()[1], 'bottom': alpha.crop((0, height-1, width, height)).getextrema()[1], 'left': alpha.crop((0, 0, 1, height)).getextrema()[1], 'right': alpha.crop((width-1, 0, width, height)).getextrema()[1]}
        corners = [alpha.getpixel(xy) for xy in ((0,0),(width-1,0),(0,height-1),(width-1,height-1))]
        result = {'key': row['key'], 'iteration': row['iteration'], 'file': str(path.relative_to(ROOT)), 'sha256': hashlib.sha256(raw).hexdigest(), 'bytes': len(raw), 'width': width, 'height': height, 'mode': image.mode, 'pngBitDepth': raw[24], 'pngColorType': raw[25], 'pillowVerifyPassed': True, 'alphaExtrema': list(alpha.getextrema()), 'fullyTransparentPixels': histogram[0], 'fullyTransparentFraction': histogram[0]/(width*height), 'lowAlpha1to7Pixels': sum(histogram[1:8]), 'boundsAlphaAtLeast': bounds, 'marginsAlphaAtLeast': margins, 'borderAlphaMaximum': border, 'cornerAlpha': corners, 'readOnlyDecode': True, 'nativeOutputBytesPreserved': True, 'pixelEditingPerformed': False}
    assert path.read_bytes() == raw
    assert result['sha256'] == row['sha256']
    return result

if __name__ == '__main__':
    rows = json.loads((ROOT/'history-results.json').read_text())
    audits = [audit(row) for row in rows]
    (ROOT/'alpha-review.json').write_text(json.dumps(audits, ensure_ascii=False, indent=2)+'\n')
    print(json.dumps([{'key': r['key'], 'iteration': r['iteration'], 'dimensions': [r['width'],r['height']], 'sha256': r['sha256'], 'boundsAt8': r['boundsAlphaAtLeast']['8'], 'borderAlphaMaximum': r['borderAlphaMaximum']} for r in audits]))
