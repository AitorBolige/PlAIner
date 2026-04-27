import OpenAI from "openai";

let cached: OpenAI | null = null;

export function getOpenAIClient() {
  if (cached) return cached;
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "Missing credentials. Please set the OPENAI_API_KEY environment variable."
    );
  }
  cached = new OpenAI({ apiKey });
  return cached;
}

