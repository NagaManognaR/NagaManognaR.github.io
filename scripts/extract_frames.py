#!/usr/bin/env python3
"""
extract_frames.py  —  bake public/character.mp4 into a head-rotation sprite set.

    pip install opencv-python numpy
    python scripts/extract_frames.py                     # auto-detect everything
    python scripts/extract_frames.py --inspect           # just print the timeline, write nothing
    python scripts/extract_frames.py --keys 0 18 36 54 72 90 108 126 --wrap 144 --center -1

What it does
  1. Decodes the whole video sequentially (never seeks) and reports the real frame
     count, fps and duration. CAP_PROP_FRAME_COUNT is unreliable on single-keyframe
     MP4s, so frames are counted by reading them.
  2. Measures the background colour from the border pixels of every frame.
  3. Finds the head: the region with the most pixel variance over time. Its weighted
     centroid (in the neutral frame) becomes the face centre the browser aims from.
  4. Works out which way the head is facing in every frame by locating the neutral
     frame's inner face (eyes/nose/mouth) in that frame. The displacement points where
     the face moved, i.e. where the character is looking
     (screen-space, so "RIGHT" means towards the viewer's right, same as the cursor).
     This makes the detection independent of whether the video turns clockwise,
     counter-clockwise, both, or where it starts.
  5. Picks 64 frames at 5.625 degree steps around the circle (0 = UP, clockwise) plus
     the neutral frame (full video framing; --crop trims to the character), snaps the background to the exact
     measured colour (kills compression noise that would show as a seam against the
     page), and writes WebP files and manifest.json.
  6. Writes a labelled contact sheet so you can eyeball every pose before shipping.

If auto-detection picks the wrong poses (check the contact sheet), pass --keys with the
8 compass frame numbers in clockwise order starting at UP. Each gap between two keys is
then split into 8 evenly spaced frames. --wrap is the frame where the head is back at
UP after UP-LEFT (if the video completes the circle); without it the last segment
repeats the nearest key rather than inventing an in-between.
"""
from __future__ import annotations

import argparse
import json
import math
import sys
from pathlib import Path

import cv2
import numpy as np

COMPASS = ["UP", "UP-RIGHT", "RIGHT", "DOWN-RIGHT", "DOWN", "DOWN-LEFT", "LEFT", "UP-LEFT"]
ANALYSIS_SIDE = 360  # long side of the downscaled copy used for motion analysis


# ───────────────────────────────── helpers ──────────────────────────────────

def ang_diff(a, b):
    """Smallest absolute difference between angles in degrees (vectorised)."""
    return np.abs((np.asarray(a) - b + 180.0) % 360.0 - 180.0)


def hex_from_bgr(bgr) -> str:
    b, g, r = (int(round(c)) for c in bgr)
    return f"#{r:02x}{g:02x}{b:02x}"


def resolve_index(i: int, n: int) -> int:
    return i + n if i < 0 else i


def decode(path: Path):
    """Yield (index, frame) sequentially. Never seeks."""
    cap = cv2.VideoCapture(str(path))
    if not cap.isOpened():
        sys.exit(f"✗ Could not open {path}")
    i = 0
    while True:
        ok, frame = cap.read()
        if not ok:
            break
        yield i, frame
        i += 1
    cap.release()


# ──────────────────────────────── pass 1: analyse ───────────────────────────

def analyse(path: Path):
    cap = cv2.VideoCapture(str(path))
    fps = cap.get(cv2.CAP_PROP_FPS) or 0.0
    reported = int(cap.get(cv2.CAP_PROP_FRAME_COUNT) or 0)
    cap.release()

    small, border = [], []
    size = None
    for i, f in decode(path):
        if size is None:
            size = (f.shape[1], f.shape[0])
            scale = ANALYSIS_SIDE / max(size)
            small_size = (max(1, round(size[0] * scale)), max(1, round(size[1] * scale)))
                # top edge + upper 60% of both sides. The bottom edge is skipped: bodies are
        # usually cropped there, which would pollute the sample.
        side = int(f.shape[0] * 0.6)
        strip = np.concatenate([f[:3, ::2].reshape(-1, 3),
                                f[:side:2, :3].reshape(-1, 3), f[:side:2, -3:].reshape(-1, 3)])
        border.append(strip)
        small.append(cv2.resize(f, small_size, interpolation=cv2.INTER_AREA))

    if not small:
        sys.exit("✗ The video decoded to zero frames.")
    border = np.concatenate(border).astype(np.float32)
    bg = np.median(border, axis=0)
    spread = float(np.percentile(np.abs(border - bg).max(axis=1), 95))
    return dict(fps=fps, reported=reported, count=len(small), size=size,
                small=small, bg=bg, bg_spread=spread, scale=ANALYSIS_SIDE / max(size))


