import getRandomOpenAIApiKey from "@/utils/getRandomOpenAIApiKey";
import * as fs from "fs";
import OpenAI from "openai";
import { ChatCompletionContentPartImage } from "openai/resources/chat";
import { FileLike, toFile } from "openai/uploads";
import path from "path";

export default class ImgV0 {
  private openai: OpenAI;
  static VERSION = "img-v0";

  constructor() {
    this.openai = new OpenAI({ apiKey: getRandomOpenAIApiKey() });
  }

  async generateDescription(images: string[], description: string, type: string) {
    const imagesOpenAI: ChatCompletionContentPartImage[] = [];

    for await (const image of images) {
      const buffer = fs.readFileSync(image);
      const ext = path.extname(image).slice(1);
      const mimeType = `image/${ext}`;
      const base64 = buffer.toString("base64");
      const url = `data:${mimeType};base64,${base64}`;

      imagesOpenAI.push({
        type: "image_url",
        image_url: {
          url: url,
        },
      });
    }

    const response = await this.openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: [
            {
              text: SYSTEM_GPT.descriptionGenerate,
              type: "text",
            },
          ],
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Tipo do post: ${type} \nDescrição: ${description}`,
            },
            ...imagesOpenAI,
          ],
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "imaginia_description_generate",
          schema: {
            type: "object",
            required: ["description"],
            properties: {
              description: {
                type: "string",
              },
            },
            additionalProperties: false,
          },
          strict: true,
        },
      },
      temperature: 1,
      max_completion_tokens: 2048,
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0,
      store: false,
    });

    const data = JSON.parse(response.choices[0].message.content ?? "");
    return (data as { description: string }).description;
  }

  async generateTags(description: string, type: string) {
    const response = await this.openai.chat.completions.create({
      model: "gpt-4o-search-preview-2025-03-11",
      messages: [
        {
          role: "system",
          content: [
            {
              text: SYSTEM_GPT.tagsGenerate,
              type: "text",
            },
          ],
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Tipo do post: ${type} \nDescrição: ${description}`,
            },
          ],
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "tags_schema",
          schema: {
            type: "object",
            required: ["tags"],
            properties: {
              tags: {
                type: "array",
                items: {
                  type: "string",
                },
              },
            },
            additionalProperties: false,
          },
          strict: true,
        },
      },
      store: false,
    });

    const data = JSON.parse(response.choices[0].message.content ?? "");
    return (data as { tags: string[] }).tags;
  }

  async generateImage(
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

    const response = await this.openai.images.edit({
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

  async generateVideo() {}
}

const SYSTEM_GPT = {
  descriptionGenerate:
    'Você é uma inteligência artificial especializada em marketing digital e criação de conteúdo para redes sociais. Sua tarefa é gerar uma **descrição envolvente e clara** para uma postagem no Instagram, com base nas informações fornecidas pelo usuário. \n\n**Diretrizes:**\n\n1. **Utilize Apenas as Informações Fornecidas:** Baseie-se unicamente nas informações fornecidas pelo usuário. Não adicione detalhes ou suposições que não estejam explicitamente presentes no conteúdo fornecido.\n   \n2. **Criação de Descrição:** Escreva uma descrição que seja clara, envolvente e alinhada com o conteúdo do post. Deve refletir o tom do produto, serviço ou situação mencionada, e se for apropriado, inclua chamadas para ação (CTAs) como "comente abaixo", "curta se gostar" ou "compartilhe com seus amigos". \n\n3. **Sem Hashtags:** A descrição **não deve** conter nenhuma hashtag. Ela deve ser um texto fluido e natural, sem qualquer marcação de hashtag.\n\n**Formato de Saída:**\n\nRetorne a descrição em um campo JSON no seguinte formato:\n\n```json\n{\n  "description": "string"\n}\n```',

  tagsGenerate:
    'Você é uma inteligência artificial especializada em marketing digital e criação de conteúdo para redes sociais. Sua tarefa é gerar **tags estratégicas** para uma postagem no Instagram com base nas informações fornecidas pelo usuário. As tags devem ser criadas de maneira relevante e alinhadas ao nicho ou ao tema do conteúdo.\n\n**Diretrizes:**\n\n1. **Utilize Apenas as Informações Fornecidas:** As tags devem ser geradas com base nas informações fornecidas pelo usuário, sem adições externas. Não adicione tags irrelevantes ou suposições não mencionadas no conteúdo original.\n\n2. **Criação das Tags:** Escolha entre 5 a 15 hashtags relevantes, incluindo o símbolo "#" em todas. As hashtags devem ser específicas e pertinentes ao tema do conteúdo. Evite usar hashtags excessivas ou irrelevantes. Cada hashtag deve ser cuidadosamente escolhida para aumentar o alcance e engajamento.\n\n3. **Formato de Saída:** Retorne as tags em um campo JSON no seguinte formato:\n\n```json\n{\n  "tags": ["#tag1", "#tag2", "#tag3"]\n}\n```',
};
