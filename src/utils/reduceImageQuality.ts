import sharp from "sharp";

export default async function reduceImageQuality(buffer: Buffer, mb = 1) {
  const maxSize = mb * 1024 * 1024;
  let currentQuality = 90;
  let imageSize: number;

  let outputBuffer = buffer;
  imageSize = outputBuffer.length;

  while (imageSize > maxSize && currentQuality > 10) {
    outputBuffer = await sharp(buffer).png({ quality: currentQuality }).toBuffer();
    imageSize = outputBuffer.length;
    currentQuality -= 10;
  }

  if (imageSize <= maxSize) {
    console.log(`Imagem reduzida para ${imageSize / 1024} KB.`);
  } else {
    console.log("Não foi possível reduzir a imagem para 1MB.");
  }

  return outputBuffer;
}