def pick_center(small, requested: str) -> int:
    n = len(small)
    if requested != "auto":
        return resolve_index(int(requested), n)
    # the most motionless frame in the last 12% of the video
    start = max(1, int(n * 0.88))
    gray = [cv2.cvtColor(f, cv2.COLOR_BGR2GRAY).astype(np.float32) for f in small[start - 1:]]
    stillness = []
    for k in range(1, len(gray) - 1):
        stillness.append(np.mean(np.abs(gray[k] - gray[k - 1])) + np.mean(np.abs(gray[k + 1] - gray[k])))
    if not stillness:
        return n - 1
    return start - 1 + 1 + int(np.argmin(stillness))


def head_region(small, center_idx):
    """Region of highest temporal variance = the moving head."""
    stack = np.stack([cv2.cvtColor(f, cv2.COLOR_BGR2GRAY) for f in small]).astype(np.float32)
    var = cv2.GaussianBlur(stack.std(axis=0), (0, 0), 3)
    thresh = max(var.max() * 0.25, 2.0)
    mask = (var > thresh).astype(np.uint8)
    n, labels, stats, _ = cv2.connectedComponentsWithStats(mask)
    if n <= 1:
        sys.exit("✗ No moving region found — is the head actually turning in this video?")
    biggest = 1 + int(np.argmax(stats[1:, cv2.CC_STAT_AREA]))
    x, y, w, h = stats[biggest, :4]
    region = labels == biggest
    ys, xs = np.nonzero(region)
    wts = var[ys, xs]
    cx, cy = float(np.average(xs, weights=wts)), float(np.average(ys, weights=wts))
    # expand the box a little so flow sees the whole face edge
    pad_x, pad_y = int(w * 0.2), int(h * 0.2)
    H, W = var.shape
    box = (max(0, x - pad_x), max(0, y - pad_y), min(W, x + w + pad_x), min(H, y + h + pad_y))
    return box, (cx / W, cy / H)


def _edges(gray):
    g = cv2.GaussianBlur(gray, (0, 0), 1.2).astype(np.float32)
    return cv2.magnitude(cv2.Sobel(g, cv2.CV_32F, 1, 0), cv2.Sobel(g, cv2.CV_32F, 0, 1))


def facing_directions(small, center_idx, box):
    """
    Where the face features moved, relative to the neutral frame, per frame.

    The inner face (eyes / nose / mouth) of the neutral frame is used as a template and
    located in every other frame by normalised cross-correlation on edge maps. The
    displacement of the best match is the facing direction: when she looks up-left, her
    features slide up-left. Template matching copes with the large, fast shifts of a
    head turn far better than dense optical flow does.
    """
    x0, y0, x1, y1 = box
    w, h = x1 - x0, y1 - y0
    # inner 55% of the head box, biased slightly downward (eyes-to-mouth band)
    tx0, tx1 = x0 + int(w * 0.225), x1 - int(w * 0.225)
    ty0, ty1 = y0 + int(h * 0.30), y1 - int(h * 0.15)
    ref = _edges(cv2.cvtColor(small[center_idx], cv2.COLOR_BGR2GRAY))
    tpl = ref[ty0:ty1, tx0:tx1]
    bearings, mags, scores = [], [], []
    for f in small:
        cur = _edges(cv2.cvtColor(f, cv2.COLOR_BGR2GRAY))[y0:y1, x0:x1]
        res = cv2.matchTemplate(cur, tpl, cv2.TM_CCOEFF_NORMED)
        _, score, _, (mx, my) = cv2.minMaxLoc(res)
        # sub-pixel refinement with a parabola fit around the peak
        def refine(v, lo, c, hi):
            den = lo - 2 * c + hi
            return v + (0.5 * (lo - hi) / den if abs(den) > 1e-6 else 0.0)
        fx, fy = float(mx), float(my)
        if 0 < mx < res.shape[1] - 1:
            fx = refine(mx, res[my, mx - 1], res[my, mx], res[my, mx + 1])
        if 0 < my < res.shape[0] - 1:
            fy = refine(my, res[my - 1, mx], res[my, mx], res[my + 1, mx])
        vx, vy = fx - (tx0 - x0), fy - (ty0 - y0)
        mag = math.hypot(vx, vy)
        scores.append(score)
        if mag < 0.75:  # effectively facing the camera
            bearings.append(np.nan); mags.append(mag); continue
        # bearing: 0 = up, 90 = right, 180 = down, 270 = left (image y points down)
        bearings.append(math.degrees(math.atan2(vx, -vy)) % 360.0)
        mags.append(mag)
    return np.array(bearings), np.array(mags)


