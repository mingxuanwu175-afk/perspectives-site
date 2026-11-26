import sys, json
import numpy as np, cv2
from PIL import Image

rng = np.random.default_rng(7)

def auto_key(rgb, alpha, lo_pct, hi_pct, gamma, grain):
    lum = cv2.cvtColor(rgb, cv2.COLOR_RGB2GRAY).astype(np.float32) / 255.0
    dark = 1.0 - lum
    inside = alpha > 0.5
    lo, hi = np.percentile(dark[inside], lo_pct), np.percentile(dark[inside], hi_pct)
    d = np.clip((dark - lo) / max(1e-3, hi - lo), 0, 1) ** gamma
    if grain:
        n = rng.normal(0, grain, d.shape).astype(np.float32)
        n = cv2.GaussianBlur(n, (0, 0), 0.6)
        d = np.clip(d + n, 0, 1)
    return d * alpha

def save_alpha(a, path, lossless):
    h, w = a.shape
    im = np.zeros((h, w, 4), np.uint8)
    im[..., 3] = np.clip(a * 255, 0, 255).astype(np.uint8)
    img = Image.fromarray(im)
    if lossless:
        img.save(path, 'WEBP', lossless=True, quality=100, method=6)
    else:
        img.save(path, 'WEBP', quality=82, alpha_quality=82, method=6)

def render(src, name, height, lo, hi, gamma, grain=0.05, hoop=None, pad=None):
    im = Image.open(src).convert('RGBA')
    s = height / im.height
    im = im.resize((round(im.width * s), height), Image.LANCZOS)
    arr = np.asarray(im).astype(np.float32)
    rgb = arr[..., :3].astype(np.uint8); alpha = arr[..., 3] / 255.0
    if pad:  # extra canvas (l, t, r, b) for things drawn outside the cutout
        l, t, r, b = [round(v * s) for v in pad]
        H, W = alpha.shape
        rgb = cv2.copyMakeBorder(rgb, t, b, l, r, cv2.BORDER_CONSTANT, value=(255, 255, 255))
        alpha = cv2.copyMakeBorder(alpha, t, b, l, r, cv2.BORDER_CONSTANT, value=0)
    key = auto_key(rgb, alpha, lo, hi, gamma, grain)
    sil = alpha.copy()
    if hoop:  # (cx, cy, ax, ay, angle, thickness) in cutout px, pre-scale
        cx, cy, ax, ay, ang, th = hoop
        l, t = (round(pad[0] * s), round(pad[1] * s)) if pad else (0, 0)
        ring = np.zeros(sil.shape, np.uint8)
        cv2.ellipse(ring, (round(cx * s) + l, round(cy * s) + t), (round(ax * s), round(ay * s)), ang, 0, 360, 255, max(2, round(th * s)), cv2.LINE_AA)
        sil = np.maximum(sil, ring / 255.0)
    save_alpha(sil, f'ink/{name}-color.webp', True)
    save_alpha(key, f'ink/{name}-key.webp', False)
    return sil, key

def preview(layers, size, paper, out):
    W, H = size
    canvas = np.ones((H, W, 3), np.float32) * np.array(paper, np.float32) / 255.0
    for sil, key, color, x, y, dx, dy in layers:
        c = np.array(color, np.float32) / 255.0
        h, w = sil.shape
        def mult(a, col, ox, oy):
            x0, y0 = max(0, ox), max(0, oy); x1, y1 = min(W, ox + w), min(H, oy + h)
            if x1 <= x0 or y1 <= y0: return
            sub = a[y0 - oy:y1 - oy, x0 - ox:x1 - ox][..., None]
            canvas[y0:y1, x0:x1] *= (1 - sub) + sub * col
        mult(sil, c, x + dx, y + dy)
        mult(key, np.array([0.08, 0.09, 0.11], np.float32), x, y)
    Image.fromarray((canvas * 255).astype(np.uint8)).save(out)
