import SYSTEM_GPT from "@/constants/SYSTEM_GPT";
import OpenAI from "openai";

export default async function imgAiGenerateTags(openai: OpenAI, description: string, type: string) {
  const response = await openai.chat.completions.create({
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
  return data as { tags: string[] };
}
