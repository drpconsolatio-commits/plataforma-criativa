import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY || "");

export const maxDuration = 60;

const responseSchema = {
  type: SchemaType.OBJECT as any,
  properties: {
    resumo_textual: { type: SchemaType.STRING },
    insights_estruturados: {
      type: SchemaType.OBJECT,
      properties: {
        hook: {
          type: SchemaType.OBJECT,
          properties: {
            analise: { type: SchemaType.STRING },
            veredito: { type: SchemaType.STRING }
          },
          required: ["analise", "veredito"]
        },
        retencao: {
          type: SchemaType.OBJECT,
          properties: {
            analise: { type: SchemaType.STRING },
            veredito: { type: SchemaType.STRING }
          },
          required: ["analise", "veredito"]
        },
        cta: {
          type: SchemaType.OBJECT,
          properties: {
            analise: { type: SchemaType.STRING },
            veredito: { type: SchemaType.STRING }
          },
          required: ["analise", "veredito"]
        }
      },
      required: ["hook", "retencao", "cta"]
    },
    top_criativos: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          nome: { type: SchemaType.STRING },
          classificacao: { type: SchemaType.STRING, enum: ["Elite", "Bom", "Ruim"] },
          metrica_destaque: { type: SchemaType.STRING },
          insight: { type: SchemaType.STRING }
        }
      }
    },
    performance_metrics: {
      type: SchemaType.OBJECT,
      properties: {
        tsr_avg: { type: SchemaType.NUMBER },
        retencao_avg: { type: SchemaType.NUMBER },
        impacto_avg: { type: SchemaType.NUMBER }
      }
    }
  },
  required: ["resumo_textual", "insights_estruturados", "top_criativos", "performance_metrics"],
};

export async function POST(req: Request) {
  try {
    const { spreadsheetData } = await req.json();
    if (!spreadsheetData || !Array.isArray(spreadsheetData)) return new Response(JSON.stringify({ error: "Dados inválidos." }), { status: 400 });

    const total = spreadsheetData.length;
    const tsr_avg = spreadsheetData.reduce((acc, r) => acc + (Number(r['TSR']) || 0), 0) / total;
    const retencao_avg = spreadsheetData.reduce((acc, r) => acc + (Number(r['Retenção']) || 0), 0) / total;
    const impacto_avg = spreadsheetData.reduce((acc, r) => acc + (Number(r['Impacto']) || 0), 0) / total;

    // Regex Flexível: VIDXXX agora é o identificador mestre
    const vidRegex = /VID\d+/i;
    const vidToOriginal = new Map<string, string>();
    spreadsheetData.forEach((row: any) => {
      const match = String(row['Criativo'] || "").match(vidRegex);
      if (match) vidToOriginal.set(match[0].toUpperCase(), row['Criativo']);
    });

    const vids = Array.from(vidToOriginal.keys());
    const { data: dbCreatives } = await supabase
      .from('creatives')
      .select('name, hook_type, marketing_angle, format, cta_type')
      .in('name', vids);

    const dbMap = new Map();
    dbCreatives?.forEach(cr => dbMap.set(cr.name.toUpperCase(), cr));

    const enrichedData = spreadsheetData.map((row: any) => {
      const match = String(row['Criativo'] || "").match(vidRegex);
      const vid = match ? match[0].toUpperCase() : null;
      const dbInfo = vid ? dbMap.get(vid) : null;

      return {
        ...row,
        tags_banco: dbInfo ? {
          hook: dbInfo.hook_type,
          angulo: dbInfo.marketing_angle,
          formato: dbInfo.format,
          cta: dbInfo.cta_type
        } : null
      };
    });

    const systemPrompt = `Você é um Analista Estratégico. Analise o funil de performance (Hook, Meio, CTA). No insight de Retenção, cite Ângulo e Formato. No CTA, analise o impacto no CTR.`;
    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest", generationConfig: { responseMimeType: "application/json", responseSchema } });

    const aiInput = enrichedData.map(d => ({
      n: d['Criativo'],
      m: { TSR: d['TSR'], Ret: d['Retenção'], Imp: d['Impacto'], R: d['ROAS'] },
      t: d.tags_banco
    }));

    const result = await model.generateContent([{ text: systemPrompt }, { text: JSON.stringify(aiInput) }]);
    const parsed = JSON.parse(result.response.text());
    parsed.performance_metrics = { tsr_avg, retencao_avg, impacto_avg };

    return new Response(JSON.stringify({ analysis: parsed, enrichedData }), { status: 200 });

  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
