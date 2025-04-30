import getRandomOpenAIApiKey from "@/utils/getRandomOpenAIApiKey";
import OpenAI from "openai";
import ImageV0 from "./ImageV0";
import LumaAI from "lumaai";
import TagsV0 from "./TagsV0";
import DescriptionV0 from "./DescriptionV0";
import StudioV0 from "./StudioV0";
import getRandomLumaalabsApiKey from "@/utils/getRandomLumaalabsApiKey";
import VideoV0 from "./VideoV0";

export default class ImgV0 {
  private openai: OpenAI;
  private lumeai: LumaAI;
  static VERSION = "img-v0";

  constructor() {
    this.openai = new OpenAI({ apiKey: getRandomOpenAIApiKey() });
    this.lumeai = new LumaAI({ authToken: getRandomLumaalabsApiKey() });
  }

  async generateDescription(images: string[], description: string, type: string) {
    return DescriptionV0.generate(this.openai, images, description, type);
  }

  async generateTags(description: string, type: string) {
    return TagsV0.generate(this.openai, description, type);
  }

  async generateImage(
    instructions: { description: string; filePath?: string }[],
    art_model: string
  ) {
    return ImageV0.generate(this.openai, instructions, art_model);
  }

  async generateVideo(file: string) {
    return VideoV0.generate(this.lumeai, file);
  }

  async studioEdit(prompt: string, fileStream: Blob, maskFs: Blob) {
    return StudioV0.generate(this.openai, prompt, fileStream, maskFs);
  }
}
