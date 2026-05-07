import fs from 'node:fs/promises';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const sharp = require('sharp');

const root = path.resolve(import.meta.dirname, '..');
const outputDir = path.resolve(import.meta.dirname, 'assets');
const iconPath = path.resolve(root, 'apps/mobile/assets/icon.png');
const iconBuffer = await fs.readFile(iconPath);
const iconDataUri = `data:image/png;base64,${iconBuffer.toString('base64')}`;

const colors = {
  bg: '#080A0F',
  bg2: '#0E1420',
  panel: '#111827',
  panel2: '#172033',
  border: '#263244',
  text: '#F8FAFC',
  muted: '#A8B3C7',
  subtle: '#6F7A8E',
  accent: '#34D399',
  sky: '#38BDF8',
  amber: '#FBBF24',
  coral: '#FB7185',
  white: '#FFFFFF',
};

const escapeXml = (value) =>
  String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');

const wrap = (text, maxChars) => {
  const words = text.split(/\s+/);
  const lines = [];
  let current = '';

  words.forEach((word) => {
    const next = current ? `${current} ${word}` : word;
    if (next.length > maxChars && current) {
      lines.push(current);
      current = word;
      return;
    }
    current = next;
  });

  if (current) {
    lines.push(current);
  }

  return lines;
};

const textBlock = ({
  x,
  y,
  text,
  size,
  weight = 700,
  color = colors.text,
  maxChars = 28,
  lineHeight = Math.round(size * 1.28),
  anchor = 'start',
}) =>
  wrap(text, maxChars)
    .map(
      (line, index) =>
        `<text x="${x}" y="${y + index * lineHeight}" fill="${color}" font-family="Inter, Arial, sans-serif" font-size="${size}" font-weight="${weight}" text-anchor="${anchor}">${escapeXml(line)}</text>`
    )
    .join('');

const pill = (x, y, w, label, color = colors.sky) => `
  <rect x="${x}" y="${y}" width="${w}" height="44" rx="22" fill="${color}" fill-opacity="0.13" stroke="${color}" stroke-opacity="0.42"/>
  <text x="${x + w / 2}" y="${y + 29}" fill="${color}" font-family="Inter, Arial, sans-serif" font-size="20" font-weight="800" text-anchor="middle">${escapeXml(label)}</text>
`;

const scoreBar = (x, y, w, label, value, color) => `
  <text x="${x}" y="${y}" fill="${colors.muted}" font-family="Inter, Arial, sans-serif" font-size="23" font-weight="800">${escapeXml(label)}</text>
  <text x="${x + w}" y="${y}" fill="${color}" font-family="Inter, Arial, sans-serif" font-size="24" font-weight="900" text-anchor="end">${value}</text>
  <rect x="${x}" y="${y + 18}" width="${w}" height="10" rx="5" fill="#263244"/>
  <rect x="${x}" y="${y + 18}" width="${Math.round((w * value) / 100)}" height="10" rx="5" fill="${color}"/>
`;

const phoneShell = (x, y, w, h, body) => `
  <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="54" fill="#05070B" stroke="#263244" stroke-width="2"/>
  <rect x="${x + 24}" y="${y + 24}" width="${w - 48}" height="${h - 48}" rx="34" fill="${colors.bg}"/>
  <rect x="${x + w / 2 - 58}" y="${y + 38}" width="116" height="12" rx="6" fill="#202B3A"/>
  <g transform="translate(${x + 48}, ${y + 78})">${body}</g>
`;

const appHeader = (brand = 'HookScore') => `
  <image href="${iconDataUri}" x="0" y="0" width="58" height="58"/>
  <text x="76" y="38" fill="${colors.text}" font-family="Inter, Arial, sans-serif" font-size="30" font-weight="900">${brand}</text>
`;