def select_auto(bearings, mags, center_idx, count):
    valid = ~np.isnan(bearings)
    valid[center_idx] = False
    if valid.sum() < 8:
        sys.exit("✗ Too few turned-head frames detected. Use --keys to set the poses manually.")
    ref_mag = np.percentile(mags[valid], 75)
    candidates = valid & (mags >= 0.35 * ref_mag)
    idx = np.nonzero(candidates)[0]
    step = 360.0 / count
    picks, gaps = [], []
    for k in range(count):
        target = k * step
        d = ang_diff(bearings[idx], target)
        # prefer fully turned frames over half-turned ones at the same bearing
        cost = d + 6.0 * np.abs(np.log(mags[idx] / ref_mag))
        j = int(np.argmin(cost))
        picks.append(int(idx[j])); gaps.append(float(d[j]))
    return picks, gaps


def select_manual(keys, wrap, count):
    per = count // 8
    ends = keys[1:] + [wrap]
    picks = []
    for a, b in zip(keys, ends):
        for j in range(per):
            if b is None:  # no return-to-UP frame: hold the nearest key, never blend
                picks.append(a if j < per / 2 else keys[0])
            else:
                picks.append(int(round(a + (b - a) * j / per)))
    return picks


# ─────────────────────────────── pass 2: export ─────────────────────────────

def crop_box(small, bg, scale, size, tol, pad, needed):
    """Union bbox of everything that isn't background, across the exported frames."""
    union = None
    for i in needed:
        diff = np.abs(small[i].astype(np.int16) - bg.astype(np.int16)).max(axis=2)
        ys, xs = np.nonzero(diff > tol * 1.5)
        if len(xs) == 0:
            continue
        b = np.array([xs.min(), ys.min(), xs.max(), ys.max()])
        union = b if union is None else np.array([min(union[0], b[0]), min(union[1], b[1]),
                                                  max(union[2], b[2]), max(union[3], b[3])])
    W, H = size
    if union is None:
        return (0, 0, W, H)
    x0, y0, x1, y1 = (union / scale).tolist()
    w, h = x1 - x0, y1 - y0
    px, py = w * pad, h * pad
    x0, y0 = max(0, int(x0 - px)), max(0, int(y0 - py))
    x1, y1 = min(W, int(x1 + px)), min(H, int(y1 + py))
    # if the body runs off the bottom of the video, keep it flush with the bottom edge
    return (x0, y0, x1, y1)


def clean_background(img, bg, tol):
    """Snap every near-background pixel connected to the border to the exact bg colour."""
    diff = np.abs(img.astype(np.int16) - bg.astype(np.int16)).max(axis=2)
    near = (diff <= tol).astype(np.uint8)
    n, labels = cv2.connectedComponents(near, connectivity=4)
    edge_labels = np.unique(np.concatenate([labels[0], labels[-1], labels[:, 0], labels[:, -1]]))
    edge_labels = edge_labels[edge_labels != 0]
    img[np.isin(labels, edge_labels)] = bg
    return img


def contact_sheet(tiles, labels, path, cols=8):
    th, tw = tiles[0].shape[:2]
    rows = math.ceil(len(tiles) / cols)
    sheet = np.full((rows * (th + 22), cols * tw, 3), 255, np.uint8)
    for k, (t, lab) in enumerate(zip(tiles, labels)):
        r, c = divmod(k, cols)
        y, x = r * (th + 22), c * tw
        sheet[y:y + th, x:x + tw] = t
        cv2.putText(sheet, lab, (x + 4, y + th + 16), cv2.FONT_HERSHEY_SIMPLEX, 0.42, (20, 20, 20), 1, cv2.LINE_AA)
    cv2.imwrite(str(path), sheet)


