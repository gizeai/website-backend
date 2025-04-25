import OpenAI, { toFile } from "openai";
import { FileLike } from "openai/uploads";
import * as fs from "fs";

export default class ImageV0 {
  static async generate(
    openai: OpenAI,
    instructions: { description: string; filePath: string }[],
    art_model: string
  ) {
    const files: FileLike[] = [];

    for await (const instruction of instructions) {
      const file = await toFile(fs.createReadStream(instruction.filePath), null, {
        type: "image/png",
      });

      files.push(file);
    }

    const response = await openai.images.edit({
      model: "dall-e-2",
      prompt: `
          Crie uma imagem com o estilo ${art_model}, e siga as instruções abaixo:
    
          ${instructions
            .map(instruction => {
              return `- ${instruction.description}`;
            })
            .join("\n")}
          })
        `,
      image: files[0], //TODO: Para o modelo do gpt-image-1, ele aceita uma array
      // quality: "medium", //TODO: Para o modelo do gpt-image-1, elee aceita a qualidade
    });

    const image_url = response.data?.[0].url;

    return image_url;
  }
}
