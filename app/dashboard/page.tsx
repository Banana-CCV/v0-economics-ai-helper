"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { LogOut, Settings, FileUp, Copy, Camera, ChevronRight } from "lucide-react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"

interface EssayData {
  id: string
  questionText: string
  markAllocation: number
  extractText?: string
  essayText: string
  isMarked: boolean
  overallScore?: number
  aoScores?: { ao1: number; ao2: number; ao3: number; ao4: number }
}

const mockEssay: EssayData = {
  id: "1",
  questionText: "Explain how supply and demand interact to determine market equilibrium.",
  markAllocation: 25,
  extractText: "The market for coffee has recently been affected by poor harvests in key producer countries...",
  essayText: `Supply and demand are fundamental economic concepts. When demand increases while supply remains constant, this creates a shortage. The market reaches equilibrium when the quantity supplied equals the quantity demanded at a particular price level.`,
  isMarked: true,
  overallScore: 18,
  aoScores: { ao1: 5, ao2: 4, ao3: 5, ao4: 4 },
}

const mockRecentEssays = [
  { id: "1", title: "Supply and Demand Equilibrium", marks: 25, date: "Today", score: 18 },
  { id: "2", title: "Elasticity of Demand", marks: 20, date: "Yesterday", score: 16 },
  { id: "3", title: "Market Failures", marks: 25, date: "2 days ago", score: 17 },
  { id: "4", title: "Inflation and Unemployment", marks: 15, date: "1 week ago", score: 12 },
]

const getAOsForMarks = (marks: number | "") => {
  const aoMap: Record<number, Record<string, number>> = {
    10: { ao1: 3, ao2: 2, ao3: 3, ao4: 2 },
    15: { ao1: 4, ao2: 3, ao3: 4, ao4: 4 },
    20: { ao1: 5, ao2: 4, ao3: 5, ao4: 6 },
    25: { ao1: 7, ao2: 6, ao3: 7, ao4: 5 },
  }
  return marks && marks in aoMap ? aoMap[marks as number] : null
}

