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

    const prompt = `
          Você é uma inteligência artificial especializada em marketing digital e criação de conteúdo para redes sociais. Sua tarefa é gerar uma **imagem** para uma postagem no Instagram, com base nas instruções fornecidas pelo usuário.

          Gere uma imagem profissional e incrível com base nas instruções, faça algo que chame a atenção para os seguidores.

          O estilo da imagem é ${art_model}, siga as instruções abaixo:
    
          ${instructions
            .map(instruction => {
              return `- ${instruction.description}`;
            })
            .join("\n")}
        `;

    console.log(prompt);

    const response = await openai.images.edit({
      model: "dall-e-2",
      prompt: prompt,
      image: files[0], //TODO: Para o modelo do gpt-image-1, ele aceita uma array
      // quality: "medium", //TODO: Para o modelo do gpt-image-1, elee aceita a qualidade
    });

    const image_url = response.data?.[0].url;

    return image_url;
  }
}
