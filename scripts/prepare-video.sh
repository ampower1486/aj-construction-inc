#!/usr/bin/env bash
#
# Encode a clip for the site intro.
#
#   ./scripts/prepare-video.sh ~/Desktop/my-clip.mp4
#
# Produces public/assets/video/intro.mp4 — silent, web-optimised, and sized for
# fullscreen playback. Your original file is never modified.
#
# Requires ffmpeg:  brew install ffmpeg
#
# You do NOT have to run this. Any MP4 dropped at public/assets/video/intro.mp4
# will play. This just makes it smaller and guarantees autoplay works
# everywhere, which is worth doing for a file every visitor downloads.

set -euo pipefail

SRC="${1:-}"
OUT_DIR="$(cd "$(dirname "$0")/.." && pwd)/public/assets/video"
OUT="$OUT_DIR/intro.mp4"

if [ -z "$SRC" ]; then
  echo "usage: $0 <path-to-video>"
  exit 1
fi

if [ ! -f "$SRC" ]; then
  echo "error: no such file — $SRC"
  exit 1
fi

if ! command -v ffmpeg >/dev/null 2>&1; then
  cat <<'MSG'
error: ffmpeg is not installed.

  brew install ffmpeg

Or skip this script entirely and copy your MP4 straight to:
  public/assets/video/intro.mp4
It will still play — just larger, and with its audio track intact (which some
browsers refuse to autoplay).
MSG
  exit 1
fi

mkdir -p "$OUT_DIR"

echo "Encoding intro video…"
ffmpeg -hide_banner -loglevel error -y -i "$SRC" \
  -an \
  -vf "scale='min(1920,iw)':-2" \
  -c:v libx264 -profile:v high -level 4.0 \
  -crf 26 -preset slow \
  -pix_fmt yuv420p \
  -movflags +faststart \
  "$OUT"

SIZE_KB=$(( $(wc -c < "$OUT") / 1024 ))

echo ""
echo "  wrote  $OUT"
echo "  size   ${SIZE_KB} KB"
echo ""

if [ "$SIZE_KB" -gt 2500 ]; then
  cat <<MSG
  NOTE: that is over ~2.5 MB, which is heavy for something every visitor
  downloads. Re-run with a higher CRF to shrink it (higher = smaller):

    ffmpeg -i "$SRC" -an -vf "scale='min(1600,iw)':-2" \\
      -c:v libx264 -crf 30 -preset slow -pix_fmt yuv420p \\
      -movflags +faststart "$OUT"
MSG
else
  echo "  Good size for an intro. Reload the site to see it."
fi

# --- Notes on flags, so this stays maintainable -------------------------------
#  -an               strip audio. Guarantees autoplay (browsers block sound) and
#                    cuts file size.
#  scale min(1920,iw) cap at 1920 wide, never upscale a smaller source.
#                    -2 keeps the aspect ratio at an even height (H.264 needs it).
#  -crf 26           quality target. Lower = better + bigger. 23–28 is the useful
#                    range for short full-motion video.
#  -pix_fmt yuv420p  required or Safari and QuickTime will not decode it.
#  -movflags +faststart  moves the index to the front so playback can start
#                    before the whole file has arrived.