const svgDoc = (width, height, body) => `
<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#080A0F"/>
      <stop offset="48%" stop-color="#101827"/>
      <stop offset="100%" stop-color="#061A21"/>
    </linearGradient>
    <radialGradient id="glow" cx="72%" cy="18%" r="58%">
      <stop offset="0%" stop-color="#34D399" stop-opacity="0.24"/>
      <stop offset="56%" stop-color="#38BDF8" stop-opacity="0.1"/>
      <stop offset="100%" stop-color="#080A0F" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="${width}" height="${height}" fill="url(#bg)"/>
  <rect width="${width}" height="${height}" fill="url(#glow)"/>
  ${body}
</svg>`;

const writeSvgPng = async (fileName, width, height, body) => {
  const svg = svgDoc(width, height, body);
  await sharp(Buffer.from(svg)).png().toFile(path.join(outputDir, fileName));
};

const formPhoneBody = `
  ${appHeader()}
  <text x="0" y="122" fill="${colors.accent}" font-family="Inter, Arial, sans-serif" font-size="22" font-weight="900">Creator workspace</text>
  <text x="0" y="170" fill="${colors.text}" font-family="Inter, Arial, sans-serif" font-size="48" font-weight="900">Check your hook</text>
  ${textBlock({ x: 0, y: 216, text: 'Paste the opening, describe the short, and score it before you edit or post.', size: 23, weight: 600, color: colors.muted, maxChars: 44, lineHeight: 32 })}
  <rect x="0" y="274" width="520" height="96" rx="18" fill="${colors.panel}" stroke="${colors.border}"/>
  <text x="28" y="316" fill="${colors.muted}" font-family="Inter, Arial, sans-serif" font-size="20" font-weight="800">First line or on-screen text</text>
  <text x="28" y="350" fill="${colors.text}" font-family="Inter, Arial, sans-serif" font-size="23" font-weight="700">I stopped wasting money on hooks...</text>
  <rect x="0" y="394" width="520" height="132" rx="18" fill="${colors.panel}" stroke="${colors.border}"/>
  <text x="28" y="436" fill="${colors.muted}" font-family="Inter, Arial, sans-serif" font-size="20" font-weight="800">What is the video about?</text>
  <text x="28" y="472" fill="${colors.text}" font-family="Inter, Arial, sans-serif" font-size="23" font-weight="700">A short video showing how creators can</text>
  <text x="28" y="504" fill="${colors.text}" font-family="Inter, Arial, sans-serif" font-size="23" font-weight="700">spot weak openings before posting.</text>
  ${pill(0, 558, 118, 'Views', colors.sky)}
  ${pill(134, 558, 112, 'Trust', colors.accent)}
  ${pill(262, 558, 126, 'Sales', colors.amber)}
  <rect x="0" y="642" width="520" height="84" rx="20" fill="${colors.accent}"/>
  <text x="260" y="696" fill="#03130D" font-family="Inter, Arial, sans-serif" font-size="27" font-weight="900" text-anchor="middle">Score hook</text>
`;

