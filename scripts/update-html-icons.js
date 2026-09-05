const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');
const htmlFiles = fs.readdirSync(rootDir).filter(f => f.endsWith('.html'));

const faviconTags = `  <!-- Favicon & App Icons -->
  <link rel="shortcut icon" href="favicon.ico" type="image/x-icon" />
  <link rel="icon" type="image/x-icon" href="favicon.ico" />
  <link rel="icon" type="image/png" sizes="32x32" href="image/favicon-32x32.png" />
  <link rel="icon" type="image/png" sizes="16x16" href="image/favicon-16x16.png" />
  <link rel="icon" type="image/svg+xml" href="image/icon.svg" />
  <link rel="apple-touch-icon" sizes="180x180" href="image/apple-touch-icon.png" />`;

htmlFiles.forEach(file => {
  const filePath = path.join(rootDir, file);
  let content = fs.readFileSync(filePath, 'utf8');

  // Remove previous icon/apple-touch-icon lines
  content = content.replace(/\s*<!--\s*Favicon.*-->/gi, '');
  content = content.replace(/\s*<link rel="(shortcut icon|icon|apple-touch-icon)"[^>]*>/gi, '');

  // Add standard favicon tags before </head> or before fonts/stylesheets
  if (content.includes('</head>')) {
    // Insert right before </head> or after meta theme-color if present
    if (content.includes('<meta name="theme-color"')) {
      content = content.replace(
        /(<meta name="theme-color"[^>]*>)/i,
        `$1\n${faviconTags}`
      );
    } else {
      content = content.replace('</head>', `${faviconTags}\n</head>`);
    }
  }

  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Updated favicon tags in ${file}`);
});
