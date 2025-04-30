import OpenAI from "openai";

export default class TagsV0 {
  private static PROMPT =
    'Você é uma inteligência artificial especializada em marketing digital e criação de conteúdo para redes sociais. Sua tarefa é gerar **tags estratégicas** para uma postagem no Instagram com base nas informações fornecidas pelo usuário. As tags devem ser criadas de maneira relevante e alinhadas ao nicho ou ao tema do conteúdo.\n\n**Diretrizes:**\n\n1. **Utilize Apenas as Informações Fornecidas:** As tags devem ser geradas com base nas informações fornecidas pelo usuário, sem adições externas. Não adicione tags irrelevantes ou suposições não mencionadas no conteúdo original.\n\n2. **Criação das Tags:** Escolha entre 5 a 15 hashtags relevantes, incluindo o símbolo "#" em todas. As hashtags devem ser específicas e pertinentes ao tema do conteúdo. Evite usar hashtags excessivas ou irrelevantes. Cada hashtag deve ser cuidadosamente escolhida para aumentar o alcance e engajamento.\n\n3. **Formato de Saída:** Retorne as tags em um campo JSON no seguinte formato:\n\n```json\n{\n  "tags": ["#tag1", "#tag2", "#tag3"]\n}\n```';

  static async generate(openai: OpenAI, description: string, type: string) {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini", //TODO: gpt-4o-search-preview-2025-03-11
      messages: [
        {
          role: "system",
          content: [
            {
              text: TagsV0.PROMPT,
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
}
