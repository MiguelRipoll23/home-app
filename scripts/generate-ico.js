const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const svgPath = path.join(__dirname, '../resources/icon.svg');
const outputDir = path.join(__dirname, '../resources');

async function generateIco() {
  const svgBuffer = fs.readFileSync(svgPath);
  
  // ICO file format:
  // - ICONDIR (6 bytes)
  // - ICONDIRENTRY (16 bytes per image)
  // - Image data (PNG or BMP)
  
  const sizes = [16, 32, 48, 64, 128, 256];
  const images = [];
  
  // Generate PNG images for each size
  for (const size of sizes) {
    const pngBuffer = await sharp(svgBuffer)
      .resize(size, size)
      .png()
      .toBuffer();
    
    images.push({
      size,
      data: pngBuffer
    });
  }
  
  // Calculate ICO file size
  const headerSize = 6; // ICONDIR
  const entrySize = 16; // ICONDIRENTRY per image
  const entriesSize = images.length * entrySize;
  
  let totalDataSize = 0;
  for (const img of images) {
    totalDataSize += img.data.length;
  }
  
  const totalSize = headerSize + entriesSize + totalDataSize;
  
  // Create ICO buffer
  const icoBuffer = Buffer.alloc(totalSize);
  let offset = 0;
  
  // Write ICONDIR
  icoBuffer.writeUInt16LE(0, offset); // Reserved
  offset += 2;
  icoBuffer.writeUInt16LE(1, offset); // Type (1 = ICO)
  offset += 2;
  icoBuffer.writeUInt16LE(images.length, offset); // Number of images
  offset += 2;
  
  // Write ICONDIRENTRY for each image
  let dataOffset = headerSize + entriesSize;
  
  for (const img of images) {
    icoBuffer.writeUInt8(img.size === 256 ? 0 : img.size, offset); // Width (0 = 256)
    offset += 1;
    icoBuffer.writeUInt8(img.size === 256 ? 0 : img.size, offset); // Height (0 = 256)
    offset += 1;
    icoBuffer.writeUInt8(0, offset); // Color palette
    offset += 1;
    icoBuffer.writeUInt8(0, offset); // Reserved
    offset += 1;
    icoBuffer.writeUInt16LE(1, offset); // Color planes
    offset += 2;
    icoBuffer.writeUInt16LE(32, offset); // Bits per pixel
    offset += 2;
    icoBuffer.writeUInt32LE(img.data.length, offset); // Size of image data
    offset += 4;
    icoBuffer.writeUInt32LE(dataOffset, offset); // Offset to image data
    offset += 4;
    
    // Copy image data
    img.data.copy(icoBuffer, dataOffset);
    dataOffset += img.data.length;
  }
  
  // Write ICO file
  fs.writeFileSync(path.join(outputDir, 'icon.ico'), icoBuffer);
  console.log('Generated icon.ico');
}

generateIco().catch(console.error);
