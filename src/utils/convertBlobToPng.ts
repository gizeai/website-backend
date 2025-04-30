import sharp from "sharp";

export async function convertBlobToPng(inputBlob: Blob): Promise<Blob> {
  const inputBuffer = Buffer.from(await inputBlob.arrayBuffer());
  const outputBuffer = await sharp(inputBuffer).png().toBuffer();
  return new Blob([outputBuffer], { type: "image/png" });
}
