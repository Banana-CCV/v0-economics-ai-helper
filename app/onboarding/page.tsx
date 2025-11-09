"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ChevronRight, TrendingUp } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState<"examBoard" | "topic" | "question">("examBoard")
  const [selectedTopic, setSelectedTopic] = useState("")
  const [selectedQuestion, setSelectedQuestion] = useState("")
  const [loading, setLoading] = useState(false)

  const handleContinueToTopic = () => {
    setStep("topic")
  }

  const handleContinueToQuestion = (topic: string) => {
    setSelectedTopic(topic)
    setStep("question")
  }

  const handleCompleteonboarding = async (questionType: string) => {
    try {
      setLoading(true)
      const supabase = createClient()

      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push("/auth/login")
        return
      }

      // Save user preferences to profiles table
      const { error } = await supabase
        .from("user_preferences")
        .upsert(
          {
            id: user.id,
            exam_board: "edexcel_a",
            topic: selectedTopic,
            question_type: questionType,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "id" },
        )
        .select()

      if (error) throw error

      router.push("/dashboard")
    } catch (error) {
      console.log("[v0] Onboarding error:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen gradient-mesh-bg">
      {/* Header */}
      <div className="border-b border-teal-light/20 backdrop-blur-md bg-white/30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-teal-accent rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg">EconAI</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="max-w-2xl">
          {/* Progress indicator */}
          <div className="mb-12">
            <div className="flex gap-2 mb-6">
              {["examBoard", "topic", "question"].map((s, i) => (
                <div
                  key={s}
                  className={`h-1 flex-1 rounded-full transition ${
                    step === s || ["examBoard", "topic", "question"].indexOf(step) > i
                      ? "bg-teal-accent"
                      : "bg-teal-light"
                  }`}
                />
              ))}
            </div>
            <p className="text-sm text-foreground/60">
              Step {["examBoard", "topic", "question"].indexOf(step) + 1} of 3
            </p>
          </div>

          {/* Step: Exam Board */}
          {step === "examBoard" && (
            <div>
              <h1 className="text-4xl font-bold mb-6">Which exam board are you using?</h1>
              <p className="text-lg text-foreground/60 mb-8">
                We'll customize the marking criteria and feedback to match your specification.
              </p>

              <div className="space-y-4 mb-8">
                <button
                  onClick={handleContinueToTopic}
                  className="w-full p-4 border border-teal-light rounded-lg hover:bg-teal-light/50 hover:border-teal-accent transition text-left font-semibold bg-teal-light/20"
                >
                  Edexcel A Economics (Currently focusing on this)
                </button>
                <button
                  disabled
                  className="w-full p-4 border border-teal-light rounded-lg hover:bg-teal-light/50 hover:border-teal-accent transition text-left font-semibold opacity-50 cursor-not-allowed"
                >
                  AQA Economics (Coming soon)
                </button>
                <button
                  disabled
                  className="w-full p-4 border border-teal-light rounded-lg hover:bg-teal-light/50 hover:border-teal-accent transition text-left font-semibold opacity-50 cursor-not-allowed"
                >
                  OCR H567 Economics (Coming soon)
                </button>
              </div>

              <button
                onClick={handleContinueToTopic}
                className="px-6 py-3 bg-teal-accent text-white rounded-lg font-semibold hover:opacity-90 transition flex items-center gap-2"
              >
                Continue <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Step: Topic Selection */}
          {step === "topic" && (
            <div>
              <h1 className="text-4xl font-bold mb-6">What topic are you working on?</h1>
              <p className="text-lg text-foreground/60 mb-8">Select the theme that matches your essay question.</p>

              <div className="space-y-4 mb-8">
                {["Microeconomics", "Macroeconomics", "Global Economics", "Development Economics"].map((topic) => (
                  <button
                    key={topic}
                    onClick={() => handleContinueToQuestion(topic)}
                    className={`w-full p-4 border rounded-lg transition text-left font-semibold ${
                      selectedTopic === topic
                        ? "border-teal-accent bg-teal-light/20"
                        : "border-teal-light hover:bg-teal-light/50 hover:border-teal-accent"
                    }`}
                  >
                    {topic}
                  </button>
                ))}
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => setStep("examBoard")}
                  className="px-6 py-3 border border-teal-accent text-teal-accent rounded-lg font-semibold hover:bg-teal-light transition"
                >
                  Back
                </button>
                <button
                  onClick={() => handleContinueToQuestion(selectedTopic)}
                  disabled={!selectedTopic}
                  className="px-6 py-3 bg-teal-accent text-white rounded-lg font-semibold hover:opacity-90 transition flex items-center gap-2 disabled:opacity-50"
                >
                  Continue <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Step: Question Type */}
          {step === "question" && (
            <div>
              <h1 className="text-4xl font-bold mb-6">What type of question are you answering?</h1>
              <p className="text-lg text-foreground/60 mb-8">This helps us apply the correct marking criteria.</p>

              <div className="space-y-4 mb-8">
                {[
                  { type: "Multiple Choice", marks: "10 marks", focus: "AO1 & AO2" },
                  { type: "Short Answer", marks: "15 marks", focus: "AO1, AO2 & AO3" },
                  { type: "Essay Question", marks: "25 marks", focus: "AO1, AO3 & AO4" },
                  { type: "Data Response", marks: "40 marks", focus: "All AOs" },
                ].map((q) => (
                  <button
                    key={q.type}
                    onClick={() => setSelectedQuestion(q.type)}
                    className={`w-full p-4 border rounded-lg transition text-left ${
                      selectedQuestion === q.type
                        ? "border-teal-accent bg-teal-light/20"
                        : "border-teal-light hover:bg-teal-light/50 hover:border-teal-accent"
                    }`}
                  >
                    <div className="font-semibold">{q.type}</div>
                    <div className="text-sm text-foreground/60">
                      {q.marks} • {q.focus}
                    </div>
                  </button>
                ))}
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => setStep("topic")}
                  className="px-6 py-3 border border-teal-accent text-teal-accent rounded-lg font-semibold hover:bg-teal-light transition"
                >
                  Back
                </button>
                <button
                  onClick={() => handleCompleteonboarding(selectedQuestion)}
                  disabled={!selectedQuestion || loading}
                  className="px-6 py-3 bg-teal-accent text-white rounded-lg font-semibold hover:opacity-90 transition flex items-center gap-2 disabled:opacity-50"
                >
                  {loading ? "Setting up..." : "Go to Dashboard"} <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
