import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from "fs";
import path from "path";

const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY || "");

export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const { messages, system_prompt, agentId } = await req.json();
    console.log(`-> [Gemini] POST /api/chat recebido para agente: ${agentId}`);

    // Ler Brain Knowledge se existir
    let brainKnowledge = "";
    try {
      const brainPath = path.join(process.cwd(), "src/agents/knowledge/brain.md");
      if (fs.existsSync(brainPath)) {
        brainKnowledge = fs.readFileSync(brainPath, "utf-8");
      }
    } catch (e) {
      console.error("Erro ao ler brain.md:", e);
    }

    // Configuração por Agente (Roteamento)
    // Roteirista (cpy-1) -> gemini-2.0-flash, temp 0.8
    // Planejador (pln-2) -> gemini-1.5-pro, temp 0.4
    let modelName = "gemini-1.5-flash"; // default
    let temperature = 0.7;

    if (agentId === 'cpy-1') {
      modelName = "gemini-2.0-flash";
      temperature = 0.8;
    } else if (agentId === 'pln-2') {
      modelName = "gemini-1.5-pro";
      temperature = 0.4;
    }

    const systemInstruction = `${brainKnowledge}\n\n${system_prompt || "Você é um útil Agente Inteligente."}`;

    const model = genAI.getGenerativeModel({ 
      model: modelName,
      generationConfig: { temperature },
      systemInstruction: { role: 'system', parts: [{ text: systemInstruction }] }
    });

    // Converter mensagens para formato Gemini
    const history = messages.slice(0, -1).map((m: any) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }]
    }));
    const lastMessage = messages[messages.length - 1].content;

    const chat = model.startChat({
      history,
    });

    const result = await chat.sendMessageStream(lastMessage);

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        for await (const chunk of result.stream) {
          const text = chunk.text();
          controller.enqueue(encoder.encode(text));
        }
        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
      },
    });
  } catch (err: any) {
    console.error("Gemini Chat Error => ", err.message);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
