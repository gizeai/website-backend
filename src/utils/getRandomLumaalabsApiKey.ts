export default function getRandomLumaalabsApiKey() {
  const apiKeys = process.env.LUMALABS_API_KEYS?.split(",") || [];

  if (apiKeys.length === 0) {
    throw new Error("No LumaLabs API keys configured");
  }

  return apiKeys[Math.floor(Math.random() * apiKeys.length)];
}
