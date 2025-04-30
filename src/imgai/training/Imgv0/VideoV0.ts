import LumaAI from "lumaai";

export default class VideoV0 {
  static async generate(lumaai: LumaAI, imageurl: string) {
    const generation = await lumaai.generations.create({
      prompt: "Continue this image with an interesting video.",
      model: "ray-2",
      keyframes: {
        frame0: {
          type: "image",
          url: imageurl,
        },
      },
    });

    return generation.assets?.video;
  }
}
