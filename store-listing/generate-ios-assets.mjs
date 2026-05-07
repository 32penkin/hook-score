import fs from 'node:fs/promises';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const sharp = require('sharp');

const root = path.resolve(import.meta.dirname, '..');
const outputDir = path.resolve(import.meta.dirname, 'assets-ios');
const sourceDir =
  process.env.HOOKSCORE_IOS_SCREENSHOTS_DIR ??
  path.join(process.env.HOME ?? '/Users/evgeniypenkin', 'Downloads');
const iconPath = path.resolve(root, 'apps/mobile/assets/icon.png');

const source = (fileName) => path.join(sourceDir, fileName);

const colors = {
  green: '#16C878',
  dark: '#0B111A',
  dark2: '#111A27',
  darkBorder: '#2A3548',
  lightBg: '#EFF4FA',
  lightPanel: '#FFFFFF',
  lightBorder: '#D9E2EC',
  muted: '#5B6B7E',
  mutedDark: '#9BA8BA',
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
  let line = '';

  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (next.length > maxChars && line) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  }

  if (line) lines.push(line);
  return lines;
};

const textBlock = ({
  x,
  y,
  text,
  size,
  weight = 800,
  color = colors.dark,
  maxChars = 24,
  lineHeight = Math.round(size * 1.2),
}) =>
  wrap(text, maxChars)
    .map(
      (line, index) =>
        `<text x="${x}" y="${y + index * lineHeight}" fill="${color}" font-family="Inter, Arial, sans-serif" font-size="${size}" font-weight="${weight}">${escapeXml(line)}</text>`
    )
    .join('');

const svgDoc = (width, height, body) => `
<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  ${body}
</svg>`;

const roundedMask = (width, height, radius) =>
  Buffer.from(
    svgDoc(
      width,
      height,
      `<rect width="${width}" height="${height}" rx="${radius}" fill="#fff"/>`
    )
  );

const roundedResize = async (buffer, width, height, radius, fit = 'cover') => {
  const resized = await sharp(buffer)
    .resize(width, height, { fit, position: 'top' })
    .png()
    .toBuffer();

  return sharp(resized)
    .ensureAlpha()
    .composite([{ input: roundedMask(width, height, radius), blend: 'dest-in' }])
    .png()
    .toBuffer();
};

const screenshotBuffer = async (fileName, { dark = false } = {}) => {
  const filePath = source(fileName);
  const meta = await sharp(filePath).metadata();
  const cropBottom = 170;
  const height = meta.height - cropBottom;

  const buffer = await sharp(filePath)
    .extract({ left: 0, top: 0, width: meta.width, height })
    .png()
    .toBuffer();

  return { buffer, meta: { ...meta, height } };
};

const writePngFromSvg = async (fileName, width, height, body) => {
  await sharp(Buffer.from(svgDoc(width, height, body)))
    .png()
    .toFile(path.join(outputDir, fileName));
};

const phoneScreenshot = async ({
  fileName,
  sourceName,
  headline,
  subhead,
  dark = false,
}) => {
  const { buffer, meta } = await screenshotBuffer(sourceName, { dark });
  const screenWidth = 690;
  const screenHeight = Math.round((screenWidth * meta.height) / meta.width);
  const screenX = Math.round((1080 - screenWidth) / 2);
  const screenY = 360;
  const bg = dark ? colors.dark : colors.lightBg;
  const text = dark ? colors.white : colors.dark;
  const muted = dark ? colors.mutedDark : colors.muted;
  const border = dark ? colors.darkBorder : colors.lightBorder;

  const base = Buffer.from(
    svgDoc(
      1080,
      1920,
      `
      <rect width="1080" height="1920" fill="${bg}"/>
      <circle cx="900" cy="210" r="260" fill="${colors.green}" opacity="${dark ? '0.08' : '0.13'}"/>
      ${textBlock({ x: 70, y: 120, text: headline, size: 68, weight: 950, color: text, maxChars: 22, lineHeight: 78 })}
      ${textBlock({ x: 72, y: 228, text: subhead, size: 33, weight: 650, color: muted, maxChars: 33, lineHeight: 43 })}
      <rect x="${screenX - 14}" y="${screenY + 18}" width="${screenWidth + 28}" height="${screenHeight + 28}" rx="58" fill="#000" opacity="${dark ? '0.34' : '0.15'}"/>
      <rect x="${screenX - 10}" y="${screenY - 10}" width="${screenWidth + 20}" height="${screenHeight + 20}" rx="58" fill="${dark ? '#070A10' : colors.lightPanel}" stroke="${border}" stroke-width="3"/>
    `
    )
  );

  const screen = await roundedResize(buffer, screenWidth, screenHeight, 44);
  const frame = Buffer.from(
    svgDoc(
      1080,
      1920,
      `<rect x="${screenX}" y="${screenY}" width="${screenWidth}" height="${screenHeight}" rx="44" fill="none" stroke="${border}" stroke-width="2"/>`
    )
  );

  await sharp(base)
    .composite([
      { input: screen, left: screenX, top: screenY },
      { input: frame, left: 0, top: 0 },
    ])
    .png()
    .toFile(path.join(outputDir, fileName));
};

