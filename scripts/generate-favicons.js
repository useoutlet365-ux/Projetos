const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// 1. Master SVG Design for Outlet 365
const masterSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <!-- Background Gradient -->
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#090b16"/>
      <stop offset="50%" stop-color="#060810"/>
      <stop offset="100%" stop-color="#04050a"/>
    </linearGradient>

    <!-- Neon Brand Gradient -->
    <linearGradient id="brandGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#38bdf8"/>
      <stop offset="40%" stop-color="#2563eb"/>
      <stop offset="100%" stop-color="#080ce6"/>
    </linearGradient>

    <!-- Accent Golden/Orange/White Gradient for Energy/Shopping -->
    <linearGradient id="accentGlow" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="100%" stop-color="#93c5fd"/>
    </linearGradient>

    <linearGradient id="borderGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#38bdf8" stop-opacity="0.8"/>
      <stop offset="50%" stop-color="#2563eb" stop-opacity="0.4"/>
      <stop offset="100%" stop-color="#080ce6" stop-opacity="0.9"/>
    </linearGradient>

    <!-- Ambient Glow Filter -->
    <filter id="neonGlow" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="16" result="blur"/>
      <feMerge>
        <feMergeNode in="blur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>

  <!-- Squircle Base -->
  <rect x="16" y="16" width="480" height="480" rx="110" fill="url(#bgGrad)"/>
  <rect x="16" y="16" width="480" height="480" rx="110" fill="none" stroke="url(#borderGrad)" stroke-width="8"/>

  <!-- Inner Soft Radial Light -->
  <circle cx="256" cy="220" r="180" fill="#080ce6" opacity="0.18" filter="url(#neonGlow)"/>

  <!-- Shopping Bag Handle -->
  <path d="M 176 170 C 176 100, 336 100, 336 170" 
        fill="none" 
        stroke="url(#brandGrad)" 
        stroke-width="26" 
        stroke-linecap="round"/>

  <!-- Modern Bag Body with Angled Chamfer Style -->
  <path d="M 120 170 L 392 170 L 372 410 C 370 426, 356 438, 340 438 L 172 438 C 156 438, 142 426, 140 410 Z" 
        fill="#0b0f24" 
        stroke="url(#brandGrad)" 
        stroke-width="18" 
        stroke-linejoin="round"/>

  <!-- Center Dynamic Lightning / Fast Shopping Badge -->
  <path d="M 270 190 L 195 295 L 245 295 L 225 410 L 320 280 L 268 280 Z" 
        fill="url(#accentGlow)"/>

  <!-- Small Stylish "365" Tag Badge on Bag Corner -->
  <g transform="translate(256, 360)">
    <rect x="-62" y="-18" width="124" height="36" rx="18" fill="#080ce6" stroke="#38bdf8" stroke-width="3"/>
    <text x="0" y="8" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Inter', sans-serif" font-weight="900" font-size="22" fill="#ffffff" text-anchor="middle" letter-spacing="2">365</text>
  </g>
</svg>
`;

// 2. Tab/Favicon Optimized SVG (High contrast, thick strokes, crystal clear at 16x16 and 32x32)
const tabFaviconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0a0c1a"/>
      <stop offset="100%" stop-color="#04050a"/>
    </linearGradient>
    <linearGradient id="blueGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#38bdf8"/>
      <stop offset="50%" stop-color="#2563eb"/>
      <stop offset="100%" stop-color="#080ce6"/>
    </linearGradient>
  </defs>

  <!-- Rounded Squircle Base -->
  <rect x="2" y="2" width="60" height="60" rx="15" fill="url(#bg)"/>
  <rect x="2" y="2" width="60" height="60" rx="15" fill="none" stroke="#2563eb" stroke-width="2.5"/>

  <!-- Bag Handle -->
  <path d="M 23 21 C 23 11, 41 11, 41 21" fill="none" stroke="#38bdf8" stroke-width="4.5" stroke-linecap="round"/>

  <!-- Bag Body -->
  <path d="M 14 22 L 50 22 L 47 54 C 47 56, 45 58, 43 58 L 21 58 C 19 58, 17 56, 17 54 Z" fill="#0d1433" stroke="url(#blueGrad)" stroke-width="3.5" stroke-linejoin="round"/>

  <!-- Bold Central Lightning & Energy Accent (ultra sharp at small res) -->
  <path d="M 35 25 L 24 39 L 31 39 L 28 53 L 42 37 L 34 37 Z" fill="#ffffff"/>
</svg>`;

