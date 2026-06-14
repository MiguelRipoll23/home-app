const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const svgPath = path.join(__dirname, '../resources/icon.svg');
const outputDir = path.join(__dirname, '../resources');

async function generateIcons() {
  const svgBuffer = fs.readFileSync(svgPath);
  
  // Generate PNG files
  const sizes = [16, 32, 48, 64, 128, 256];
  
  for (const size of sizes) {
    await sharp(svgBuffer)
      .resize(size, size)
      .png()
      .toFile(path.join(outputDir, `icon${size}.png`));
    
    console.log(`Generated icon${size}.png`);
  }
  
  // Generate main icon.png (256x256)
  await sharp(svgBuffer)
    .resize(256, 256)
    .png()
    .toFile(path.join(outputDir, 'icon.png'));
  
  console.log('Generated icon.png');
  
  // Generate ICO file for Windows
  // Note: sharp doesn't support ICO directly, so we'll create a multi-size ICO
  // For now, we'll just use the PNG files
  console.log('ICO generation requires additional tools');
  console.log('You can use online converters or tools like ImageMagick to create ICO from PNG files');
}

generateIcons().catch(console.error);
