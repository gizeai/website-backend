import OpenAI, { toFile } from "openai";

export default class StudioV0 {
  static async generate(openai: OpenAI, prompt: string, fileStream: Blob, maskStream: Blob) {
    const file = await toFile(fileStream, null, {
      type: "image/png",
    });

    const mask = await toFile(maskStream, null, {
      type: "image/png",
    });

    const response = await openai.images.edit({
      model: "dall-e-2",
      image: file,
      mask: mask,
      prompt: prompt,
    });

    const image_url = response.data?.[0].url;
    return image_url;
  }
}
