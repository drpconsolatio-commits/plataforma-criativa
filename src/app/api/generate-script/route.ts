import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { systemPrompt } from '../../../lib/ai/systemPrompt';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, hookType, marketingAngle, format, ctaType, notes, materialBase } = body;

    const userPrompt = `
Por favor, gere um roteiro com os seguintes parâmetros do Kanban:
- Nome do Criativo/Produto: ${name || 'Não especificado'}
- Tipo de Hook: ${hookType || 'Não especificado'}
- Ângulo de Marketing: ${marketingAngle || 'Não especificado'}
- Formato: ${format || 'Não especificado'}
- Tipo de CTA: ${ctaType || 'Não especificado'}
- Notas Adicionais: ${notes || 'Nenhuma'}

MATERIAL BASE DE REFERÊNCIA (Considere e adapte este conteúdo para o roteiro caso exista):
${materialBase || 'Nenhum material base fornecido.'}
`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.7,
    });

    const script = response.choices[0]?.message?.content || '';

    return NextResponse.json({ script });
  } catch (error: any) {
    console.error('Error generating script:', error);
    return NextResponse.json({ error: error.message || 'Erro ao gerar roteiro' }, { status: 500 });
  }
}