const featureGraphic = async () => {
  const { buffer, meta } = await screenshotBuffer('IMG_2050.PNG');
  const screenHeight = 430;
  const screenWidth = Math.round((screenHeight * meta.width) / meta.height);
  const screen = await roundedResize(buffer, screenWidth, screenHeight, 30);
  const base = Buffer.from(
    svgDoc(
      1024,
      500,
      `
      <rect width="1024" height="500" fill="${colors.lightBg}"/>
      <circle cx="810" cy="120" r="260" fill="${colors.green}" opacity="0.16"/>
      <text x="70" y="110" fill="${colors.dark}" font-family="Inter, Arial, sans-serif" font-size="54" font-weight="950">HookScore</text>
      <text x="72" y="158" fill="${colors.green}" font-family="Inter, Arial, sans-serif" font-size="24" font-weight="900">AI hook scores for short-form creators</text>
      ${textBlock({ x: 70, y: 255, text: 'Score the first seconds before your video goes out.', size: 44, weight: 950, color: colors.dark, maxChars: 24, lineHeight: 54 })}
      <rect x="724" y="34" width="${screenWidth + 20}" height="${screenHeight + 20}" rx="40" fill="${colors.lightPanel}" stroke="${colors.lightBorder}" stroke-width="3"/>
    `
    )
  );

  await sharp(base)
    .composite([{ input: screen, left: 734, top: 44 }])
    .png()
    .toFile(path.join(outputDir, 'feature-graphic-1024x500.png'));
};

const tabletScreenshot = async ({
  fileName,
  headline,
  subhead,
  sources,
  dark = false,
}) => {
  const bg = dark ? colors.dark : colors.lightBg;
  const text = dark ? colors.white : colors.dark;
  const muted = dark ? colors.mutedDark : colors.muted;
  const border = dark ? colors.darkBorder : colors.lightBorder;

  const base = Buffer.from(
    svgDoc(
      1920,
      1080,
      `
      <rect width="1920" height="1080" fill="${bg}"/>
      <circle cx="1530" cy="180" r="420" fill="${colors.green}" opacity="${dark ? '0.08' : '0.14'}"/>
      <text x="86" y="132" fill="${colors.green}" font-family="Inter, Arial, sans-serif" font-size="34" font-weight="900">HookScore</text>
      ${textBlock({ x: 84, y: 246, text: headline, size: 76, weight: 950, color: text, maxChars: 22, lineHeight: 86 })}
      ${textBlock({ x: 88, y: 438, text: subhead, size: 34, weight: 650, color: muted, maxChars: 36, lineHeight: 48 })}
      <rect x="84" y="770" width="176" height="54" rx="27" fill="${colors.green}" opacity="0.16" stroke="${colors.green}" stroke-width="2"/>
      <text x="172" y="806" fill="${colors.green}" font-family="Inter, Arial, sans-serif" font-size="24" font-weight="900" text-anchor="middle">Views</text>
      <rect x="286" y="770" width="176" height="54" rx="27" fill="${colors.green}" opacity="0.16" stroke="${colors.green}" stroke-width="2"/>
      <text x="374" y="806" fill="${colors.green}" font-family="Inter, Arial, sans-serif" font-size="24" font-weight="900" text-anchor="middle">Sales</text>
      <rect x="488" y="770" width="210" height="54" rx="27" fill="${colors.green}" opacity="0.16" stroke="${colors.green}" stroke-width="2"/>
      <text x="593" y="806" fill="${colors.green}" font-family="Inter, Arial, sans-serif" font-size="24" font-weight="900" text-anchor="middle">Education</text>
    `
    )
  );

  const panels = [];
  const panelHeight = 884;
  const panelGap = 34;
  const startX = sources.length === 2 ? 1014 : 846;

  for (let index = 0; index < sources.length; index += 1) {
    const { buffer, meta } = await screenshotBuffer(sources[index].name, {
      dark: sources[index].dark,
    });
    const panelWidth = Math.round((panelHeight * meta.width) / meta.height);
    const left = startX + index * (panelWidth + panelGap);
    const top = 98;
    const panel = await roundedResize(buffer, panelWidth, panelHeight, 34);
    const shadow = Buffer.from(
      svgDoc(
        1920,
        1080,
        `<rect x="${left - 10}" y="${top + 14}" width="${panelWidth + 20}" height="${panelHeight + 20}" rx="44" fill="#000" opacity="${dark ? '0.35' : '0.14'}"/>
         <rect x="${left - 8}" y="${top - 8}" width="${panelWidth + 16}" height="${panelHeight + 16}" rx="44" fill="${dark ? '#070A10' : colors.lightPanel}" stroke="${border}" stroke-width="3"/>`
      )
    );

    panels.push({ input: shadow, left: 0, top: 0 });
    panels.push({ input: panel, left, top });
  }

  await sharp(base)
    .composite(panels)
    .png()
    .toFile(path.join(outputDir, fileName));
};

