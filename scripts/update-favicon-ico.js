const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// SVG content matching the icon.svg with amber color (#B45309)
const svgContent = `<svg width="256" height="256" viewBox="0 0 256 256" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="256" height="256" fill="white"/>
  <!-- Outer circle - dotted -->
  <circle cx="128" cy="128" r="109" stroke="#B45309" stroke-width="19" fill="none" stroke-dasharray="19 32" />
  <!-- Middle circle - dotted -->
  <circle cx="128" cy="128" r="70" stroke="#B45309" stroke-width="19" fill="none" stroke-dasharray="19 32" />
  <!-- Inner circle - dotted -->
  <circle cx="128" cy="128" r="32" stroke="#B45309" stroke-width="19" fill="none" stroke-dasharray="19 26" />
  <!-- Center dot - solid -->
  <circle cx="128" cy="128" r="13" fill="#B45309" />
</svg>`;

async function generateFaviconIco() {
  try {
    const svgBuffer = Buffer.from(svgContent);

    console.log('🎨 Generating favicon.ico with amber color (#B45309)...');

    // Generate 16x16 PNG
    const png16 = await sharp(svgBuffer)
      .resize(16, 16)
      .png()
      .toBuffer();

    // Generate 32x32 PNG
    const png32 = await sharp(svgBuffer)
      .resize(32, 32)
      .png()
      .toBuffer();

    console.log('✅ Generated 16x16 and 32x32 PNG buffers');

    // For ICO format, we need to use a different approach
    // Sharp doesn't directly support ICO creation, so we'll use 32x32 PNG
    // and save it with .ico extension (modern browsers support PNG in ICO)
    const icoPath = path.join(__dirname, '../app/favicon.ico');

    // Use 32x32 as the main favicon (better quality for modern displays)
    fs.writeFileSync(icoPath, png32);

    console.log('✅ favicon.ico generated successfully!');
    console.log(`📁 Saved to: ${icoPath}`);
    console.log('🎨 Using amber color (#B45309) matching the logo');
    console.log('\n💡 Note: The favicon now matches app/icon.svg color scheme.');

  } catch (error) {
    console.error('❌ Error generating favicon:', error);
    process.exit(1);
  }
}

generateFaviconIco();
