import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

const MODEL = "gemini-2.5-flash";

/**
 * Generate a non-streaming AI response. Returns the full text string.
 * Use this for JSON-output tasks where the response must be complete before parsing.
 */
export async function generateJSON(
  systemPrompt: string,
  userPrompt: string,
  maxOutputTokens = 3000
): Promise<string> {
  const response = await ai.models.generateContent({
    model: MODEL,
    contents: [{ role: "user", parts: [{ text: userPrompt }] }],
    config: { systemInstruction: systemPrompt, maxOutputTokens },
  });
  return response.text ?? "";
}

/**
 * Stream an AI response. Returns a ReadableStream suitable for
 * piping directly to the browser via a Next.js API route Response.
 */
export async function generateStream(
  systemPrompt: string,
  userPrompt: string
): Promise<ReadableStream<Uint8Array>> {
  const response = await ai.models.generateContentStream({
    model: MODEL,
    contents: [{ role: "user", parts: [{ text: userPrompt }] }],
    config: { systemInstruction: systemPrompt },
  });

  const encoder = new TextEncoder();

  return new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of response) {
          const text = chunk.text;
          if (text) controller.enqueue(encoder.encode(text));
        }
        controller.close();
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Unknown error";
        controller.enqueue(
          encoder.encode(`\n\n[ERROR: Generation interrupted — ${message}]`)
        );
        controller.close();
      }
    },
  });
}
