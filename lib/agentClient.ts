import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const MODEL = "claude-sonnet-4-6";

/**
 * Stream an AI response. Returns a ReadableStream suitable for
 * piping directly to the browser via a Next.js API route Response.
 */
export async function generateStream(
  systemPrompt: string,
  userPrompt: string
): Promise<ReadableStream<Uint8Array>> {
  const stream = anthropic.messages.stream({
    model: MODEL,
    max_tokens: 800,
    system: systemPrompt,
    messages: [{ role: "user", content: userPrompt }],
  });

  const encoder = new TextEncoder();

  return new ReadableStream({
    async start(controller) {
      try {
        for await (const text of stream.text_stream) {
          controller.enqueue(encoder.encode(text));
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
