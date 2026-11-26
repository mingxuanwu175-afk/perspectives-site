import sys, argparse
import cv2, numpy as np
from PIL import Image

ap = argparse.ArgumentParser()
ap.add_argument('src'); ap.add_argument('out')
ap.add_argument('--rect', required=True)
ap.add_argument('--fg', default=''); ap.add_argument('--bg', default='')
ap.add_argument('--fgline', default=''); ap.add_argument('--bgline', default='')
ap.add_argument('--pad', type=int, default=40); ap.add_argument('--work', type=int, default=1300)
ap.add_argument('--iters', type=int, default=8); ap.add_argument('--keep', type=int, default=1)
ap.add_argument('--kill', default='')
ap.add_argument('--killgray', default='')  # x0,y0,x1,y1 boxes: drop light unsaturated pixels inside  # hlo,hhi,smin,vmin;... (OpenCV HSV, hue 0-180, s/v 0-255)
a = ap.parse_args()

def boxes(s):
    return [tuple(int(v) for v in b.split(',')) for b in s.split(';') if b.strip()]

img = cv2.imread(a.src, cv2.IMREAD_COLOR)
H, W = img.shape[:2]
x0, y0, x1, y1 = boxes(a.rect)[0]
cx0, cy0 = max(0, x0 - a.pad), max(0, y0 - a.pad)
cx1, cy1 = min(W, x1 + a.pad), min(H, y1 + a.pad)
crop = img[cy0:cy1, cx0:cx1]
ch, cw = crop.shape[:2]
s = min(1.0, a.work / max(ch, cw))
small = cv2.resize(crop, (int(cw * s), int(ch * s)), interpolation=cv2.INTER_AREA)
sh, sw = small.shape[:2]
T = lambda x, y: (int((x - cx0) * s), int((y - cy0) * s))

mask = np.full((sh, sw), cv2.GC_BGD, np.uint8)
p0, p1 = T(x0, y0), T(x1, y1)
mask[p0[1]:p1[1], p0[0]:p1[0]] = cv2.GC_PR_FGD
for bx0, by0, bx1, by1 in boxes(a.bg):
    q0, q1 = T(bx0, by0), T(bx1, by1); mask[max(0,q0[1]):q1[1], max(0,q0[0]):q1[0]] = cv2.GC_BGD
for bx0, by0, bx1, by1 in boxes(a.fg):
    q0, q1 = T(bx0, by0), T(bx1, by1); mask[max(0,q0[1]):q1[1], max(0,q0[0]):q1[0]] = cv2.GC_FGD
def lines(spec, val):
    for seg in [l for l in spec.split(';') if l.strip()]:
        pts = [int(v) for v in seg.split(',')]
        w = pts[-1]; pts = pts[:-1]
        P = [T(pts[i], pts[i + 1]) for i in range(0, len(pts), 2)]
        for i in range(len(P) - 1):
            cv2.line(mask, P[i], P[i + 1], int(val), max(1, int(w * s)))
lines(a.bgline, cv2.GC_BGD); lines(a.fgline, cv2.GC_FGD)

bgd = np.zeros((1, 65), np.float64); fgd = np.zeros((1, 65), np.float64)
cv2.grabCut(small, mask, None, bgd, fgd, a.iters, cv2.GC_INIT_WITH_MASK)
m = np.where((mask == cv2.GC_FGD) | (mask == cv2.GC_PR_FGD), 255, 0).astype(np.uint8)
if a.kill:
    hsv = cv2.cvtColor(small, cv2.COLOR_BGR2HSV)
    for spec in [k for k in a.kill.split(';') if k.strip()]:
        hlo, hhi, smin, vmin = [int(v) for v in spec.split(',')]
        bad = (hsv[..., 0] >= hlo) & (hsv[..., 0] <= hhi) & (hsv[..., 1] >= smin) & (hsv[..., 2] >= vmin)
        bad = cv2.dilate(bad.astype(np.uint8), cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3))) > 0
        m[bad & (mask != cv2.GC_FGD)] = 0

if a.killgray:
    hsv2 = cv2.cvtColor(small, cv2.COLOR_BGR2HSV)
    for bx0, by0, bx1, by1 in boxes(a.killgray):
        q0, q1 = T(bx0, by0), T(bx1, by1)
        sub = hsv2[q0[1]:q1[1], q0[0]:q1[0]]
        grey = (sub[..., 1] < 80) & (sub[..., 2] > 120)
        grey = cv2.dilate(grey.astype(np.uint8), cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3))) > 0
        m[q0[1]:q1[1], q0[0]:q1[0]][grey] = 0
# keep the largest components, fill holes
n, lab, stats, _ = cv2.connectedComponentsWithStats(m, 8)
order = sorted(range(1, n), key=lambda i: -stats[i, cv2.CC_STAT_AREA])
keep = np.zeros_like(m)
for i in order[:a.keep]:
    keep[lab == i] = 255
inv = cv2.bitwise_not(keep)
n2, lab2, st2, _ = cv2.connectedComponentsWithStats(inv, 4)
for i in range(1, n2):
    xx, yy, ww, hh, area = st2[i]
    if xx > 0 and yy > 0 and xx + ww < sw and yy + hh < sh and area < 0.002 * sw * sh:
        keep[lab2 == i] = 255
keep = cv2.morphologyEx(keep, cv2.MORPH_OPEN, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3)))

# upscale, smooth the edge, feather slightly
big = cv2.resize(keep, (cw, ch), interpolation=cv2.INTER_LINEAR)
big = cv2.GaussianBlur(big, (0, 0), 1.2 / s)
big = np.clip((big.astype(np.float32) - 128) * 2.2 + 128, 0, 255).astype(np.uint8)
big = cv2.GaussianBlur(big, (0, 0), 1.0)

rgb = cv2.cvtColor(crop, cv2.COLOR_BGR2RGB)
out = np.dstack([rgb, big])
ys, xs = np.where(big > 8)
bx0, by0, bx1, by1 = xs.min(), ys.min(), xs.max() + 1, ys.max() + 1
out = out[by0:by1, bx0:bx1]
Image.fromarray(out).save(a.out)
prev = Image.new('RGBA', (out.shape[1], out.shape[0]), (255, 0, 255, 255))
prev.alpha_composite(Image.fromarray(out))
prev.thumbnail((1000, 1000)); prev.convert('RGB').save(a.out.replace('.png', '-preview.jpg'), quality=85)
print('saved', a.out, out.shape, 'offset in source', cx0 + bx0, cy0 + by0)
