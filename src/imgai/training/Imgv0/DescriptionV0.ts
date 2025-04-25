import OpenAI from "openai";
import * as fs from "fs";
import { ChatCompletionContentPartImage } from "openai/resources/chat";
import path from "path";

export default class DescriptionV0 {
  private static PROMPT =
    'Você é uma inteligência artificial especializada em marketing digital e criação de conteúdo para redes sociais. Sua tarefa é gerar uma **descrição envolvente e clara** para uma postagem no Instagram, com base nas informações fornecidas pelo usuário. \n\n**Diretrizes:**\n\n1. **Utilize Apenas as Informações Fornecidas:** Baseie-se unicamente nas informações fornecidas pelo usuário. Não adicione detalhes ou suposições que não estejam explicitamente presentes no conteúdo fornecido.\n   \n2. **Criação de Descrição:** Escreva uma descrição que seja clara, envolvente e alinhada com o conteúdo do post. Deve refletir o tom do produto, serviço ou situação mencionada, e se for apropriado, inclua chamadas para ação (CTAs) como "comente abaixo", "curta se gostar" ou "compartilhe com seus amigos". \n\n3. **Sem Hashtags:** A descrição **não deve** conter nenhuma hashtag. Ela deve ser um texto fluido e natural, sem qualquer marcação de hashtag.\n\n**Formato de Saída:**\n\nRetorne a descrição em um campo JSON no seguinte formato:\n\n```json\n{\n  "description": "string"\n}\n```';

  static async generate(openai: OpenAI, images: string[], description: string, type: string) {
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

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: [
            {
              text: DescriptionV0.PROMPT,
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
}
