#!/usr/bin/env python3
"""
Build web-ready assets from the originals in assets-src/.

    python3 scripts/prepare-assets.py

Reads   assets-src/gallery/*.jpg, assets-src/video-posters/*.jpg, assets-src/logo/*
Writes  public/assets/gallery/     (webp + jpg, full + thumb)
        public/assets/video/       (poster stills; the .mp4s themselves are checked in)
        public/assets/logo/        (master logo, transparent footer mark, favicons)
        public/assets/og/          (social share card)

The master logo (assets-src/logo/aj-logo.png) is copied byte-for-byte and is
never edited. The transparent mark is a SEPARATE derived file used only where
the logo sits on a dark surface.

To add a project photo: drop it in assets-src/gallery/, rerun this script, then
add an entry to src/data/gallery-manifest.js.
"""

import os
import shutil
from collections import deque

from PIL import Image, ImageDraw

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC_GALLERY = os.path.join(ROOT, "assets-src", "gallery")
SRC_POSTERS = os.path.join(ROOT, "assets-src", "video-posters")
SRC_LOGO = os.path.join(ROOT, "assets-src", "logo")
OUT_GALLERY = os.path.join(ROOT, "public", "assets", "gallery")
OUT_VIDEO = os.path.join(ROOT, "public", "assets", "video")
OUT_LOGO = os.path.join(ROOT, "public", "assets", "logo")
OUT_OG = os.path.join(ROOT, "public", "assets", "og")

FULL_MAX = 1800
THUMB_MAX = 800
NAVY = (12, 65, 98)


def ensure_dirs():
    for d in (OUT_GALLERY, OUT_VIDEO, OUT_LOGO, OUT_OG):
        os.makedirs(d, exist_ok=True)

    # Gallery output is fully derived, so clear it — otherwise renditions of
    # photos that have since been removed from assets-src/ linger forever.
    for f in os.listdir(OUT_GALLERY):
        os.remove(os.path.join(OUT_GALLERY, f))

    # Video posters are derived too, but the .mp4 files beside them are not.
    for f in os.listdir(OUT_VIDEO):
        if "-poster." in f:
            os.remove(os.path.join(OUT_VIDEO, f))


def save_pair(im, base, quality_webp=82, quality_jpg=84):
    """Write a .webp and a .jpg fallback for one image."""
    im.save(f"{base}.webp", "WEBP", quality=quality_webp, method=6)
    im.save(f"{base}.jpg", "JPEG", quality=quality_jpg, optimize=True, progressive=True)


def strip_exif(im):
    """Re-create the image without any EXIF payload (drops GPS from phone photos)."""
    clean = Image.new(im.mode, im.size)
    clean.putdata(list(im.getdata()))
    return clean


def build_gallery():
    if not os.path.isdir(SRC_GALLERY):
        print("  no assets-src/gallery — skipping")
        return

    names = sorted(f for f in os.listdir(SRC_GALLERY) if f.lower().endswith((".jpg", ".jpeg", ".png")))
    for name in names:
        stem = os.path.splitext(name)[0]
        im = Image.open(os.path.join(SRC_GALLERY, name)).convert("RGB")
        im = strip_exif(im)

        full = im.copy()
        full.thumbnail((FULL_MAX, FULL_MAX), Image.LANCZOS)
        save_pair(full, os.path.join(OUT_GALLERY, stem))

        thumb = im.copy()
        thumb.thumbnail((THUMB_MAX, THUMB_MAX), Image.LANCZOS)
        save_pair(thumb, os.path.join(OUT_GALLERY, f"{stem}-thumb"), 78, 80)

        print(f"  {stem:28} {im.size[0]}x{im.size[1]} -> full {full.size[0]}px + thumb {thumb.size[0]}px")


def build_video_posters():
    """
    Still frames for the click-to-play project videos. The .mp4s are committed
    as-is; only the poster a visitor sees before pressing play is generated here.
    """
    if not os.path.isdir(SRC_POSTERS):
        print("  no assets-src/video-posters — skipping")
        return

    names = sorted(f for f in os.listdir(SRC_POSTERS) if f.lower().endswith((".jpg", ".jpeg", ".png")))
    for name in names:
        stem = os.path.splitext(name)[0]
        im = Image.open(os.path.join(SRC_POSTERS, name)).convert("RGB")
        im = strip_exif(im)
        im.thumbnail((THUMB_MAX, THUMB_MAX), Image.LANCZOS)
        save_pair(im, os.path.join(OUT_VIDEO, f"{stem}-poster"), 78, 80)
        print(f"  {stem + '-poster':28} {im.size[0]}x{im.size[1]}")