export default function DashboardPage() {
  const router = useRouter()
  const [hasEssay, setHasEssay] = useState(false)
  const [essay, setEssay] = useState<EssayData>(mockEssay)
  const [questionText, setQuestionText] = useState("")
  const [markAllocation, setMarkAllocation] = useState<number | "">("")
  const [extractText, setExtractText] = useState("")
  const [essayText, setEssayText] = useState("")
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [questionExpanded, setQuestionExpanded] = useState(true)
  const [extractExpanded, setExtractExpanded] = useState(false)
  const [essayExpanded, setEssayExpanded] = useState(false)

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) router.push("/auth/login")
    }
    checkAuth()
  }, [router])

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/")
  }

  const handleSubmitEssay = () => {
    if (questionText && markAllocation && essayText) {
      setEssay((prev) => ({
        ...prev,
        questionText,
        markAllocation: Number(markAllocation),
        extractText: extractText || undefined,
        essayText,
      }))
      setHasEssay(true)
    }
  }

  const currentAOs = getAOsForMarks(markAllocation)
  const isQuestionFilled = questionText && markAllocation

  return (
    <div className="min-h-screen bg-background flex">
      {/* ... existing sidebar code ... */}
      <div
        className={`fixed left-0 top-16 bottom-0 z-30 transition-all duration-300 flex`}
        onMouseEnter={() => setSidebarOpen(true)}
        onMouseLeave={() => setSidebarOpen(false)}
      >
        <div className="w-1 bg-gradient-to-b from-teal-accent to-teal-light hover:w-2 transition-all duration-300" />

        <div
          className={`bg-gradient-to-br from-teal-accent/15 to-teal-accent/5 border-r border-teal-accent/20 transition-all duration-300 overflow-hidden ${
            sidebarOpen ? "w-64" : "w-0"
          }`}
        >
          <div className="p-4 h-full flex flex-col w-64">
            <div className="flex items-center justify-center h-10 mb-4">
              <span className="text-xs font-bold uppercase text-foreground/60">Recent Essays</span>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2">
              {mockRecentEssays.map((essayItem) => (
                <button
                  key={essayItem.id}
                  className="w-full p-3 rounded-lg bg-white/80 dark:bg-card/80 hover:bg-white dark:hover:bg-card border border-border/30 hover:border-teal-accent/50 transition-all text-left group"
                >
                  <p className="text-xs font-semibold text-foreground truncate group-hover:text-teal-accent transition">
                    {essayItem.title}
                  </p>
                  <p className="text-xs text-foreground/50 mt-1">
                    {essayItem.marks}M • {essayItem.date}
                  </p>
                  {essayItem.score && (
                    <p className="text-xs font-bold text-teal-accent mt-2">
                      {essayItem.score}/{essayItem.marks}
                    </p>
                  )}
                </button>
              ))}
            </div>

            <button className="w-full p-3 rounded-lg border-2 border-dashed border-teal-accent/50 hover:bg-teal-light/20 transition text-xs font-semibold text-teal-accent mt-4">
              View All Essays
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* ... existing header code ... */}
        <header className="border-b border-border/30 bg-gradient-to-r from-teal-accent/10 to-teal-light/10 backdrop-blur sticky top-0 z-50">
          <div className="px-8 h-16 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 hover:opacity-70 transition">
              <h1 className="font-bold text-lg">EconAI</h1>
            </Link>
            <div className="flex items-center gap-2">
              <button className="p-2 hover:bg-muted rounded-lg transition" title="Settings">
                <Settings className="w-5 h-5" />
              </button>
              <button onClick={handleLogout} className="p-2 hover:bg-muted rounded-lg transition" title="Logout">
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 px-8 py-8 overflow-auto">
          {!hasEssay ? (
            <div className="max-w-6xl mx-auto grid lg:grid-cols-3 gap-8">
              {/* Left: Question form area */}
              <div className="lg:col-span-2 space-y-4">
                {questionExpanded ? (
                  <div className="rounded-xl border-2 border-border bg-gradient-to-br from-card/80 to-card/40 backdrop-blur p-6 space-y-4">
                    <h2 className="text-base font-bold uppercase text-foreground">Question Details</h2>

                    {/* Question Text */}
                    <div>
                      <label className="block text-xs font-semibold mb-2">Question</label>
                      <textarea
                        value={questionText}
                        onChange={(e) => setQuestionText(e.target.value)}
                        placeholder="Paste the question here..."
                        className="w-full p-3 rounded-lg border border-border bg-background text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-teal-accent/50 min-h-20 text-sm"
                      />
                    </div>

                    {/* Mark Allocation */}
                    <div>
                      <label className="block text-xs font-semibold mb-2">Marks</label>
                      <select
                        value={markAllocation}
                        onChange={(e) => setMarkAllocation(e.target.value ? Number(e.target.value) : "")}
                        className="w-full p-3 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-teal-accent/50 cursor-pointer font-medium text-sm"
                      >
                        <option value="">Select marks...</option>
                        <option value="10">10 marks</option>
                        <option value="15">15 marks</option>
                        <option value="20">20 marks</option>
                        <option value="25">25 marks</option>
                      </select>
                    </div>

                    {/* Collapse button - Only show if question filled */}
                    {isQuestionFilled && (
                      <div className="flex justify-end">
                        <button
                          onClick={() => setQuestionExpanded(false)}
                          className="px-6 py-2 bg-gradient-to-r from-teal-accent to-teal-light text-white rounded-lg font-semibold hover:opacity-90 transition text-sm"
                        >
                          Continue
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <button
                    onClick={() => setQuestionExpanded(true)}
                    className="w-full p-3 rounded-lg border border-border bg-card/50 hover:bg-card/70 transition text-left flex items-center justify-between group"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold uppercase text-foreground/60 mb-1">Question</p>
                      <p className="text-xs text-foreground/80 truncate">
                        {questionText} — ({markAllocation} marks)
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-foreground/50 flex-shrink-0 ml-4" />
                  </button>
                )}

                {isQuestionFilled && !questionExpanded && (
                  <>
                    {!extractExpanded ? (
                      <button
                        onClick={() => setExtractExpanded(true)}
                        className="w-full p-3 rounded-lg border border-border bg-card/50 hover:bg-card/70 transition text-left flex items-center justify-between group"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold uppercase text-foreground/60 mb-1">Extract / Case Study</p>
                          <p className="text-xs text-foreground/50">Optional</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-foreground/50 flex-shrink-0 ml-4" />
                      </button>
                    ) : (
                      <div className="rounded-xl border-2 border-border bg-gradient-to-br from-card/80 to-card/40 backdrop-blur p-6 space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="text-base font-bold uppercase text-foreground">Extract / Case Study</h3>
                          <button
                            onClick={() => setExtractExpanded(false)}
                            className="text-xs font-semibold text-foreground/60 hover:text-foreground transition"
                          >
                            Collapse
                          </button>
                        </div>

                        <textarea
                          value={extractText}
                          onChange={(e) => setExtractText(e.target.value)}
                          placeholder="Paste any relevant extract or case study..."
                          className="w-full p-3 rounded-lg border border-border bg-background text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-teal-accent/50 min-h-20 text-sm"
                        />

                        <div className="flex justify-end">
                          <button
                            onClick={() => setExtractExpanded(false)}
                            className="px-6 py-2 bg-gradient-to-r from-teal-accent to-teal-light text-white rounded-lg font-semibold hover:opacity-90 transition text-sm"
                          >
                            Done
                          </button>
                        </div>
                      </div>
                    )}

                    {!essayExpanded ? (
                      <button
                        onClick={() => setEssayExpanded(true)}
                        className="w-full p-3 rounded-lg border border-border bg-card/50 hover:bg-card/70 transition text-left flex items-center justify-between group"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold uppercase text-foreground/60 mb-1">Your Essay</p>
                          <p className="text-xs text-foreground/50">Upload or paste your answer</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-foreground/50 flex-shrink-0 ml-4" />
                      </button>
                    ) : (
                      <div className="space-y-4">
                        <div className="rounded-xl border-2 border-border bg-gradient-to-br from-card/80 to-card/40 backdrop-blur p-6 space-y-4">
                          <h3 className="text-base font-bold uppercase text-foreground">Your Essay</h3>

                          <div className="grid md:grid-cols-3 gap-4">
                            {/* Upload File */}
                            <button className="p-4 rounded-lg border-2 border-dashed border-border hover:border-teal-accent/50 bg-card/50 hover:bg-teal-light/10 transition-all flex flex-col items-center justify-center gap-2 group">
                              <FileUp className="w-5 h-5 text-foreground/60 group-hover:text-teal-accent transition" />
                              <p className="text-xs font-semibold">Upload File</p>
                              <p className="text-xs text-foreground/50">PDF, DOCX</p>
                            </button>

                            {/* Paste Text */}
                            <button
                              onClick={() => {
                                const textarea = document.querySelector(
                                  'textarea[placeholder="Paste your essay..."]',
                                ) as HTMLTextAreaElement
                                textarea?.focus()
                              }}
                              className="p-4 rounded-lg border-2 border-dashed border-teal-accent/50 bg-gradient-to-br from-teal-light/20 to-teal-light/10 hover:from-teal-light/30 hover:to-teal-light/15 transition-all flex flex-col items-center justify-center gap-2 group"
                            >
                              <Copy className="w-5 h-5 text-teal-accent" />
                              <p className="text-xs font-semibold text-teal-accent">Paste Text</p>
                              <p className="text-xs text-foreground/50">Copy & paste essay</p>
                            </button>

                            {/* Snap Photo */}
                            <button className="p-4 rounded-lg border-2 border-dashed border-border hover:border-teal-accent/50 bg-card/50 hover:bg-teal-light/10 transition-all flex flex-col items-center justify-center gap-2 group">
                              <Camera className="w-5 h-5 text-foreground/60 group-hover:text-teal-accent transition" />
                              <p className="text-xs font-semibold">Snap Photo</p>
                              <p className="text-xs text-foreground/50">Use OCR</p>
                            </button>
                          </div>

                          {/* Essay Textarea */}
                          <div className="space-y-3">
                            <textarea
                              value={essayText}
                              onChange={(e) => setEssayText(e.target.value)}
                              placeholder="Paste your essay..."
                              className="w-full p-3 rounded-lg border border-border bg-background text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-teal-accent/50 min-h-40 font-mono text-xs"
                            />
                            <div className="flex items-center justify-between text-xs text-foreground/50">
                              <span>{essayText.split(/\s+/).filter(Boolean).length} words</span>
                              <button
                                onClick={handleSubmitEssay}
                                disabled={!essayText}
                                className="px-6 py-2 bg-gradient-to-r from-teal-accent to-teal-light text-white rounded-lg font-semibold hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed text-xs"
                              >
                                Submit Essay
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Right: AO Card */}
              <div className="p-6 rounded-lg border border-border bg-gradient-to-br from-card/80 to-card/40 backdrop-blur h-fit">
                <h3 className="font-bold text-sm mb-6 uppercase text-foreground/70">Assessment Objectives</h3>

                {currentAOs ? (
                  <div className="space-y-3">
                    {Object.entries(currentAOs).map(([ao, maxScore]) => (
                      <div
                        key={ao}
                        className="flex items-center justify-between p-3 rounded-lg bg-background/50 hover:bg-background/70 transition border border-border/30 hover:border-teal-accent/50"
                      >
                        <span className="text-sm font-bold uppercase text-teal-accent">{ao}</span>
                        <span className="text-xs font-semibold text-foreground/60">/ {maxScore}</span>
                      </div>
                    ))}
                    <div className="pt-3 border-t border-border/30 mt-4">
                      <p className="text-xs text-foreground/60">
                        <span className="font-semibold">Total: </span>
                        {markAllocation} marks
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-foreground/50 text-center py-12">Select marks to see breakdown</p>
                )}
              </div>
            </div>
          ) : (
            <div className="max-w-7xl mx-auto grid lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-4">
                <button
                  onClick={() => setQuestionExpanded(!questionExpanded)}
                  className="w-full p-4 rounded-lg border border-border bg-card/50 hover:bg-card/70 transition text-left flex items-center justify-between group"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold uppercase text-foreground/60 mb-1">Question</p>
                    <p className="text-sm text-foreground/80">
                      {essay.questionText} — ({essay.markAllocation} marks)
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-foreground/50 flex-shrink-0 ml-4" />
                </button>

                {essay.extractText && (
                  <div className="rounded-lg border border-border bg-card/50 overflow-hidden">
                    <div className="p-4">
                      <h3 className="text-sm font-semibold mb-2">Extract / Case Study</h3>
                      <p className="text-sm text-foreground/70 italic">{essay.extractText}</p>
                    </div>
                  </div>
                )}

                <div className="p-6 rounded-lg border border-border bg-card/50 min-h-96">
                  <h3 className="text-xs font-bold uppercase text-foreground/60 mb-4">Your Essay</h3>
                  <p className="text-foreground/80 leading-relaxed">{essay.essayText}</p>
                  <p className="text-xs text-foreground/50 mt-6">{essay.essayText.split(/\s+/).length} words</p>
                </div>
              </div>

              <aside className="p-6 rounded-lg border border-border bg-card/50 h-fit sticky top-24 space-y-6">
                <div>
                  <h3 className="font-bold text-sm mb-4">Feedback</h3>
                  {essay.isMarked && essay.overallScore !== undefined && (
                    <>
                      <p className="text-xs text-foreground/60 uppercase font-semibold mb-2">Overall Score</p>
                      <div className="flex items-baseline gap-2 mb-3">
                        <span className="text-3xl font-bold">{essay.overallScore}</span>
                        <span className="text-sm text-foreground/60">/ {essay.markAllocation}</span>
                      </div>
                      <div className="w-full h-2 bg-border/30 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-teal-accent to-teal-light"
                          style={{
                            width: `${(essay.overallScore / essay.markAllocation) * 100}%`,
                          }}
                        />
                      </div>
                    </>
                  )}
                </div>

                {essay.aoScores && (
                  <div className="border-t border-border/50 pt-4">
                    <p className="text-xs text-foreground/60 uppercase font-semibold mb-3">Assessment Objectives</p>
                    <div className="space-y-2">
                      {Object.entries(essay.aoScores).map(([ao, score]) => (
                        <div key={ao} className="flex items-center justify-between p-2 rounded bg-background/50">
                          <span className="text-xs font-bold uppercase text-teal-accent">{ao}</span>
                          <span className="text-xs font-semibold">{score}/5</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="border-t border-border/50 pt-4">
                  <p className="text-xs text-foreground/60">Sentence-level feedback will appear here.</p>
                </div>
              </aside>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
