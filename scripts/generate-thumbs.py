# Generates small "-thumb" variants (jpg + webp) of every photo in the
# CMS-driven grid folders, for the grid/card views (fotogalerie, kotatka
# litters, tym, o-nas "kousek domova"). The original full-res file is left
# untouched and keeps being used for the lightbox full view — see
# gridSrcOf() in scripts/render-templates.js, which prefers the "-thumb"
# file when present and falls back to the original otherwise.
#
# Run this after uploading new photos through /admin (or add any new grid
# folder to DIRS below), then run `node scripts/prerender.js` to pick up
# the new thumbnails in the generated HTML.
#
# Requires Pillow: pip install Pillow

from PIL import Image
import os

DIRS = [
    'images/gallery',
    'images/kittens/vrh-a',
    'images/kittens/vrh-b',
    'images/onas',
    'images/team',
]
MAX_EDGE = 640  # generous for the largest grid cell at 2x pixel density


def main():
    root = os.path.join(os.path.dirname(__file__), '..')
    count = 0
    for d in DIRS:
        full_dir = os.path.join(root, d)
        if not os.path.isdir(full_dir):
            continue
        for fname in sorted(os.listdir(full_dir)):
            if not fname.endswith('.jpg') or '-thumb' in fname:
                continue
            src_path = os.path.join(full_dir, fname)
            base = fname[:-4]
            jpg_thumb = os.path.join(full_dir, base + '-thumb.jpg')
            webp_thumb = os.path.join(full_dir, base + '-thumb.webp')

            im = Image.open(src_path).convert('RGB')
            w, h = im.size
            scale = MAX_EDGE / max(w, h)
            thumb = im.resize((round(w * scale), round(h * scale)), Image.LANCZOS) if scale < 1 else im

            thumb.save(jpg_thumb, 'JPEG', quality=78, optimize=True, progressive=True)
            thumb.save(webp_thumb, 'WEBP', quality=82, method=6)
            count += 1

    print(f'Generated {count} thumb pairs')


if __name__ == '__main__':
    main()