const resultPhoneBody = `
  <text x="0" y="38" fill="${colors.text}" font-family="Inter, Arial, sans-serif" font-size="45" font-weight="900">Hook score</text>
  ${textBlock({ x: 0, y: 82, text: 'Use the diagnosis, fix, and rewrites to tighten the opening.', size: 23, weight: 600, color: colors.muted, maxChars: 44, lineHeight: 32 })}
  <rect x="0" y="132" width="520" height="270" rx="24" fill="${colors.panel}" stroke="${colors.border}"/>
  <rect x="32" y="132" width="120" height="8" rx="4" fill="${colors.accent}"/>
  <text x="32" y="186" fill="${colors.subtle}" font-family="Inter, Arial, sans-serif" font-size="20" font-weight="900">SCORE</text>
  <text x="32" y="286" fill="${colors.accent}" font-family="Inter, Arial, sans-serif" font-size="92" font-weight="900">84</text>
  <text x="164" y="276" fill="${colors.text}" font-family="Inter, Arial, sans-serif" font-size="34" font-weight="900">strong hook</text>
  <rect x="32" y="326" width="456" height="12" rx="6" fill="#263244"/>
  <rect x="32" y="326" width="383" height="12" rx="6" fill="${colors.accent}"/>
  <text x="32" y="374" fill="${colors.muted}" font-family="Inter, Arial, sans-serif" font-size="22" font-weight="700">Goals: Views, Trust, Sales</text>
  <rect x="0" y="430" width="520" height="146" rx="22" fill="${colors.panel}" stroke="${colors.border}"/>
  <text x="28" y="474" fill="${colors.coral}" font-family="Inter, Arial, sans-serif" font-size="19" font-weight="900">MAIN PROBLEM</text>
  <text x="28" y="514" fill="${colors.text}" font-family="Inter, Arial, sans-serif" font-size="25" font-weight="800">The promise is clear, but the payoff</text>
  <text x="28" y="548" fill="${colors.text}" font-family="Inter, Arial, sans-serif" font-size="25" font-weight="800">needs to appear sooner.</text>
  <rect x="0" y="602" width="520" height="214" rx="22" fill="${colors.panel}" stroke="${colors.border}"/>
  <text x="28" y="648" fill="${colors.sky}" font-family="Inter, Arial, sans-serif" font-size="25" font-weight="900">Try these hooks</text>
  <text x="28" y="696" fill="${colors.text}" font-family="Inter, Arial, sans-serif" font-size="23" font-weight="800">1. Stop posting hooks that hide the payoff</text>
  <text x="28" y="738" fill="${colors.text}" font-family="Inter, Arial, sans-serif" font-size="23" font-weight="800">2. This opening loses viewers in 3 seconds</text>
  <text x="28" y="780" fill="${colors.text}" font-family="Inter, Arial, sans-serif" font-size="23" font-weight="800">3. Fix this before your next short goes live</text>
`;

const videoPhoneBody = `
  <text x="0" y="38" fill="${colors.text}" font-family="Inter, Arial, sans-serif" font-size="45" font-weight="900">Visual context</text>
  ${textBlock({ x: 0, y: 84, text: 'Add the opening seconds so the analyzer can judge visual-text fit.', size: 23, weight: 600, color: colors.muted, maxChars: 44, lineHeight: 32 })}
  <rect x="0" y="136" width="520" height="300" rx="28" fill="${colors.panel}" stroke="${colors.border}"/>
  <rect x="34" y="174" width="452" height="214" rx="22" fill="${colors.bg2}"/>
  <polygon points="222,228 222,334 316,281" fill="${colors.accent}"/>
  <text x="34" y="480" fill="${colors.sky}" font-family="Inter, Arial, sans-serif" font-size="25" font-weight="900">Opening window</text>
  <rect x="0" y="518" width="520" height="88" rx="20" fill="${colors.panel}" stroke="${colors.border}"/>
  <text x="28" y="570" fill="${colors.text}" font-family="Inter, Arial, sans-serif" font-size="25" font-weight="800">0:00 to 0:05 selected</text>
  <rect x="0" y="638" width="520" height="128" rx="22" fill="${colors.panel}" stroke="${colors.border}"/>
  <text x="28" y="686" fill="${colors.muted}" font-family="Inter, Arial, sans-serif" font-size="21" font-weight="800">Checks today</text>
  <text x="28" y="738" fill="${colors.accent}" font-family="Inter, Arial, sans-serif" font-size="52" font-weight="900">1 / 2</text>
`;

