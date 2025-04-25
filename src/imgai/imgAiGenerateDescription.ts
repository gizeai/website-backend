import SYSTEM_GPT from "@/constants/SYSTEM_GPT";
import * as fs from "fs";
import OpenAI from "openai";
import { ChatCompletionContentPartImage } from "openai/resources/chat";
import path from "path";

export default async function imgAiGenerateDescription(
  openai: OpenAI,
  images: string[],
  description: string,
  type: string
) {
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
  return data as { description: string };
}
