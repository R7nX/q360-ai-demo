/**
 * AI client — wraps Google Gemini (free tier).
 *
 * All AI calls go through generateText() so the API key stays server-side
 * and every consumer gets consistent error handling.
 */

import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

const DEFAULT_MODEL = "gemini-2.0-flash";

export interface GenerateTextOptions {
  model?: string;
  systemInstruction?: string;
  maxTokens?: number;
  temperature?: number;
}

export interface GenerateTextResult {
  text: string;
  model: string;
}

export async function generateText(
  prompt: string,
  options?: GenerateTextOptions,
): Promise<GenerateTextResult> {
  const modelName = options?.model ?? DEFAULT_MODEL;

  const model = genAI.getGenerativeModel({
    model: modelName,
    systemInstruction: options?.systemInstruction,
    generationConfig: {
      maxOutputTokens: options?.maxTokens ?? 2048,
      temperature: options?.temperature ?? 0.7,
    },
  });

  const result = await model.generateContent(prompt);
  const text = result.response.text();

  return { text, model: modelName };
}