const historyPhoneBody = `
  <text x="0" y="38" fill="${colors.text}" font-family="Inter, Arial, sans-serif" font-size="45" font-weight="900">History &amp; control</text>
  ${textBlock({ x: 0, y: 84, text: 'Save checks, review past scores, and manage account data.', size: 23, weight: 600, color: colors.muted, maxChars: 44, lineHeight: 32 })}
  <rect x="0" y="138" width="520" height="118" rx="22" fill="${colors.panel}" stroke="${colors.border}"/>
  <text x="28" y="186" fill="${colors.text}" font-family="Inter, Arial, sans-serif" font-size="27" font-weight="900">Hook history</text>
  <text x="28" y="224" fill="${colors.muted}" font-family="Inter, Arial, sans-serif" font-size="22" font-weight="700">Saved hook checks for this account</text>
  <rect x="0" y="288" width="520" height="104" rx="20" fill="${colors.panel2}" stroke="${colors.border}"/>
  <text x="28" y="336" fill="${colors.text}" font-family="Inter, Arial, sans-serif" font-size="24" font-weight="900">84 • Strong hook</text>
  <text x="28" y="370" fill="${colors.muted}" font-family="Inter, Arial, sans-serif" font-size="20" font-weight="700">Views, Trust • Today</text>
  <rect x="0" y="424" width="520" height="104" rx="20" fill="${colors.panel2}" stroke="${colors.border}"/>
  <text x="28" y="472" fill="${colors.text}" font-family="Inter, Arial, sans-serif" font-size="24" font-weight="900">67 • Promising</text>
  <text x="28" y="506" fill="${colors.muted}" font-family="Inter, Arial, sans-serif" font-size="20" font-weight="700">Education • Yesterday</text>
  <rect x="0" y="574" width="520" height="172" rx="22" fill="${colors.panel}" stroke="${colors.border}"/>
  <text x="28" y="622" fill="${colors.coral}" font-family="Inter, Arial, sans-serif" font-size="25" font-weight="900">Delete account</text>
  <text x="28" y="664" fill="${colors.muted}" font-family="Inter, Arial, sans-serif" font-size="21" font-weight="700">Permanently delete this account and</text>
  <text x="28" y="696" fill="${colors.muted}" font-family="Inter, Arial, sans-serif" font-size="21" font-weight="700">saved HookScore data from Settings.</text>
`;

const phoneScreenshot = async (fileName, headline, subhead, body) => {
  await writeSvgPng(
    fileName,
    1080,
    1920,
    `
    <text x="84" y="148" fill="${colors.text}" font-family="Inter, Arial, sans-serif" font-size="70" font-weight="900">${escapeXml(headline)}</text>
    ${textBlock({ x: 84, y: 220, text: subhead, size: 34, weight: 650, color: colors.muted, maxChars: 34, lineHeight: 46 })}
    ${phoneShell(206, 400, 668, 1360, body)}
  `
  );
};

await fs.mkdir(outputDir, { recursive: true });

await sharp(iconBuffer)
  .resize(512, 512)
  .png({ compressionLevel: 9 })
  .toFile(path.join(outputDir, 'app-icon-512.png'));

await writeSvgPng(
  'feature-graphic-1024x500.png',
  1024,
  500,
  `
  <image href="${iconDataUri}" x="74" y="72" width="112" height="112"/>
  <text x="212" y="126" fill="${colors.text}" font-family="Inter, Arial, sans-serif" font-size="48" font-weight="900">HookScore</text>
  <text x="212" y="174" fill="${colors.accent}" font-family="Inter, Arial, sans-serif" font-size="24" font-weight="900">AI hook scores for creators</text>
  ${textBlock({ x: 74, y: 270, text: 'Score hooks before you edit or post.', size: 42, weight: 900, color: colors.text, maxChars: 22, lineHeight: 52 })}
  <rect x="654" y="82" width="260" height="320" rx="34" fill="${colors.panel}" stroke="${colors.border}"/>
  <text x="690" y="146" fill="${colors.subtle}" font-family="Inter, Arial, sans-serif" font-size="18" font-weight="900">SCORE</text>
  <text x="690" y="245" fill="${colors.accent}" font-family="Inter, Arial, sans-serif" font-size="92" font-weight="900">84</text>
  <text x="690" y="296" fill="${colors.text}" font-family="Inter, Arial, sans-serif" font-size="28" font-weight="900">strong hook</text>
  <rect x="690" y="332" width="188" height="10" rx="5" fill="#263244"/>
  <rect x="690" y="332" width="158" height="10" rx="5" fill="${colors.accent}"/>
  `
);

