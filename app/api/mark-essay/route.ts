import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { markEssay } from '@/lib/openai';

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

    // Get request body
    const { question, marks, essay, extractText, essayId } = await request.json();

    // Validate inputs
    if (!question || !marks || !essay) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    console.log('Starting essay marking...');
    console.log('Question:', question.substring(0, 50) + '...');
    console.log('Essay length:', essay.length, 'characters');

    // Call OpenAI to mark the essay
    const result = await markEssay(question, Number(marks), essay, extractText);

    console.log('Marking complete. Score:', result.overallMark, '/', result.totalMarks);

    // Save result to database
    const { data: feedback, error: feedbackError } = await supabase
      .from('essay_feedback')
      .insert({
        essay_id: essayId,
        user_id: user.id,
        ao1_score: result.aoBreakdown.knowledge.score,
        ao2_score: result.aoBreakdown.application.score,
        ao3_score: result.aoBreakdown.analysis.score,
        ao4_score: result.aoBreakdown.evaluation.score,
        total_score: result.overallMark,
        grade_prediction: result.gradeEstimate,
        overall_feedback: JSON.stringify(result),
      })
      .select()
      .single();

    if (feedbackError) {
      console.error('Database error:', feedbackError);
      return NextResponse.json(
        { error: 'Failed to save feedback to database' },
        { status: 500 }
      );
    }

    console.log('Feedback saved to database successfully');

    return NextResponse.json({
      success: true,
      result,
      feedbackId: feedback.id,
    });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}