// Helper function to build a valid multi-image ICO binary from PNG buffers
function createIco(pngBuffers) {
  const count = pngBuffers.length;
  let headerSize = 6 + count * 16;
  let offset = headerSize;

  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // Reserved
  header.writeUInt16LE(1, 2); // ICO type (1 = icon)
  header.writeUInt16LE(count, 4); // Number of images

  const entries = [];
  for (let i = 0; i < count; i++) {
    const buf = pngBuffers[i].buffer;
    const size = pngBuffers[i].size;
    const entry = Buffer.alloc(16);
    entry.writeUInt8(size >= 256 ? 0 : size, 0); // Width
    entry.writeUInt8(size >= 256 ? 0 : size, 1); // Height
    entry.writeUInt8(0, 2); // Color palette
    entry.writeUInt8(0, 3); // Reserved
    entry.writeUInt16LE(1, 4); // Color planes
    entry.writeUInt16LE(32, 6); // Bits per pixel
    entry.writeUInt32LE(buf.length, 8); // Image size in bytes
    entry.writeUInt32LE(offset, 12); // Offset of image data
    entries.push(entry);
    offset += buf.length;
  }

  return Buffer.concat([header, ...entries, ...pngBuffers.map(p => p.buffer)]);
}

async function run() {
  const imgDir = path.join(__dirname, '..', 'image');
  const rootDir = path.join(__dirname, '..');

  if (!fs.existsSync(imgDir)) {
    fs.mkdirSync(imgDir, { recursive: true });
  }

  console.log('Writing master icon.svg...');
  fs.writeFileSync(path.join(imgDir, 'icon.svg'), masterSvg);

  // Generate PNGs at different sizes
  console.log('Generating PNGs...');

  const p16 = await sharp(Buffer.from(tabFaviconSvg)).resize(16, 16).png().toBuffer();
  const p32 = await sharp(Buffer.from(tabFaviconSvg)).resize(32, 32).png().toBuffer();
  const p48 = await sharp(Buffer.from(tabFaviconSvg)).resize(48, 48).png().toBuffer();
  const p180 = await sharp(Buffer.from(masterSvg)).resize(180, 180).png().toBuffer();
  const p192 = await sharp(Buffer.from(masterSvg)).resize(192, 192).png().toBuffer();
  const p512 = await sharp(Buffer.from(masterSvg)).resize(512, 512).png().toBuffer();

  // Maskable icon with 15% safe area margin
  const maskableSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
    <rect width="512" height="512" fill="#090b16"/>
    <g transform="translate(64, 64) scale(0.75)">
      ${masterSvg.replace('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">', '').replace('</svg>', '')}
    </g>
  </svg>`;
  const pMaskable = await sharp(Buffer.from(maskableSvg)).resize(512, 512).png().toBuffer();

  // Save files
  fs.writeFileSync(path.join(imgDir, 'favicon-16x16.png'), p16);
  fs.writeFileSync(path.join(imgDir, 'favicon-32x32.png'), p32);
  fs.writeFileSync(path.join(imgDir, 'favicon-48x48.png'), p48);
  fs.writeFileSync(path.join(imgDir, 'apple-touch-icon.png'), p180);
  fs.writeFileSync(path.join(imgDir, 'icon-192.png'), p192);
  fs.writeFileSync(path.join(imgDir, 'icon-512.png'), p512);
  fs.writeFileSync(path.join(imgDir, 'icon-maskable.png'), pMaskable);

  // Generate ICO (16x16, 32x32, 48x48)
  const icoBuffer = createIco([
    { size: 16, buffer: p16 },
    { size: 32, buffer: p32 },
    { size: 48, buffer: p48 }
  ]);

  fs.writeFileSync(path.join(rootDir, 'favicon.ico'), icoBuffer);
  fs.writeFileSync(path.join(imgDir, 'favicon.ico'), icoBuffer);

  console.log('✅ All favicons, PNGs, and ICO generated successfully!');
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
