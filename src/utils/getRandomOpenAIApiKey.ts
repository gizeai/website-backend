export default function getRandomOpenAIApiKey() {
  const apiKeys = process.env.OPENAI_API_KEYS?.split(",") || [];
  if (apiKeys.length === 0) {
    throw new Error("No OpenAI API keys configured");
  }
  return apiKeys[Math.floor(Math.random() * apiKeys.length)];
}
