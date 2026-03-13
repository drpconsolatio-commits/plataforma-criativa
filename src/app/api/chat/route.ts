import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from "fs";
import path from "path";

const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY || "");

export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const { messages, system_prompt, agentId } = await req.json();
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || "";
    console.log(`-> [Gemini] POST /api/chat | Agente: ${agentId} | Key exists: ${!!apiKey}`);

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
    let modelName = "gemini-flash-latest"; // default
    let temperature = 0.7;

    if (agentId === 'cpy-1') {
      modelName = "gemini-2.0-flash";
      temperature = 0.8;
    } else if (agentId === 'pln-2') {
      modelName = "gemini-2.5-pro";
      temperature = 0.4;
    }

    const systemInstruction = `${brainKnowledge}\n\n${system_prompt || "Você é um útil Agente Inteligente."}`;

    // Converter mensagens para formato Gemini
    let history = messages.slice(0, -1).map((m: any) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }]
    }));

    // O Gemini exige que a primeira mensagem do histórico seja do 'user'
    while (history.length > 0 && history[0].role === 'model') {
       history.shift();
    }

    const lastMessage = messages[messages.length - 1].content;

    let result;
    try {
      const model = genAI.getGenerativeModel({ 
        model: modelName,
        generationConfig: { temperature },
        systemInstruction: { role: 'system', parts: [{ text: systemInstruction }] }
      });
      const chat = model.startChat({ history: history as any[] });
      result = await chat.sendMessageStream(lastMessage);
    } catch (err: any) {
      console.warn(`-> [Gemini] Erro no modelo principal ${modelName}:`, err.message);
      // Fallback em caso de cota ou modelo não encontrado
      const fallbackModel = genAI.getGenerativeModel({ 
        model: "gemini-flash-latest",
        generationConfig: { temperature: 0.7 },
        systemInstruction: { role: 'system', parts: [{ text: systemInstruction }] }
      });
      const chat = fallbackModel.startChat({ history: history as any[] });
      result = await chat.sendMessageStream(lastMessage);
    }

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of result.stream) {
            const text = chunk.text();
            controller.enqueue(encoder.encode(text));
          }
          controller.close();
        } catch (streamErr: any) {
          controller.error(streamErr);
        }
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
