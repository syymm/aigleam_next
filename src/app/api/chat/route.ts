// src/app/api/chat/route.ts
import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export async function POST(request: Request) {
  try {
    const { message, model } = await request.json();
    
    console.log('后端收到的模型参数:', model);

    const completion = await openai.chat.completions.create({
      model, // 直接使用传入的模型
      messages: [{ role: "user", content: message }],
    });

    const reply = completion.choices[0]?.message?.content || '';

    return NextResponse.json({ 
      reply,
      messageId: Date.now().toString()
    });
  } catch (error) {
    console.error('OpenAI API error:', error);
    return NextResponse.json(
      { error: '处理请求失败' },
      { status: 500 }
    );
  }
}