await phoneScreenshot(
  'phone-01-check-hook-1080x1920.png',
  'Check the hook',
  'Paste the opening, add context, and choose the goal.',
  formPhoneBody
);
await phoneScreenshot(
  'phone-02-score-result-1080x1920.png',
  'Get a score',
  'See what works, what fails, and what to rewrite.',
  resultPhoneBody
);
await phoneScreenshot(
  'phone-03-video-context-1080x1920.png',
  'Add video context',
  'Use opening frames to improve visual-text feedback.',
  videoPhoneBody
);
await phoneScreenshot(
  'phone-04-history-settings-1080x1920.png',
  'Save and manage',
  'Review saved checks and control your account data.',
  historyPhoneBody
);

const tabletBody = (headline, subhead) => `
  <image href="${iconDataUri}" x="86" y="72" width="92" height="92"/>
  <text x="204" y="129" fill="${colors.text}" font-family="Inter, Arial, sans-serif" font-size="52" font-weight="900">HookScore</text>
  ${textBlock({ x: 86, y: 250, text: headline, size: 68, weight: 900, color: colors.text, maxChars: 23, lineHeight: 80 })}
  ${textBlock({ x: 88, y: 420, text: subhead, size: 34, weight: 650, color: colors.muted, maxChars: 34, lineHeight: 48 })}
  <rect x="930" y="102" width="780" height="760" rx="40" fill="${colors.panel}" stroke="${colors.border}"/>
  <text x="982" y="182" fill="${colors.subtle}" font-family="Inter, Arial, sans-serif" font-size="24" font-weight="900">HOOK SCORE</text>
  <text x="982" y="318" fill="${colors.accent}" font-family="Inter, Arial, sans-serif" font-size="126" font-weight="900">84</text>
  <text x="1166" y="298" fill="${colors.text}" font-family="Inter, Arial, sans-serif" font-size="44" font-weight="900">strong hook</text>
  <rect x="982" y="372" width="614" height="16" rx="8" fill="#263244"/>
  <rect x="982" y="372" width="516" height="16" rx="8" fill="${colors.accent}"/>
  ${scoreBar(982, 466, 268, 'Clarity', 86, colors.accent)}
  ${scoreBar(1330, 466, 268, 'Curiosity', 81, colors.sky)}
  ${scoreBar(982, 574, 268, 'Payoff speed', 74, colors.amber)}
  ${scoreBar(1330, 574, 268, 'Audience fit', 88, colors.accent)}
  <rect x="982" y="690" width="614" height="92" rx="22" fill="${colors.bg2}" stroke="${colors.border}"/>
  <text x="1014" y="746" fill="${colors.text}" font-family="Inter, Arial, sans-serif" font-size="30" font-weight="900">Try 3 sharper opening lines</text>
  ${pill(88, 620, 160, 'Views', colors.sky)}
  ${pill(272, 620, 160, 'Trust', colors.accent)}
  ${pill(456, 620, 160, 'Sales', colors.amber)}
`;

await writeSvgPng(
  'tablet-7-inch-01-1920x1080.png',
  1920,
  1080,
  tabletBody(
    'Score short-form hooks before publishing',
    'HookScore turns your opening line and video context into a practical AI diagnosis.'
  )
);

await writeSvgPng(
  'tablet-10-inch-01-1920x1080.png',
  1920,
  1080,
  tabletBody(
    'Find the weak point in the first seconds',
    'Check clarity, payoff speed, curiosity, audience fit, and visual-text match in one view.'
  )
);

console.log(`Generated Play Store assets in ${outputDir}`);
