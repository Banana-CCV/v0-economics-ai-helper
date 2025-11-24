// app/api/rewrite-sentence/route.ts

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { sentence, question, context, role, marks } = await request.json();

    if (!sentence || !question) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    console.log('🔄 Rewriting sentence...');

    const prompt = `You are an expert Edexcel A-Level Economics examiner helping a student improve their essay.

QUESTION: ${question}
${context ? `CONTEXT: ${context}` : ''}
MARKS: ${marks || 25}

WEAK SENTENCE TO IMPROVE:
"${sentence}"

SENTENCE ROLE: ${role || 'analysis'}

Your task: Rewrite this sentence to score higher marks. The rewrite should:
1. Maintain the core economic concept
2. Add more sophisticated reasoning (if it's analysis)
3. Use more precise economic terminology
4. Be longer and more detailed (aim for 2-3 sentences if needed)
5. Show deeper understanding

Return ONLY a JSON object with this structure:
{
  "rewrittenText": "The improved sentence(s)",
  "improvementType": "analysis|application|evaluation|clarity",
  "explanation": "Brief explanation of why this is better (1-2 sentences)",
  "impactOnMark": "+1|+2|clarity"
}`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-5.1-2025-11-13',
      messages: [
        {
          role: 'system',
          content: 'You are an expert economics teacher helping students improve their writing. Return only valid JSON.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3,
      max_completion_tokens: 500,
    });

    const raw = completion.choices?.[0]?.message?.content;
    
    if (!raw) {
      throw new Error('No response from OpenAI');
    }

    // Parse JSON from response
    let result;
    try {
      result = JSON.parse(raw);
    } catch (e) {
      // Try to extract JSON if wrapped in markdown
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Failed to parse JSON response');
      }
    }

    console.log('✅ Sentence rewritten successfully');

    return NextResponse.json({
      success: true,
      result
    });
    
  } catch (error) {
    console.error('Rewrite API Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}