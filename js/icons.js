const PATHS = {
  close: '<path d="M6 6l12 12M18 6L6 18"/>',
  calendar: '<rect x="3.5" y="5" width="17" height="15.5" rx="1.5"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  external: '<path d="M14 5h5v5M19 5l-8 8M18 14v5H5V6h5"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  download: '<path d="M12 4v11M7 10l5 5 5-5M5 19h14"/>',
  lock: '<rect x="5" y="10.5" width="14" height="9.5" rx="1.5"/><path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5"/>',
  whistle: '<circle cx="9" cy="14" r="5"/><path d="M13 11.5l7.5-4.5M14 14.5h6.5V10"/>',
};

export const icon = (name, cls = '') =>
  `<svg class="icon ${cls}" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${PATHS[name]}</svg>`;

// Think Pink emblem: a gold ball with an awareness ribbon. Original drawing.
export function emblem(id = 'em') {
  return `<svg class="emblem" viewBox="0 0 120 124" aria-hidden="true" focusable="false">
    <defs>
      <radialGradient id="${id}-gold" cx="36%" cy="30%" r="78%">
        <stop offset="0" stop-color="#FFE7AE"/>
        <stop offset=".5" stop-color="#E7B65C"/>
        <stop offset="1" stop-color="#7A4A14"/>
      </radialGradient>
    </defs>
    <circle cx="60" cy="54" r="44" fill="url(#${id}-gold)"/>
    <g fill="none" stroke="#5A3410" stroke-width="2.6" stroke-linecap="round" opacity=".85">
      <path d="M16 54h88M60 10v88"/>
      <path d="M29 23c15 16 15 46 0 62M91 23c-15 16-15 46 0 62"/>
    </g>
    <path d="M44 120l24-34c6-9 3-20-8-20s-14 11-8 20l24 34" fill="none" stroke="#1A0C16" stroke-width="13" stroke-linejoin="round"/>
    <path d="M44 120l24-34c6-9 3-20-8-20s-14 11-8 20l24 34" fill="none" stroke="#FF5CA5" stroke-width="8" stroke-linejoin="round"/>
  </svg>`;
}
