import OpenAI, { toFile } from "openai";
import { FileLike } from "openai/uploads";
import UploadService from "@/services/UploadService";
import path from "path";

export default class ImageV0 {
  static async generate(
    openai: OpenAI,
    instructions: { description: string; filePath?: string }[],
    art_model: string
  ) {
    const files: FileLike[] = [];

    console.log("Instruções: ", JSON.stringify(instructions));

    for await (const instruction of instructions) {
      if (instruction.filePath && (instruction.filePath?.length ?? 0) > 0) {
        const blob = await UploadService.download(instruction.filePath, "external-uploads");

        if (blob.data?.file === null || blob.data?.file === undefined) {
          throw new Error("Image not found");
        }

        const file = await toFile(blob.data.file, path.basename(instruction.filePath), {
          type: "image/png",
        });

        files.push(file);
      }
    }

    const shortPrompt = `Gere uma imagem no modelo ${art_model} para uma postagem em uma rede social, você deve serguir a risca todas essas instruções para táis arquivos enviados junto: ${instructions
      .map(
        instruction =>
          `- (file: ${instruction.filePath ? path.basename(instruction.filePath) : "Sem arquivo"}) ${instruction.description}`
      )
      .join("\n")}`;

    // APARENTEMENTE PARA O DALL-E-2 AS IMAGENS EM "images" DEVEM SER UM QUADRADO 1024X1024 POR EXEMPLO
    //TODO: Refatore isso tudo, lembre de recriar essa função abaixo por inteira para anexar as imagens, qualidade etc etc etc

    const response = await openai.images.generate({
      model: "dall-e-2",
      prompt: shortPrompt,
      n: 1,
      size: "1024x1024",
      // image: files[0], //TODO: Para o modelo do gpt-image-1, ele aceita uma array
      // quality: "medium", //TODO: Para o modelo do gpt-image-1, elee aceita a qualidade
    });

    const image_url = response.data?.[0].url;

    return image_url;
  }
}
