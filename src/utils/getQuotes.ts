import { Quotes } from "@/types/quotes";
import axios from "axios";
import * as fs from "fs";
import logger from "./logger";

export async function getQuotesFromCache(force: boolean = false) {
  const quotes = await fs.promises.readFile("./__cache__/quotes.json", "utf-8");
  const parsedQuotes = JSON.parse(quotes) as Quotes;

  if ("updateAt" in parsedQuotes) {
    const updateAtMoreThanOneHour = new Date(parsedQuotes.updateAt);
    const now = new Date();
    const diff = now.getTime() - updateAtMoreThanOneHour.getTime();
    const diffInHours = diff / (1000 * 60 * 60);

    if (force) return parsedQuotes;
    if (diffInHours < 6) {
      return parsedQuotes;
    }
  }

  return null;
}

export default async function getQuotes() {
  const quotes = await getQuotesFromCache();
  if (quotes) return quotes;

  try {
    const response = await axios.get("https://open.er-api.com/v6/latest/BRL");

    const data: Quotes = {
      updateAt: new Date().toISOString(),
      ...response.data,
    };

    await fs.promises.writeFile("./__cache__/quotes.json", JSON.stringify(data));
    return data;
  } catch (error) {
    logger.error(error);
    const quotes = await getQuotesFromCache(true);
    return quotes;
  }
}
