import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

// Placeholder AI marking logic
async function markEssay(content: string, topic: string, questionType: string) {
  // This will be replaced with actual AI marking using Claude/GPT-4
  // For now, returning placeholder scores
  const totalMarks =
    questionType === "Multiple Choice"
      ? 10
      : questionType === "Short Answer"
        ? 15
        : questionType === "Essay Question"
          ? 25
          : 40

  return {
    ao1_score: Math.floor(totalMarks * 0.25),
    ao2_score: Math.floor(totalMarks * 0.25),
    ao3_score: Math.floor(totalMarks * 0.25),
    ao4_score: Math.floor(totalMarks * 0.25),
    total_score: totalMarks,
    grade_prediction: "A",
    overall_feedback: "Placeholder feedback - AI integration coming soon",
  }
}

export async function POST(request: Request) {
  try {
    const { essayId, essayText, topic, questionType } = await request.json()

    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const marking = await markEssay(essayText, topic, questionType)

    const { error } = await supabase.from("essay_feedback").insert({
      essay_id: essayId,
      user_id: user.id,
      ...marking,
    })

    if (error) throw error

    return NextResponse.json({ success: true, marking })
  } catch (error) {
    console.log("[v0] Marking error:", error)
    return NextResponse.json({ error: "Failed to mark essay" }, { status: 500 })
  }
}
