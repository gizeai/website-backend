import getRandomOpenAIApiKey from "@/utils/getRandomOpenAIApiKey";
import OpenAI from "openai";
import ImageV0 from "./ImageV0";
import TagsV0 from "./TagsV0";
import DescriptionV0 from "./DescriptionV0";
import { ReadStream } from "fs";
import StudioV0 from "./StudioV0";

export default class ImgV0 {
  private openai: OpenAI;
  static VERSION = "img-v0";

  constructor() {
    this.openai = new OpenAI({ apiKey: getRandomOpenAIApiKey() });
  }

  async generateDescription(images: string[], description: string, type: string) {
    return DescriptionV0.generate(this.openai, images, description, type);
  }

  async generateTags(description: string, type: string) {
    return TagsV0.generate(this.openai, description, type);
  }

  async generateImage(
    instructions: { description: string; filePath: string }[],
    art_model: string
  ) {
    return ImageV0.generate(this.openai, instructions, art_model);
  }

  async generateVideo() {}

  async studioEdit(prompt: string, fileStream: ReadStream, maskFs: ReadStream) {
    return StudioV0.generate(this.openai, prompt, fileStream, maskFs);
  }
}
