import OpenAI, { toFile } from "openai";
import * as fs from "fs";

export default class StudioV0 {
  static async generate(
    openai: OpenAI,
    prompt: string,
    fileStream: fs.ReadStream,
    maskStream: fs.ReadStream
  ) {
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