# ──────────────────────────────────── main ──────────────────────────────────

def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--video", default="public/character.mp4")
    ap.add_argument("--out", default="public/frames")
    ap.add_argument("--debug-dir", default="scripts/frames_debug", help="contact sheet goes here (not shipped)")
    ap.add_argument("--count", type=int, default=64, help="frames around the circle (multiple of 8)")
    ap.add_argument("--center", default="auto", help="neutral frame index, 'auto' = stillest frame near the end")
    ap.add_argument("--keys", type=int, nargs=8, metavar="F", help="manual compass frames, clockwise from UP")
    ap.add_argument("--wrap", type=int, help="with --keys: frame where the head is back at UP after UP-LEFT")
    ap.add_argument("--quality", type=int, default=92, help="WebP quality 1-100, or 101 for lossless")
    ap.add_argument("--max-height", type=int, default=1400, help="downscale exported frames to this height")
    ap.add_argument("--bg-tolerance", type=int, default=14, help="max per-channel distance counted as background")
    ap.add_argument("--keep-background", action="store_true",
                    help="don't flatten the background to one colour (for softly lit, shaded walls)")
    ap.add_argument("--crop-pad", type=float, default=0.08, help="padding around the auto-crop, as a fraction")
    ap.add_argument("--crop", action="store_true",
                    help="crop to the character. Off by default: the hero covers the full viewport, "
                         "so it needs the video's full framing")
    ap.add_argument("--inspect", action="store_true", help="print the analysis and exit without writing")
    args = ap.parse_args()

    if args.count % 8:
        sys.exit("✗ --count must be a multiple of 8")
    video = Path(args.video)
    if not video.exists():
        sys.exit(f"✗ {video} not found. Put the video at public/character.mp4 or pass --video.")

    print(f"→ Decoding {video} (sequential, no seeking)…")
    A = analyse(video)
    n = A["count"]
    fps = A["fps"] or 24.0
    print(f"  frames: {n} decoded (container reports {A['reported']}), {A['fps']:.3f} fps, "
          f"{n / fps:.2f}s, {A['size'][0]}×{A['size'][1]}")
    bg_hex = hex_from_bgr(A["bg"])
    print(f"  background: {bg_hex}  (95th-pct border deviation {A['bg_spread']:.1f})")
    if A["bg_spread"] > 20:
        print("  ⚠ The border isn't a flat colour (gradient, vignette or noise). The page will match "
              "the median, but edges may show. Consider regenerating on a flat background.")

    center_idx = pick_center(A["small"], args.center)
    box, face = head_region(A["small"], center_idx)
    print(f"  neutral frame: {center_idx}  (t={center_idx / fps:.2f}s)")
    bearings, mags = facing_directions(A["small"], center_idx, box)

    # compass report (always from the flow analysis, so you can sanity-check --keys too)
    print("\n  Detected compass poses (frame · time · measured bearing):")
    ok = ~np.isnan(bearings) & (mags >= 0.35 * np.nanpercentile(mags[mags > 0], 75))
    ok[center_idx] = False
    compass_frames = {}
    for k, name in enumerate(COMPASS):
        target = k * 45.0
        cand = np.nonzero(ok)[0]
        j = int(cand[np.argmin(ang_diff(bearings[cand], target))])
        compass_frames[name] = j
        print(f"    {name:<11} frame {j:>4}  t={j / fps:5.2f}s  {bearings[j]:6.1f}°")
    print(f"    {'CENTER':<11} frame {center_idx:>4}  t={center_idx / fps:5.2f}s")

    if args.keys:
        keys = [resolve_index(k, n) for k in args.keys]
        wrap = resolve_index(args.wrap, n) if args.wrap is not None else None
        picks = select_manual(keys, wrap, args.count)
        gaps = [float(ang_diff(bearings[p], k * 360 / args.count)) if not np.isnan(bearings[p]) else float("nan")
                for k, p in enumerate(picks)]
        compass_frames = {name: keys[k] for k, name in enumerate(COMPASS)}
        mode = "manual"
    else:
        picks, gaps = select_auto(bearings, mags, center_idx, args.count)
        mode = "auto"

    unique = len(set(picks))
    worst = np.nanmax(gaps) if gaps else 0
    step = 360 / args.count
    print(f"\n  {args.count} frames selected ({mode}), {unique} unique source frames, "
          f"worst bearing error {worst:.1f}° (step is {step:.2f}°)")
    if unique < args.count * 0.5:
        print("  ⚠ Under half the steps have their own frame: the video mostly holds the 8 poses and "
              "moves quickly between them, so in-between angles reuse the nearest pose.")
    if worst > step * 2:
        bad = [f"{k * step:.0f}°" for k, g in enumerate(gaps) if g > step * 2]
        print(f"  ⚠ Coverage gaps near: {', '.join(bad)}. Check the contact sheet.")

    if args.inspect:
        return

    # ── export ──
    out = Path(args.out); out.mkdir(parents=True, exist_ok=True)
    dbg = Path(args.debug_dir); dbg.mkdir(parents=True, exist_ok=True)
    needed = sorted(set(picks) | {center_idx})
    crop = (0, 0, *A["size"]) if not args.crop else crop_box(
        A["small"], A["bg"], A["scale"], A["size"], args.bg_tolerance, args.crop_pad, needed)
    cw, ch = crop[2] - crop[0], crop[3] - crop[1]
    out_scale = min(1.0, args.max_height / ch)
    out_size = (round(cw * out_scale), round(ch * out_scale))
    params = [cv2.IMWRITE_WEBP_QUALITY, args.quality]

    print(f"\n→ Exporting {len(needed)} source frames, crop {crop} → {out_size[0]}×{out_size[1]}")
    rendered = {}
    bg = A["bg"].round().astype(np.uint8)
    for i, frame in decode(video):
        if i not in needed:
            continue
        img = frame[crop[1]:crop[3], crop[0]:crop[2]].copy()
        if out_scale < 1:
            img = cv2.resize(img, out_size, interpolation=cv2.INTER_AREA)
        rendered[i] = img if args.keep_background else clean_background(img, bg, args.bg_tolerance)
        if len(rendered) == len(needed):
            break  # stop decoding once everything we need is out

    files = []
    for k, src in enumerate(picks):
        name = f"f{k:02d}.webp"
        cv2.imwrite(str(out / name), rendered[src], params)
        files.append(name)
    cv2.imwrite(str(out / "center.webp"), rendered[center_idx], params)

    # face centre: analysis coords → cropped/exported coords (normalised 0..1)
    fx = (face[0] * A["size"][0] - crop[0]) / cw
    fy = (face[1] * A["size"][1] - crop[1]) / ch

    manifest = {
        "version": 1,
        "count": args.count,
        "stepDegrees": step,
        "zeroBearing": "UP, clockwise",
        "width": out_size[0],
        "height": out_size[1],
        "background": bg_hex,
        "face": {"x": round(fx, 4), "y": round(fy, 4)},
        "frames": files,
        "center": "center.webp",
        "source": {
            "video": video.name, "fps": round(fps, 3), "frameCount": n,
            "crop": list(map(int, crop)), "centerFrame": center_idx,
            "compass": compass_frames, "picks": picks, "mode": mode,
        },
    }
    (out / "manifest.json").write_text(json.dumps(manifest, indent=2))

    thumbs, labels = [], []
    tw = 150
    th = round(tw * out_size[1] / out_size[0])
    for k, src in enumerate(picks):
        thumbs.append(cv2.resize(rendered[src], (tw, th), interpolation=cv2.INTER_AREA))
        labels.append(f"{k:02d} {k * step:5.1f} #{src}")
    thumbs.append(cv2.resize(rendered[center_idx], (tw, th), interpolation=cv2.INTER_AREA))
    labels.append(f"center #{center_idx}")
    contact_sheet(thumbs, labels, dbg / "contact_sheet.jpg")

    total = sum((out / f).stat().st_size for f in files + ["center.webp"])
    print(f"✓ Wrote {len(files) + 1} WebP frames ({total / 1024:.0f} KB total) + manifest.json to {out}/")
    print(f"✓ Contact sheet: {dbg / 'contact_sheet.jpg'}  — check each pose looks the right way")
    print(f"  Face centre (normalised): {manifest['face']}   Background: {bg_hex}")


if __name__ == "__main__":
    main()
