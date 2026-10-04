"""
Remove the flat background from the hero frames so the page can put any
background (e.g. a gradient) behind the portrait.

    python scripts/key_frames.py            # key public/frames/ in place
    python scripts/key_frames.py --preview  # write scripts/frames_debug/key_preview.jpg only

Run it after scripts/extract_frames.py. It reads the opaque frames, estimates
alpha from each pixel's distance to the background colour, "un-mixes" the
background out of soft edges (so hair doesn't keep a red fringe), and writes
RGBA WebP frames. manifest.json gets "transparent": true, which CharacterHero
uses to draw on a transparent canvas.

Needs: pip install numpy pillow scipy
"""

import argparse
import json
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage

ROOT = Path(__file__).resolve().parent.parent
FRAMES = ROOT / "public" / "frames"
DEBUG = ROOT / "scripts" / "frames_debug"


def background_colour(rgb):
    """Median of the top band and the upper side columns (never the body)."""
    h, w, _ = rgb.shape
    band = np.concatenate(
        [
            rgb[: h // 12].reshape(-1, 3),
            rgb[: h // 2, : w // 12].reshape(-1, 3),
            rgb[: h // 2, -w // 12 :].reshape(-1, 3),
        ]
    )
    return np.median(band, axis=0)


def key(img, lo, hi, spill):
    rgb = np.asarray(img.convert("RGB")).astype(np.float32)
    bg = background_colour(rgb)
    dist = np.sqrt(((rgb - bg) ** 2).sum(axis=2))
    alpha = np.clip((dist - lo) / (hi - lo), 0.0, 1.0)

    # keep only what is connected to the solid subject: removes specks of
    # compression noise in the background
    solid = alpha > 0.5
    labels, n = ndimage.label(solid)
    if n > 1:
        sizes = ndimage.sum(solid, labels, range(1, n + 1))
        keep = np.isin(labels, 1 + np.flatnonzero(sizes >= sizes.max() * 0.002))
        near = ndimage.binary_dilation(keep, iterations=6)
        alpha = np.where(near, alpha, 0.0)

    alpha = ndimage.gaussian_filter(alpha, 0.6)
    alpha = np.clip(alpha, 0.0, 1.0)

    # un-mix: C = a*F + (1-a)*B  ->  F = (C - (1-a)*B) / a
    a = np.maximum(alpha, 1e-3)[..., None]
    fg = (rgb - (1.0 - a) * bg) / a
    fg = np.where(alpha[..., None] > 0.02, fg, rgb)
    fg = np.clip(fg, 0, 255)

    # de-spill: the red backdrop also lit the hair's outer edge. Only near the
    # silhouette, and only in dark pixels (hair): skin and lips are much
    # brighter, so a face in profile keeps its colour. Red is capped relative
    # to green/blue.
    near = ndimage.distance_transform_edt(alpha >= 0.98) <= spill
    dark = np.clip((95.0 - fg[..., 1]) / 45.0, 0.0, 1.0)
    weight = np.where(near & (alpha > 0.02), dark, 0.0)
    cap = np.maximum(fg[..., 1], fg[..., 2]) * 1.25 + 10
    fg[..., 0] = fg[..., 0] - weight * np.maximum(fg[..., 0] - cap, 0.0)

    out = np.dstack([fg, alpha * 255.0]).round().astype(np.uint8)
    return Image.fromarray(out, "RGBA"), bg


def preview(frame, out):
    """The keyed frame on a checkerboard and on a warm gradient, side by side."""
    w, h = frame.size
    y, x = np.mgrid[0:h, 0:w]
    checker = (((x // 24) + (y // 24)) % 2) * 40 + 190
    checker = Image.fromarray(np.dstack([checker] * 3).astype(np.uint8), "RGB")
    t = np.clip(np.hypot((x / w - 0.62) * 1.2, (y / h - 0.6)) / 0.9, 0, 1)[..., None]
    inner, outer = np.array([240, 190, 172]), np.array([246, 238, 230])
    grad = Image.fromarray((inner * (1 - t) + outer * t).astype(np.uint8), "RGB")
    tiles = []
    for base in (checker, grad):
        b = base.copy()
        b.paste(frame, (0, 0), frame)
        tiles.append(b.resize((w // 2, h // 2)))
    sheet = Image.new("RGB", (w, h // 2))
    sheet.paste(tiles[0], (0, 0))
    sheet.paste(tiles[1], (w // 2, 0))
    out.parent.mkdir(parents=True, exist_ok=True)
    sheet.save(out, quality=90)
    print(f"preview: {out}")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--lo", type=float, default=22, help="distance below which a pixel is background")
    ap.add_argument("--hi", type=float, default=70, help="distance above which a pixel is fully subject")
    ap.add_argument("--spill", type=int, default=60, help="width in px of the edge band that gets de-spilled")
    ap.add_argument("--quality", type=int, default=88)
    ap.add_argument("--preview", action="store_true", help="only write a preview of the neutral frame")
    args = ap.parse_args()

    manifest_path = FRAMES / "manifest.json"
    manifest = json.loads(manifest_path.read_text())
    if manifest.get("transparent"):
        raise SystemExit("frames are already keyed: re-run extract_frames.py first")

    if args.preview:
        keyed, bg = key(Image.open(FRAMES / manifest["center"]), args.lo, args.hi, args.spill)
        print("background", bg.round())
        preview(keyed, DEBUG / "key_preview.jpg")
        return

    names = [manifest["center"], *dict.fromkeys(manifest["frames"])]
    for name in names:
        keyed, _ = key(Image.open(FRAMES / name), args.lo, args.hi, args.spill)
        keyed.save(FRAMES / name, "WEBP", quality=args.quality, alpha_quality=100, method=4)
        print("keyed", name)

    manifest["transparent"] = True
    manifest_path.write_text(json.dumps(manifest, indent=2))
    print(f"done: {len(names)} frames")


if __name__ == "__main__":
    main()