def flood_transparent(im, tolerance=34):
    """
    Make the OUTER white background transparent via a flood fill seeded from the
    border. Interior white (window mullions, the counter of the 'A') is enclosed
    by dark pixels, so the fill never reaches it and it stays opaque.
    """
    im = im.convert("RGBA")
    w, h = im.size
    px = im.load()

    def is_bg(p):
        return p[0] >= 255 - tolerance and p[1] >= 255 - tolerance and p[2] >= 255 - tolerance

    seen = bytearray(w * h)
    q = deque()

    for x in range(w):
        for y in (0, h - 1):
            if is_bg(px[x, y]) and not seen[y * w + x]:
                seen[y * w + x] = 1
                q.append((x, y))
    for y in range(h):
        for x in (0, w - 1):
            if is_bg(px[x, y]) and not seen[y * w + x]:
                seen[y * w + x] = 1
                q.append((x, y))

    while q:
        x, y = q.popleft()
        px[x, y] = (255, 255, 255, 0)
        for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            nx, ny = x + dx, y + dy
            if 0 <= nx < w and 0 <= ny < h and not seen[ny * w + nx] and is_bg(px[nx, ny]):
                seen[ny * w + nx] = 1
                q.append((nx, ny))

    return im


def trim(im, pad=8):
    """Crop to the visible (non-transparent) content with a little breathing room."""
    bbox = im.split()[-1].getbbox()
    if not bbox:
        return im
    l, t, r, b = bbox
    return im.crop((max(0, l - pad), max(0, t - pad), min(im.width, r + pad), min(im.height, b + pad)))


def build_logo():
    master_src = os.path.join(SRC_LOGO, "aj-logo.png")
    master_dst = os.path.join(OUT_LOGO, "aj-logo.png")
    shutil.copyfile(master_src, master_dst)  # byte-for-byte, never edited
    print("  aj-logo.png                 copied unmodified (master)")

    logo = Image.open(master_src)

    mark = trim(flood_transparent(logo))
    mark.save(os.path.join(OUT_LOGO, "aj-logo-mark.png"), "PNG", optimize=True)
    print(f"  aj-logo-mark.png            transparent, trimmed to {mark.size[0]}x{mark.size[1]} (dark surfaces only)")

    conect = os.path.join(SRC_LOGO, "conect-r-logo.png")
    if os.path.exists(conect):
        shutil.copyfile(conect, os.path.join(OUT_LOGO, "conect-r-logo.png"))
        print("  conect-r-logo.png           copied")

    build_favicons(mark)


def build_favicons(mark):
    """
    Favicons need to read at 32px, where the full wordmark turns to mush. Use the
    logo's pictorial mark on navy: the top ~75% of the graphic, above the type
    (the underline bar sits at roughly 75% of the trimmed mark's height).
    """
    src = mark.crop((0, 0, mark.width, int(mark.height * 0.75)))

    for size in (16, 32, 48, 180, 192, 512):
        canvas = Image.new("RGBA", (size, size), NAVY + (255,))
        inner = int(size * 0.82)
        g = src.copy()
        g.thumbnail((inner, inner), Image.LANCZOS)

        white = Image.new("RGBA", g.size, (255, 255, 255, 255))
        white.putalpha(g.split()[-1])

        canvas.paste(white, ((size - g.width) // 2, (size - g.height) // 2), white)

        name = {180: "apple-touch-icon.png"}.get(size, f"favicon-{size}x{size}.png")
        canvas.save(os.path.join(OUT_LOGO, name), "PNG", optimize=True)

    ico = Image.open(os.path.join(OUT_LOGO, "favicon-48x48.png"))
    ico.save(os.path.join(ROOT, "public", "favicon.ico"), sizes=[(16, 16), (32, 32), (48, 48)])
    print("  favicons                    16/32/48/180/192/512 + favicon.ico")


def build_og():
    """1200x630 social card: project photo, navy scrim, logo lockup."""
    photo_path = os.path.join(SRC_GALLERY, "backyard-spa-walkway.jpg")
    if not os.path.exists(photo_path):
        print("  og — source photo missing, skipping")
        return

    W, H = 1200, 630
    photo = Image.open(photo_path).convert("RGB")

    scale = max(W / photo.width, H / photo.height)
    photo = photo.resize((int(photo.width * scale), int(photo.height * scale)), Image.LANCZOS)
    left = (photo.width - W) // 2
    top = int((photo.height - H) * 0.42)
    card = photo.crop((left, top, left + W, top + H)).convert("RGBA")

    scrim = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(scrim)
    for y in range(H):
        d.line([(0, y), (W, y)], fill=NAVY + (int(38 + 190 * (y / H) ** 1.5),))
    card = Image.alpha_composite(card, scrim)

    logo = Image.open(os.path.join(OUT_LOGO, "aj-logo-mark.png"))
    logo.thumbnail((520, 260), Image.LANCZOS)
    white = Image.new("RGBA", logo.size, (255, 255, 255, 255))
    white.putalpha(logo.split()[-1])
    card.paste(white, (72, H - logo.height - 64), white)

    card.convert("RGB").save(os.path.join(OUT_OG, "og-cover.jpg"), "JPEG", quality=88, optimize=True)
    print("  og-cover.jpg                1200x630")


if __name__ == "__main__":
    ensure_dirs()
    print("gallery:")
    build_gallery()
    print("video posters:")
    build_video_posters()
    print("logo:")
    build_logo()
    print("social:")
    build_og()
    print("\ndone.")
