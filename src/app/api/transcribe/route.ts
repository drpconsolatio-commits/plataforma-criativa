import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'Nenhum arquivo de áudio recebido' }, { status: 400 });
    }

    const response = await openai.audio.transcriptions.create({
      file,
      model: 'whisper-1',
      language: 'pt',
    });

    return NextResponse.json({ text: response.text });
  } catch (error: any) {
    console.error('Erro na transcrição de áudio:', error);
    return NextResponse.json({ error: error.message || 'Erro ao processar áudio' }, { status: 500 });
  }
}