await fs.mkdir(outputDir, { recursive: true });

const iconBuffer = await fs.readFile(iconPath);
await sharp(iconBuffer)
  .resize(512, 512)
  .png({ compressionLevel: 9 })
  .toFile(path.join(outputDir, 'app-icon-512.png'));

await featureGraphic();

await phoneScreenshot({
  fileName: 'phone-01-first-seconds-lab-1080x1920.png',
  sourceName: 'IMG_2052.PNG',
  headline: 'Choose 3-5 seconds',
  subhead: 'Upload a video and pick the opening window to analyze.',
});

await phoneScreenshot({
  fileName: 'phone-02-analysis-context-1080x1920.png',
  sourceName: 'IMG_2053.PNG',
  headline: 'Add real context',
  subhead: 'Include hook text, idea, audience, goals, and video source.',
});

await phoneScreenshot({
  fileName: 'phone-03-score-result-1080x1920.png',
  sourceName: 'IMG_2050.PNG',
  headline: 'Get a hook score',
  subhead: 'Review clarity, pace, goal fit, and rewrite direction.',
});

await phoneScreenshot({
  fileName: 'phone-04-observations-1080x1920.png',
  sourceName: 'IMG_2051.PNG',
  headline: 'Find weak points',
  subhead: 'Read observations about the opening frames and message.',
});

await phoneScreenshot({
  fileName: 'phone-05-create-workspace-1080x1920.png',
  sourceName: 'IMG_2049.PNG',
  headline: 'Create a workspace',
  subhead: 'Register with email and start saving your hook checks.',
});

await phoneScreenshot({
  fileName: 'phone-06-history-dark-1080x1920.png',
  sourceName: 'IMG_2056.PNG',
  headline: 'Save analysis history',
  subhead: 'Return to past checks and compare rewrite ideas.',
  dark: true,
});

await tabletScreenshot({
  fileName: 'tablet-7-inch-01-1920x1080.png',
  headline: 'From video context to hook score',
  subhead: 'HookScore connects the opening window, viewer, goals, and AI readout in one workflow.',
  sources: [
    { name: 'IMG_2052.PNG' },
    { name: 'IMG_2050.PNG' },
  ],
});

await tabletScreenshot({
  fileName: 'tablet-10-inch-01-1920x1080.png',
  headline: 'Review saved results anytime',
  subhead: 'History keeps previous checks visible so creators can compare hooks and rewrites.',
  sources: [
    { name: 'IMG_2056.PNG', dark: true },
    { name: 'IMG_2050.PNG' },
  ],
  dark: true,
});

console.log(`Generated iOS-source Play Store assets in ${outputDir}`);
