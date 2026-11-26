// Player silhouettes for the arena background.
// Drawn from a simple skeleton (joints + limb widths) and fused with a "goo"
// filter so the joints read as one body. Original shapes, not traced from
// photos of any real player.

const POSES = {
  // Standing tall, ball held against the hip.
  ball: {
    head: [150, 64, 23, 28],
    neck: [[150, 86], [150, 112], 28],
    torso: [[104, 118], [196, 118], [182, 252], [118, 252]],
    shorts: [[110, 238], [190, 238], [206, 336], [158, 344], [150, 306], [142, 344], [94, 336]],
    limbs: [
      [[[108, 130], [90, 206], [96, 282]], [31, 24]],
      [[[192, 130], [228, 198], [210, 252]], [31, 24]],
      [[[132, 300], [124, 440], [120, 560]], [46, 31]],
      [[[168, 300], [178, 440], [184, 560]], [46, 31]],
    ],
    hands: [[98, 296, 13], [212, 258, 14]],
    feet: [[[120, 566], [94, 580], 25], [[184, 566], [210, 580], 25]],
    ball: [232, 272, 38],
  },
  // Rising to dunk, ball overhead in both hands.
  rise: {
    head: [150, 170, 22, 27],
    neck: [[150, 192], [150, 216], 28],
    torso: [[106, 222], [194, 222], [180, 352], [120, 352]],
    shorts: [[114, 338], [186, 338], [202, 432], [158, 440], [150, 406], [142, 440], [98, 432]],
    limbs: [
      [[[110, 232], [96, 152], [126, 90]], [30, 23]],
      [[[190, 232], [204, 152], [174, 90]], [30, 23]],
      [[[132, 402], [102, 470], [124, 548]], [44, 30]],
      [[[168, 402], [180, 500], [186, 590]], [44, 30]],
    ],
    hands: [[128, 82, 13], [172, 82, 13]],
    feet: [[[124, 552], [102, 566], 23], [[186, 594], [196, 614], 23]],
    ball: [150, 54, 38],
  },
  // Low drive, dribbling with the far hand out.
  drive: {
    head: [116, 198, 22, 27],
    neck: [[124, 220], [136, 242], 28],
    torso: [[108, 240], [192, 252], [196, 370], [132, 372]],
    shorts: [[128, 358], [200, 356], [220, 442], [176, 448], [168, 420], [158, 450], [114, 442]],
    limbs: [
      [[[112, 252], [82, 328], [70, 396]], [30, 23]],
      [[[190, 258], [236, 302], [262, 264]], [30, 23]],
      [[[146, 422], [96, 496], [102, 590]], [44, 30]],
      [[[188, 420], [236, 496], [226, 590]], [44, 30]],
    ],
    hands: [[66, 406, 13], [266, 256, 13]],
    feet: [[[102, 596], [74, 608], 23], [[226, 596], [254, 608], 23]],
    ball: [58, 474, 36],
  },
};

const line = ([x1, y1], [x2, y2], w) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke-width="${w}"/>`;
const poly = (pts, w) => `<polygon points="${pts.map((p) => p.join(',')).join(' ')}" stroke-width="${w}"/>`;

function body(p) {
  const [hx, hy, rx, ry] = p.head;
  const limbs = p.limbs.map(([pts, widths]) => pts.slice(1).map((pt, i) => line(pts[i], pt, widths[i])).join(''));
  return [
    `<ellipse cx="${hx}" cy="${hy}" rx="${rx}" ry="${ry}" stroke-width="0"/>`,
    line(p.neck[0], p.neck[1], p.neck[2]),
    poly(p.torso, 16),
    poly(p.shorts, 10),
    ...limbs,
    ...p.hands.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" stroke-width="0"/>`),
    ...p.feet.map(([a, b, w]) => line(a, b, w)),
    `<circle cx="${p.ball[0]}" cy="${p.ball[1]}" r="${p.ball[2]}" stroke-width="0"/>`,
  ].join('');
}

function seams([x, y, r]) {
  return `<g class="fig-seams" fill="none" stroke-width="2.2" stroke-linecap="round">
    <path d="M${x - r} ${y}h${2 * r}M${x} ${y - r}v${2 * r}"/>
    <path d="M${x - r * 0.62} ${y - r * 0.78}c${r * 0.42} ${r * 0.4} ${r * 0.42} ${r * 1.16} 0 ${r * 1.56}"/>
    <path d="M${x + r * 0.62} ${y - r * 0.78}c${-r * 0.42} ${r * 0.4} ${-r * 0.42} ${r * 1.16} 0 ${r * 1.56}"/>
  </g>`;
}

let serial = 0;

export function figure(name) {
  const p = POSES[name];
  serial += 1;
  const id = `fig${serial}`;
  return `<svg class="fig fig--${name}" viewBox="0 0 300 620" preserveAspectRatio="xMidYMax meet" aria-hidden="true" focusable="false">
    <defs>
      <filter id="${id}-goo" x="-12%" y="-12%" width="124%" height="124%" color-interpolation-filters="sRGB">
        <feGaussianBlur stdDeviation="6"/>
        <feColorMatrix values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 26 -11"/>
      </filter>
      <filter id="${id}-glow" x="-40%" y="-40%" width="180%" height="180%">
        <feGaussianBlur stdDeviation="16"/>
      </filter>
      <g id="${id}-body" fill="currentColor" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">${body(p)}</g>
    </defs>
    <use href="#${id}-body" class="fig-glow" filter="url(#${id}-glow)"/>
    <g filter="url(#${id}-goo)"><use href="#${id}-body" class="fig-rim" transform="translate(-5 -4)"/></g>
    <g filter="url(#${id}-goo)"><use href="#${id}-body" class="fig-body"/></g>
    ${seams(p.ball)}
  </svg>`;
}

export function court() {
  return `<svg class="court" viewBox="0 0 500 470" aria-hidden="true" focusable="false">
    <rect class="court-wood" x="0" y="0" width="500" height="470"/>
    <rect class="court-paint" x="170" y="0" width="160" height="190"/>
    <g class="court-lines" fill="none" stroke-width="3">
      <rect x="1.5" y="1.5" width="497" height="467"/>
      <rect x="170" y="0" width="160" height="190"/>
      <path d="M190 190A60 60 0 0 0 310 190"/>
      <path d="M190 190A60 60 0 0 1 310 190" stroke-dasharray="9 9"/>
      <path d="M30 0V142A237.5 237.5 0 0 0 470 142V0"/>
      <path d="M210 52.5A40 40 0 0 0 290 52.5"/>
      <path d="M220 40h60"/>
      <circle cx="250" cy="52.5" r="7.5"/>
      <path d="M190 470A60 60 0 0 1 310 470"/>
    </g>
  </svg>`;
}
