import { openai } from "@ai-sdk/openai";
import { streamText } from "ai";

export const maxDuration = 30; // 30 sec limit in Vercel hobby

export async function POST(req: Request) {
  try {
    const { messages, system_prompt } = await req.json();
    console.log("-> [Backend] POST /api/chat recebido com: ", messages?.length, " mensagens");

    // Use a default system prompt if none provided, or inject the custom persona
    const baseSystem = system_prompt || "Você é um útil Agente Inteligente, prestativo e polido.";

    const result = streamText({
      model: openai("gpt-4o-mini"),
      system: baseSystem,
      messages,
      temperature: 0.7,
    });

    // Return the raw text stream (No Vercel SDK data stream protocol prefixing)
    return new Response(result.textStream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (err: any) {
    console.error("OpenAI Chat Error => ", err.message);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
