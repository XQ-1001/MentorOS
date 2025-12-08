const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// SVG content matching the concentric circles logo
const svgContent = `<svg width="256" height="256" viewBox="0 0 256 256" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="256" height="256" fill="white"/>
  <circle cx="128" cy="128" r="109" stroke="#B45309" stroke-width="19" fill="none" stroke-dasharray="19 32" />
  <circle cx="128" cy="128" r="70" stroke="#B45309" stroke-width="19" fill="none" stroke-dasharray="19 32" />
  <circle cx="128" cy="128" r="32" stroke="#B45309" stroke-width="19" fill="none" stroke-dasharray="19 26" />
  <circle cx="128" cy="128" r="13" fill="#B45309" />
</svg>`;

async function generateFavicon() {
  try {
    const svgBuffer = Buffer.from(svgContent);

    // Generate multiple sizes for .ico format
    const sizes = [16, 32, 48];
    const buffers = [];

    for (const size of sizes) {
      const buffer = await sharp(svgBuffer)
        .resize(size, size)
        .png()
        .toBuffer();
      buffers.push(buffer);

      console.log(`Generated ${size}x${size} icon`);
    }

    // For now, just use the 32x32 as the main favicon
    // (Full .ico creation requires additional dependencies)
    const favicon32 = await sharp(svgBuffer)
      .resize(32, 32)
      .toFormat('png')
      .toBuffer();

    // Save as PNG (modern browsers support this)
    fs.writeFileSync(
      path.join(__dirname, '../public/favicon-32x32.png'),
      favicon32
    );

    console.log('✅ Favicon generated successfully!');
    console.log('📁 Saved to: public/favicon-32x32.png');
    console.log('\n💡 Note: Next.js App Router will automatically use app/icon.svg for the favicon.');
    console.log('   The SVG version provides better quality and theme support.');

  } catch (error) {
    console.error('Error generating favicon:', error);
    process.exit(1);
  }
}

generateFavicon();
