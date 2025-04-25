import * as fs from "fs";
import OpenAI, { toFile } from "openai";
import { FileLike } from "openai/uploads";

export default async function imgAiGenerateImage(
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
    image: files[0], //TODO: Para o modelo do gpt-4o, ele aceita uma array
    // quality: "medium", //TODO: Para o modelo do gpt-4o, elee aceita a qualidade
  });

  console.log(response.data);

  const image_url = response.data?.[0].url;

  return image_url;
}
