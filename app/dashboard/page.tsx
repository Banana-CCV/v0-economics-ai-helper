"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { LogOut, Settings, FileUp, Copy, Camera, ChevronRight, Loader2, X, Clock, TrendingUp, BookOpen, Zap, AlertCircle } from "lucide-react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import type { ReactElement } from "react"

interface EssayData {
  id: string
  questionText: string
  markAllocation: number
  extractText?: string
  essayText: string
  isMarked: boolean
  overallScore?: number
  aoScores?: { ao1: number; ao2: number; ao3: number; ao4: number }
  markingResult?: any
  createdAt?: Date
}

interface SentenceHighlight {
  text: string
  quality: 'strong' | 'adequate' | 'weak'
  ao: string
  feedback: string
  chainId?: number
}

interface AnalysisChain {
  id: number
  chain: string[]
  quality: 'strong' | 'adequate' | 'weak'
  feedback: string
}

const getAOsForMarks = (marks: number | "") => {
  const aoMap: Record<number, Record<string, number>> = {
    5: { knowledge: 2, application: 1, analysis: 2, evaluation: 0 },
    8: { knowledge: 2, application: 2, analysis: 2, evaluation: 2 },
    10: { knowledge: 2, application: 2, analysis: 2, evaluation: 4 },
    15: { knowledge: 3, application: 3, analysis: 3, evaluation: 6 },
    20: { knowledge: 5, application: 4, analysis: 5, evaluation: 6 },
    25: { knowledge: 5, application: 4, analysis: 6, evaluation: 10 },
  }
  return marks && marks in aoMap ? aoMap[marks as number] : null
}

const getStructureGuidance = (marks: number) => {
  const guidance: Record<number, string> = {
    25: "6 paragraphs: Intro (define terms) → KAA 1 (5+ chains) → Eval 1 → KAA 2 (5+ chains) → Eval 2 → Conclusion (justified judgement)",
    20: "5 paragraphs: Intro → 2 KAA (deep analysis) → 2 Evaluation → Conclusion",
    15: "4 paragraphs: Brief intro → 2 deep KAA → 2 Evaluation",
    10: "3-4 paragraphs: 2 KAA → 2 short Evaluation",
    8: "3 paragraphs: 2 KAA → 1 Evaluation",
    5: "1-2 paragraphs: KAA only (no evaluation needed)",
  }
  return guidance[marks] || "Standard essay structure"
}

export default function DashboardPage() {
  const router = useRouter()
  const [hasEssay, setHasEssay] = useState(false)
  const [essay, setEssay] = useState<EssayData | null>(null)
  const [questionText, setQuestionText] = useState("")
  const [markAllocation, setMarkAllocation] = useState<number | "">("")
  const [extractText, setExtractText] = useState("")
  const [essayText, setEssayText] = useState("")
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [questionExpanded, setQuestionExpanded] = useState(true)
  const [extractExpanded, setExtractExpanded] = useState(false)
  const [essayExpanded, setEssayExpanded] = useState(false)
  const [isMarking, setIsMarking] = useState(false)
  const [markingError, setMarkingError] = useState("")
  const [selectedHighlight, setSelectedHighlight] = useState<SentenceHighlight | null>(null)
  const [selectedChain, setSelectedChain] = useState<AnalysisChain | null>(null)
  const [recentEssays, setRecentEssays] = useState<EssayData[]>([])
  const [markingProgress, setMarkingProgress] = useState(0)
  const [essaysRemaining, setEssaysRemaining] = useState(3)
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) router.push("/auth/login")
      else {
        loadRecentEssays()
        checkEssayCount()
      }
    }
    checkAuth()
  }, [router])

  const checkEssayCount = async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { count } = await supabase
        .from('essays')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)

      const remaining = Math.max(0, 3 - (count || 0))
      setEssaysRemaining(remaining)
    } catch (error) {
      console.error('Failed to check essay count:', error)
    }
  }

  const loadRecentEssays = async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('essays')
        .select('id, question_text, mark_allocation, is_marked, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10)

      if (!error && data) {
        setRecentEssays(data.map(e => ({
          id: e.id,
          questionText: e.question_text || '',
          markAllocation: e.mark_allocation || 25,
          essayText: '',
          isMarked: e.is_marked || false,
          createdAt: new Date(e.created_at),
        })))
      }
    } catch (error) {
      console.error('Failed to load recent essays:', error)
    }
  }

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/")
  }

  const handleSubmitEssay = async () => {
    if (!questionText || !markAllocation || !essayText) {
      alert("Please fill in all required fields")
      return
    }

    // Check AFTER they click - show modal instead of blocking
    if (essaysRemaining <= 0) {
      setShowUpgradeModal(true)
      return
    }

    setIsMarking(true)
    setMarkingError("")
    setMarkingProgress(0)

    const progressInterval = setInterval(() => {
      setMarkingProgress(prev => Math.min(prev + Math.random() * 15, 90))
    }, 1000)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("Not authenticated")

      const { data: savedEssay, error: essayError } = await supabase
        .from('essays')
        .insert({
          user_id: user.id,
          title: questionText.substring(0, 100),
          content: essayText,
          question_text: questionText,
          mark_allocation: Number(markAllocation),
          extract_text: extractText || null,
          word_count: essayText.split(/\s+/).filter(Boolean).length,
          topic: 'general',
          question_type: 'essay',
          is_marked: false,
        })
        .select()
        .single()

      if (essayError) throw new Error("Failed to save essay: " + essayError.message)

      const response = await fetch('/api/mark-essay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: questionText,
          marks: Number(markAllocation),
          essay: essayText,
          extractText: extractText || undefined,
          essayId: savedEssay.id,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to mark essay')
      }

      const data = await response.json()
      await supabase.from('essays').update({ is_marked: true }).eq('id', savedEssay.id)

      setMarkingProgress(100)
      clearInterval(progressInterval)

      setEssay({
        id: savedEssay.id,
        questionText,
        markAllocation: Number(markAllocation),
        extractText: extractText || undefined,
        essayText,
        isMarked: true,
        overallScore: data.result.overallMark,
        aoScores: {
          ao1: data.result.aoBreakdown.knowledge.score,
          ao2: data.result.aoBreakdown.application.score,
          ao3: data.result.aoBreakdown.analysis.score,
          ao4: data.result.aoBreakdown.evaluation.score,
        },
        markingResult: data.result,
        createdAt: new Date(),
      })

      setHasEssay(true)
      await loadRecentEssays()
      await checkEssayCount()
    } catch (error) {
      clearInterval(progressInterval)
      console.error("Submit error:", error)
      setMarkingError(error instanceof Error ? error.message : "Failed to mark essay")
      alert("❌ Error: " + (error instanceof Error ? error.message : "Failed to mark essay"))
    } finally {
      setIsMarking(false)
      setMarkingProgress(0)
    }
  }

  const loadPreviousEssay = async (essayId: string) => {
    try {
      const supabase = createClient()
      const { data: essayData, error: essayError } = await supabase
        .from('essays')
        .select('*')
        .eq('id', essayId)
        .single()

      if (essayError || !essayData) throw new Error('Failed to load essay')

      const { data: feedbackData } = await supabase
        .from('essay_feedback')
        .select('*')
        .eq('essay_id', essayId)
        .single()

      if (feedbackData) {
        const result = JSON.parse(feedbackData.overall_feedback)
        setEssay({
          id: essayData.id,
          questionText: essayData.question_text || '',
          markAllocation: essayData.mark_allocation || 25,
          extractText: essayData.extract_text || undefined,
          essayText: essayData.content || '',
          isMarked: true,
          overallScore: feedbackData.total_score,
          aoScores: {
            ao1: feedbackData.ao1_score,
            ao2: feedbackData.ao2_score,
            ao3: feedbackData.ao3_score,
            ao4: feedbackData.ao4_score,
          },
          markingResult: result,
          createdAt: new Date(essayData.created_at),
        })
        setHasEssay(true)
      }
    } catch (error) {
      console.error('Failed to load essay:', error)
      alert('Failed to load previous essay')
    }
  }

  const renderHighlightedEssay = () => {
    if (!essay?.markingResult?.sentenceHighlights || essay.markingResult.sentenceHighlights.length === 0) {
      return <p className="text-foreground/80 leading-relaxed whitespace-pre-wrap">{essay?.essayText}</p>
    }

    const highlights = essay.markingResult.sentenceHighlights
    let remainingText = essay.essayText
    const elements: ReactElement[] = []
    let keyIndex = 0

    highlights.forEach((highlight: SentenceHighlight) => {
      const index = remainingText.indexOf(highlight.text)
      
      if (index !== -1) {
        if (index > 0) {
          elements.push(
            <span key={`text-${keyIndex++}`} className="text-foreground/80">
              {remainingText.substring(0, index)}
            </span>
          )
        }

        const colorClass = 
          highlight.quality === 'strong' ? 'bg-green-200 dark:bg-green-900/40 border-b-2 border-green-500 hover:bg-green-300 dark:hover:bg-green-900/60' :
          highlight.quality === 'adequate' ? 'bg-yellow-200 dark:bg-yellow-900/40 border-b-2 border-yellow-500 hover:bg-yellow-300 dark:hover:bg-yellow-900/60' :
          'bg-red-200 dark:bg-red-900/40 border-b-2 border-red-500 hover:bg-red-300 dark:hover:bg-red-900/60'

        elements.push(
          <span
            key={`highlight-${keyIndex++}`}
            className={`${colorClass} cursor-pointer transition-all rounded-sm px-0.5 relative group`}
            onClick={() => setSelectedHighlight(highlight)}
          >
            {highlight.text}
            {highlight.chainId && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {highlight.chainId}
              </span>
            )}
            <span className="absolute -top-8 left-0 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
              {highlight.ao} - Click for details
            </span>
          </span>
        )

        remainingText = remainingText.substring(index + highlight.text.length)
      }
    })

    if (remainingText) {
      elements.push(
        <span key={`text-${keyIndex++}`} className="text-foreground/80">
          {remainingText}
        </span>
      )
    }

    return <div className="leading-relaxed">{elements}</div>
  }

  const currentAOs = getAOsForMarks(markAllocation)
  const isQuestionFilled = questionText && markAllocation
  const structureGuidance = markAllocation ? getStructureGuidance(Number(markAllocation)) : ""

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50/30 via-cyan-50/20 to-gray-50 dark:from-gray-900 dark:to-gray-800 flex">
      {/* SIDEBAR - TEAL WITH TOUCH OF BLUE */}
      <div
        className={`fixed left-0 top-0 bottom-0 z-30 transition-all duration-300 ${sidebarOpen ? "w-72" : "w-16"} shadow-2xl`}
        style={{ background: 'linear-gradient(135deg, #14b8a6 0%, #06b6d4 100%)' }}
        onMouseEnter={() => setSidebarOpen(true)}
        onMouseLeave={() => setSidebarOpen(false)}
      >
        <div className="h-full flex flex-col p-4">
          <div className="mb-6 flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 backdrop-blur rounded-lg flex items-center justify-center shrink-0">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            {sidebarOpen && (
              <span className="text-white font-bold text-lg whitespace-nowrap">Recent Essays</span>
            )}
          </div>

          <div className="flex-1 overflow-y-auto">
            {sidebarOpen && recentEssays.length > 0 ? (
              <div className="space-y-2">
                {recentEssays.map((e) => (
                  <button
                    key={e.id}
                    onClick={() => loadPreviousEssay(e.id)}
                    className="w-full p-3 rounded-lg bg-white/10 hover:bg-white/20 backdrop-blur transition text-left group"
                  >
                    <p className="text-white text-xs font-medium truncate mb-1">
                      {e.questionText.substring(0, 60)}...
                    </p>
                    <div className="flex items-center justify-between text-xs text-white/70">
                      <span>{e.markAllocation}M</span>
                      <span>{e.createdAt?.toLocaleDateString()}</span>
                    </div>
                  </button>
                ))}
              </div>
            ) : sidebarOpen ? (
              <p className="text-white/60 text-sm text-center py-4">No essays yet</p>
            ) : null}
          </div>

          {!sidebarOpen && (
            <div className="flex flex-col items-center gap-4">
              <Clock className="w-5 h-5 text-white/60" />
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col ml-16">
        <header className="border-b border-border/30 bg-white/50 dark:bg-gray-900/50 backdrop-blur sticky top-0 z-40 shadow-sm">
          <div className="px-8 h-16 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 hover:opacity-70 transition">
              <h1 className="font-bold text-xl" style={{ color: '#000' }}>
                EconAI
              </h1>
            </Link>
            <div className="flex items-center gap-4">
              {essaysRemaining > 0 ? (
                <div className="px-3 py-1 bg-teal-50 dark:bg-teal-900/20 border border-teal-200 dark:border-teal-800 rounded-lg flex items-center gap-2">
                  <Zap className="w-4 h-4 text-teal-600" />
                  <span className="text-xs font-semibold text-teal-700 dark:text-teal-400">
                    {essaysRemaining} essay{essaysRemaining !== 1 ? 's' : ''} remaining
                  </span>
                </div>
              ) : (
                <button
                  onClick={() => setShowUpgradeModal(true)}
                  className="px-4 py-1.5 rounded-lg text-xs font-semibold text-white transition"
                  style={{ background: 'linear-gradient(135deg, #14b8a6 0%, #06b6d4 100%)' }}
                >
                  Upgrade to Pro
                </button>
              )}
              <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition">
                <Settings className="w-5 h-5" />
              </button>
              <button onClick={handleLogout} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition">
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 px-8 py-8 overflow-auto">
          {!hasEssay ? (
            <div className="max-w-6xl mx-auto grid lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-4">
                {questionExpanded ? (
                  <div className="rounded-xl border border-teal-200 dark:border-teal-800 bg-white dark:bg-gray-900 shadow-lg p-6 space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                      <BookOpen className="w-5 h-5 text-teal-600" />
                      <h2 className="text-base font-bold uppercase text-foreground">Question Details</h2>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-2 text-foreground/70">Question</label>
                      <textarea
                        value={questionText}
                        onChange={(e) => setQuestionText(e.target.value)}
                        placeholder="Paste the question here..."
                        className="w-full p-3 rounded-lg border border-border bg-background text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-teal-500 min-h-20 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-2 text-foreground/70">Marks</label>
                      <select
                        value={markAllocation}
                        onChange={(e) => setMarkAllocation(e.target.value ? Number(e.target.value) : "")}
                        className="w-full p-3 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer font-medium text-sm"
                      >
                        <option value="">Select marks...</option>
                        <option value="5">5 marks</option>
                        <option value="8">8 marks</option>
                        <option value="10">10 marks</option>
                        <option value="15">15 marks</option>
                        <option value="20">20 marks</option>
                        <option value="25">25 marks</option>
                      </select>
                    </div>
                    {isQuestionFilled && (
                      <div className="flex justify-end">
                        <button
                          onClick={() => setQuestionExpanded(false)}
                          className="px-6 py-2 text-white rounded-lg font-semibold hover:opacity-90 transition text-sm shadow-lg"
                          style={{ background: 'linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)' }}
                        >
                          Continue
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <button
                    onClick={() => setQuestionExpanded(true)}
                    className="w-full p-4 rounded-xl border border-border bg-white dark:bg-gray-900 hover:shadow-lg transition text-left flex items-center justify-between group"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold uppercase text-foreground/60 mb-1">Question</p>
                      <p className="text-sm text-foreground/80 truncate">{questionText} — ({markAllocation} marks)</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-foreground/50 flex-shrink-0 ml-4 group-hover:translate-x-1 transition-transform" />
                  </button>
                )}

                {isQuestionFilled && !questionExpanded && (
                  <>
                    {!extractExpanded ? (
                      <button
                        onClick={() => setExtractExpanded(true)}
                        className="w-full p-4 rounded-xl border border-border bg-white dark:bg-gray-900 hover:shadow-lg transition text-left flex items-center justify-between group"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold uppercase text-foreground/60 mb-1">Extract / Case Study</p>
                          <p className="text-xs text-foreground/50">Optional</p>
                        </div>
                        <ChevronRight className="w-5 h-5 text-foreground/50 flex-shrink-0 ml-4 group-hover:translate-x-1 transition-transform" />
                      </button>
                    ) : (
                      <div className="rounded-xl border border-border bg-white dark:bg-gray-900 shadow-lg p-6 space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="text-base font-bold uppercase text-foreground">Extract / Case Study</h3>
                          <button onClick={() => setExtractExpanded(false)} className="text-xs font-semibold text-foreground/60 hover:text-foreground transition">
                            Collapse
                          </button>
                        </div>
                        <textarea
                          value={extractText}
                          onChange={(e) => setExtractText(e.target.value)}
                          placeholder="Paste any relevant extract or case study..."
                          className="w-full p-3 rounded-lg border border-border bg-background text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-teal-500 min-h-20 text-sm"
                        />
                        <div className="flex justify-end">
                          <button
                            onClick={() => setExtractExpanded(false)}
                            className="px-6 py-2 text-white rounded-lg font-semibold hover:opacity-90 transition text-sm"
                            style={{ background: 'linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)' }}
                          >
                            Done
                          </button>
                        </div>
                      </div>
                    )}

                    {!essayExpanded ? (
                      <button
                        onClick={() => setEssayExpanded(true)}
                        className="w-full p-4 rounded-xl border border-border bg-white dark:bg-gray-900 hover:shadow-lg transition text-left flex items-center justify-between group"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold uppercase text-foreground/60 mb-1">Your Essay</p>
                          <p className="text-xs text-foreground/50">Upload or paste your answer</p>
                        </div>
                        <ChevronRight className="w-5 h-5 text-foreground/50 flex-shrink-0 ml-4 group-hover:translate-x-1 transition-transform" />
                      </button>
                    ) : (
                      <div className="space-y-4">
                        <div className="rounded-xl border border-border bg-white dark:bg-gray-900 shadow-lg p-6 space-y-4">
                          <div className="flex items-center gap-2 mb-2">
                            <Zap className="w-5 h-5 text-teal-600" />
                            <h3 className="text-base font-bold uppercase text-foreground">Your Essay</h3>
                          </div>
                          <div className="grid md:grid-cols-3 gap-4">
                            <button className="p-4 rounded-lg border-2 border-dashed border-border bg-card/50 opacity-50 cursor-not-allowed flex flex-col items-center justify-center gap-2">
                              <FileUp className="w-5 h-5 text-foreground/60" />
                              <p className="text-xs font-semibold">Upload File</p>
                              <p className="text-xs text-foreground/50">Coming soon</p>
                            </button>
                            <button
                              onClick={() => document.querySelector<HTMLTextAreaElement>('textarea[placeholder="Paste your essay..."]')?.focus()}
                              className="p-4 rounded-lg border-2 border-dashed border-teal-500 bg-gradient-to-br from-teal-50 to-cyan-50 dark:from-teal-900/20 dark:to-cyan-900/20 hover:from-teal-100 hover:to-cyan-100 transition-all flex flex-col items-center justify-center gap-2"
                            >
                              <Copy className="w-5 h-5 text-teal-600" />
                              <p className="text-xs font-semibold text-teal-700 dark:text-teal-400">Paste Text</p>
                              <p className="text-xs text-foreground/50">Recommended</p>
                            </button>
                            <button className="p-4 rounded-lg border-2 border-dashed border-border bg-card/50 opacity-50 cursor-not-allowed flex flex-col items-center justify-center gap-2">
                              <Camera className="w-5 h-5 text-foreground/60" />
                              <p className="text-xs font-semibold">Snap Photo</p>
                              <p className="text-xs text-foreground/50">Coming soon</p>
                            </button>
                          </div>
                          <div className="space-y-3">
                            <textarea
                              value={essayText}
                              onChange={(e) => setEssayText(e.target.value)}
                              placeholder="Paste your essay..."
                              className="w-full p-4 rounded-lg border border-border bg-background text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-teal-500 min-h-48 font-mono text-sm"
                            />
                            <div className="flex items-center justify-between text-xs text-foreground/50">
                              <span className="flex items-center gap-2">
                                <span className="font-semibold">{essayText.split(/\s+/).filter(Boolean).length}</span> words
                              </span>
                              <button
                                onClick={handleSubmitEssay}
                                disabled={!essayText || isMarking}
                                className="px-8 py-3 text-white rounded-lg font-bold hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed text-sm flex items-center gap-2 shadow-lg hover:shadow-xl"
                                style={{ background: 'linear-gradient(135deg, #14b8a6 0%, #06b6d4 100%)' }}
                              >
                                {isMarking ? (
                                  <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Marking...
                                  </>
                                ) : (
                                  <>
                                    <Zap className="w-4 h-4" />
                                    Submit Essay
                                  </>
                                )}
                              </button>
                            </div>
                            {markingError && (
                              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 rounded-lg">
                                <p className="text-sm text-red-800 dark:text-red-200">{markingError}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Right Sidebar - AO Breakdown */}
              <div className="p-6 rounded-xl border border-border bg-white dark:bg-gray-900 shadow-lg h-fit">
                <h3 className="font-bold text-sm mb-4 uppercase text-foreground/70 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-teal-600" />
                  Assessment Objectives
                </h3>
                {currentAOs ? (
                  <div className="space-y-3">
                    <div className="bg-gradient-to-r from-blue-50 to-teal-50 dark:from-blue-900/20 dark:to-teal-900/20 rounded-lg p-3 border border-blue-200 dark:border-blue-800">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-blue-900 dark:text-blue-300">Knowledge</span>
                        <span className="text-xs font-semibold text-blue-700 dark:text-blue-400">/ {currentAOs.knowledge}</span>
                      </div>
                      <p className="text-xs text-blue-700 dark:text-blue-300">Economic concepts & definitions</p>
                    </div>
                    <div className="bg-gradient-to-r from-green-50 to-teal-50 dark:from-green-900/20 dark:to-teal-900/20 rounded-lg p-3 border border-green-200 dark:border-green-800">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-green-900 dark:text-green-300">Application</span>
                        <span className="text-xs font-semibold text-green-700 dark:text-green-400">/ {currentAOs.application}</span>
                      </div>
                      <p className="text-xs text-green-700 dark:text-green-300">Context & examples</p>
                    </div>
                    <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg p-3 border border-purple-200 dark:border-purple-800">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-purple-900 dark:text-purple-300">Analysis</span>
                        <span className="text-xs font-semibold text-purple-700 dark:text-purple-400">/ {currentAOs.analysis}</span>
                      </div>
                      <p className="text-xs text-purple-700 dark:text-purple-300">Chains of reasoning (5+ links)</p>
                    </div>
                    <div className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 rounded-lg p-3 border border-orange-200 dark:border-orange-800">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-orange-900 dark:text-orange-300">Evaluation</span>
                        <span className="text-xs font-semibold text-orange-700 dark:text-orange-400">/ {currentAOs.evaluation}</span>
                      </div>
                      <p className="text-xs text-orange-700 dark:text-orange-300">Judgements & weighing up</p>
                    </div>
                    <div className="pt-3 border-t border-border/50 mt-4">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-foreground">Total Marks:</span>
                        <span className="text-lg font-bold text-teal-600">{markAllocation}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-sm text-foreground/50">Select marks to see breakdown</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="max-w-7xl mx-auto grid lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-4">
                <div className="rounded-xl border border-border bg-white dark:bg-gray-900 shadow-lg p-4">
                  <p className="text-xs font-bold uppercase text-foreground/60 mb-1">Question</p>
                  <p className="text-sm text-foreground/80">{essay?.questionText} — ({essay?.markAllocation} marks)</p>
                </div>
                
                {essay?.extractText && (
                  <div className="rounded-xl border border-border bg-white dark:bg-gray-900 shadow-lg p-4">
                    <h3 className="text-sm font-semibold mb-2 text-foreground/70">Extract / Case Study</h3>
                    <p className="text-sm text-foreground/70 italic">{essay.extractText}</p>
                  </div>
                )}

                {essay?.markingResult?.analysisChains && essay.markingResult.analysisChains.length > 0 && (
                  <div className="rounded-xl border border-blue-200 dark:border-blue-800 bg-gradient-to-br from-blue-50 to-teal-50 dark:from-blue-900/20 dark:to-teal-900/20 p-6">
                    <h3 className="text-sm font-bold uppercase text-blue-900 dark:text-blue-300 mb-3 flex items-center gap-2">
                      <Zap className="w-4 h-4" />
                      Analysis Chains Found
                    </h3>
                    <div className="space-y-3">
                      {essay.markingResult.analysisChains.map((chain: AnalysisChain) => (
                        <button
                          key={chain.id}
                          onClick={() => setSelectedChain(chain)}
                          className={`w-full p-3 rounded-lg border-2 text-left transition hover:shadow-md ${
                            chain.quality === 'strong' ? 'border-green-500 bg-green-50 dark:bg-green-900/20' :
                            chain.quality === 'adequate' ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20' :
                            'border-red-500 bg-red-50 dark:bg-red-900/20'
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <span className="px-2 py-1 bg-blue-600 text-white text-xs font-bold rounded">
                              Chain {chain.id}
                            </span>
                            <span className={`text-xs font-semibold ${
                              chain.quality === 'strong' ? 'text-green-700 dark:text-green-300' :
                              chain.quality === 'adequate' ? 'text-yellow-700 dark:text-yellow-300' :
                              'text-red-700 dark:text-red-300'
                            }`}>
                              {chain.chain.length} links
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-foreground/70">
                            {chain.chain.map((link, idx) => (
                              <span key={idx} className="flex items-center gap-1">
                                <span className="font-medium">{link}</span>
                                {idx < chain.chain.length - 1 && <span className="text-blue-500">→</span>}
                              </span>
                            ))}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="rounded-xl border border-border bg-white dark:bg-gray-900 shadow-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold uppercase text-foreground/70">Your Essay</h3>
                    <div className="flex items-center gap-4 text-xs">
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-3 bg-green-500 rounded"></div>
                        <span className="text-foreground/60">Strong</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-3 bg-yellow-500 rounded"></div>
                        <span className="text-foreground/60">Adequate</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-3 bg-red-500 rounded"></div>
                        <span className="text-foreground/60">Weak</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-sm leading-loose">{renderHighlightedEssay()}</div>
                  
                  <p className="text-xs text-foreground/50 mt-6 pt-4 border-t border-border">
                    {essay?.essayText.split(/\s+/).filter(Boolean).length} words • Click highlighted text for feedback
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="rounded-xl border border-purple-200 dark:border-purple-800 bg-gradient-to-br from-purple-500/10 to-purple-600/10 backdrop-blur p-6 shadow-lg">
                  <p className="text-xs font-bold uppercase text-foreground/60 mb-2">Estimated Grade</p>
                  <div className="text-6xl font-bold text-purple-600 dark:text-purple-400 mb-2">
                    {essay?.markingResult?.gradeEstimate?.replace('Grade ', '') || 'B'}
                  </div>
                  <p className="text-sm text-foreground/70">This response would likely receive</p>
                </div>

                <div className="rounded-xl border border-green-200 dark:border-green-800 bg-gradient-to-br from-green-500/10 to-green-600/10 backdrop-blur p-6 shadow-lg">
                  <p className="text-xs font-bold uppercase text-foreground/60 mb-2">Estimated Mark</p>
                  <div className="flex items-baseline gap-2 mb-3">
                    <span className="text-5xl font-bold text-foreground">{essay?.overallScore}</span>
                    <span className="text-2xl text-foreground/60">/ {essay?.markAllocation}</span>
                  </div>
                  <div className="w-full h-3 bg-border/30 rounded-full overflow-hidden mb-2">
                    <div
                      className="h-full bg-gradient-to-r from-green-500 to-green-600 transition-all duration-1000 rounded-full"
                      style={{ width: `${((essay?.overallScore || 0) / (essay?.markAllocation || 25)) * 100}%` }}
                    />
                  </div>
                  <p className="text-xs text-foreground/60">{essay?.markingResult?.level} • {Math.round(((essay?.overallScore || 0) / (essay?.markAllocation || 25)) * 100)}%</p>
                </div>

                <div className="rounded-xl border border-border bg-white dark:bg-gray-900 shadow-lg p-6">
                  <p className="text-sm font-bold uppercase text-foreground/70 mb-4">Where You Scored</p>
                  {essay?.aoScores && (
                    <div className="space-y-3">
                      {Object.entries(essay.aoScores).map(([ao, score]) => {
                        const aoNames: Record<string, string> = {
                          ao1: 'Knowledge',
                          ao2: 'Application',
                          ao3: 'Analysis',
                          ao4: 'Evaluation'
                        }
                        const aoKey = ao.toUpperCase()
                        const aoName = aoNames[ao] || ao
                        const currentAOTotal = currentAOs ? (currentAOs as any)[aoName.toLowerCase()] : 5
                        const percentage = (score / currentAOTotal) * 100
                        return (
                          <div key={ao}>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-bold text-foreground/70">{aoKey} • {aoName}</span>
                              <span className="text-xs font-semibold text-foreground">{score}/{currentAOTotal}</span>
                            </div>
                            <div className="w-full h-2 bg-border/30 rounded-full overflow-hidden">
                              <div
                                className={`h-full transition-all duration-1000 rounded-full ${
                                  percentage >= 80 ? 'bg-green-500' :
                                  percentage >= 60 ? 'bg-yellow-500' :
                                  'bg-red-500'
                                }`}
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>

                {essay?.markingResult?.strengths && essay.markingResult.strengths.length > 0 && (
                  <div className="rounded-xl border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 p-6 shadow-lg">
                    <p className="text-sm font-bold text-green-800 dark:text-green-300 mb-3 flex items-center gap-2">
                      <span className="text-lg">✓</span> Strengths
                    </p>
                    <ul className="space-y-2">
                      {essay.markingResult.strengths.map((strength: string, idx: number) => (
                        <li key={idx} className="text-xs text-green-900 dark:text-green-200 flex items-start gap-2 leading-relaxed">
                          <span className="text-green-600 dark:text-green-400 shrink-0 font-bold mt-0.5">•</span>
                          <span>{strength}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {essay?.markingResult?.improvements && essay.markingResult.improvements.length > 0 && (
                  <div className="rounded-xl border border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-900/20 p-6 shadow-lg">
                    <p className="text-sm font-bold text-orange-800 dark:text-orange-300 mb-3 flex items-center gap-2">
                      <span className="text-lg">→</span> Areas for Improvement
                    </p>
                    <ul className="space-y-2">
                      {essay.markingResult.improvements.map((improvement: string, idx: number) => (
                        <li key={idx} className="text-xs text-orange-900 dark:text-orange-200 flex items-start gap-2 leading-relaxed">
                          <span className="text-orange-600 dark:text-orange-400 shrink-0 font-bold mt-0.5">•</span>
                          <span>{improvement}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <button
                  onClick={() => {
                    setHasEssay(false)
                    setEssay(null)
                    setQuestionText("")
                    setMarkAllocation("")
                    setExtractText("")
                    setEssayText("")
                    setQuestionExpanded(true)
                    setExtractExpanded(false)
                    setEssayExpanded(false)
                    setSelectedHighlight(null)
                    setSelectedChain(null)
                  }}
                  className="w-full px-4 py-3 text-white rounded-xl font-bold hover:opacity-90 transition text-sm shadow-lg hover:shadow-xl"
                  style={{ background: 'linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)' }}
                >
                  Submit Another Essay
                </button>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Upgrade Modal */}
      {showUpgradeModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4" onClick={() => setShowUpgradeModal(false)}>
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-md w-full p-8 border-2 border-teal-500" onClick={(e) => e.stopPropagation()}>
            <div className="text-center mb-6">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: 'linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)' }}>
                <AlertCircle className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-2">Free Trial Complete!</h3>
              <p className="text-foreground/60">You've used all 3 of your free essays. Upgrade to Pro for unlimited marking.</p>
            </div>
            
            <div className="bg-gradient-to-br from-teal-50 to-teal-100 dark:from-teal-900/20 dark:to-teal-900/30 rounded-xl p-6 mb-6 border border-teal-200 dark:border-teal-800">
              <p className="text-sm font-bold text-foreground mb-3">Pro Includes:</p>
              <ul className="space-y-2 text-sm text-foreground/70">
                <li className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-teal-600" />
                  <span>Unlimited essays</span>
                </li>
                <li className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-teal-600" />
                  <span>Full interactive feedback</span>
                </li>
                <li className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-teal-600" />
                  <span>Smart improvements</span>
                </li>
                <li className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-teal-600" />
                  <span>Model answers</span>
                </li>
              </ul>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowUpgradeModal(false)}
                className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-700 text-foreground rounded-lg font-semibold hover:bg-gray-100 dark:hover:bg-gray-800 transition"
              >
                Maybe Later
              </button>
              <button
                onClick={() => router.push('/#pricing')}
                className="flex-1 px-4 py-3 text-white rounded-lg font-semibold hover:opacity-90 transition shadow-lg"
                style={{ background: 'linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)' }}
              >
                Upgrade Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Loading Overlay */}
      {isMarking && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[100]">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4">
            <div className="text-center mb-6">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse" style={{ background: 'linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)' }}>
                <Loader2 className="w-8 h-8 text-white animate-spin" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">Marking Your Essay</h3>
              <p className="text-sm text-foreground/60">Our AI examiner is analyzing your work...</p>
            </div>
            <div className="space-y-3">
              <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full transition-all duration-500 rounded-full"
                  style={{ 
                    width: `${markingProgress}%`,
                    background: 'linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)'
                  }}
                />
              </div>
              <p className="text-xs text-center text-foreground/60">{Math.round(markingProgress)}% complete</p>
            </div>
            <div className="mt-6 space-y-2">
              <div className="flex items-center gap-2 text-xs text-foreground/50">
                <div className="w-1.5 h-1.5 bg-teal-500 rounded-full animate-pulse"></div>
                <span>Analyzing knowledge & understanding...</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-foreground/50">
                <div className="w-1.5 h-1.5 bg-teal-500 rounded-full animate-pulse"></div>
                <span>Identifying chains of analysis...</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-foreground/50">
                <div className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-pulse"></div>
                <span>Evaluating arguments & judgements...</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sentence Feedback Popup */}
      {selectedHighlight && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4" onClick={() => setSelectedHighlight(null)}>
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl max-w-2xl w-full p-6 border-2 border-teal-500" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <span className={`px-3 py-1 rounded-lg text-sm font-bold ${
                  selectedHighlight.quality === 'strong' ? 'bg-green-500 text-white' :
                  selectedHighlight.quality === 'adequate' ? 'bg-yellow-500 text-white' :
                  'bg-red-500 text-white'
                }`}>
                  {selectedHighlight.ao}
                </span>
                <span className={`text-xs font-semibold uppercase ${
                  selectedHighlight.quality === 'strong' ? 'text-green-600' :
                  selectedHighlight.quality === 'adequate' ? 'text-yellow-600' :
                  'text-red-600'
                }`}>
                  {selectedHighlight.quality}
                </span>
                {selectedHighlight.chainId && (
                  <span className="px-2 py-1 bg-blue-500 text-white text-xs font-bold rounded">
                    Chain {selectedHighlight.chainId}
                  </span>
                )}
              </div>
              <button onClick={() => setSelectedHighlight(null)} className="p-1 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-lg transition">
                <X className="w-5 h-5 text-foreground/60" />
              </button>
            </div>

            <div className={`p-4 rounded-lg mb-4 border-l-4 ${
              selectedHighlight.quality === 'strong' ? 'bg-green-50 dark:bg-green-900/20 border-green-500' :
              selectedHighlight.quality === 'adequate' ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-500' :
              'bg-red-50 dark:bg-red-900/20 border-red-500'
            }`}>
              <p className="text-sm text-foreground italic leading-relaxed">"{selectedHighlight.text}"</p>
            </div>

            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
              <p className="text-xs font-semibold text-foreground/60 uppercase mb-2">Feedback</p>
              <p className="text-sm text-foreground leading-relaxed">{selectedHighlight.feedback}</p>
            </div>

            <div className="mt-4 flex justify-end">
              <button onClick={() => setSelectedHighlight(null)} className="px-4 py-2 text-white rounded-lg text-sm font-semibold hover:opacity-90 transition" style={{ background: 'linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)' }}>
                Got it
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Chain Feedback Popup */}
      {selectedChain && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4" onClick={() => setSelectedChain(null)}>
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl max-w-3xl w-full p-6 border-2 border-blue-500" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 bg-blue-600 text-white text-sm font-bold rounded-lg">
                  Chain {selectedChain.id}
                </span>
                <span className={`text-xs font-semibold uppercase ${
                  selectedChain.quality === 'strong' ? 'text-green-600' :
                  selectedChain.quality === 'adequate' ? 'text-yellow-600' :
                  'text-red-600'
                }`}>
                  {selectedChain.quality} • {selectedChain.chain.length} links
                </span>
              </div>
              <button onClick={() => setSelectedChain(null)} className="p-1 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-lg transition">
                <X className="w-5 h-5 text-foreground/60" />
              </button>
            </div>

            <div className="bg-gradient-to-r from-blue-50 to-teal-50 dark:from-blue-900/20 dark:to-teal-900/20 rounded-lg p-6 mb-4 border border-blue-200 dark:border-blue-800">
              <div className="flex flex-wrap items-center gap-3">
                {selectedChain.chain.map((link, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <div className="px-3 py-2 bg-white dark:bg-gray-800 rounded-lg border border-blue-300 dark:border-blue-700 shadow-sm">
                      <p className="text-sm font-medium text-foreground">{link}</p>
                    </div>
                    {idx < selectedChain.chain.length - 1 && (
                      <span className="text-blue-600 text-xl font-bold">→</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
              <p className="text-xs font-semibold text-foreground/60 uppercase mb-2">Analysis</p>
              <p className="text-sm text-foreground leading-relaxed">{selectedChain.feedback}</p>
            </div>

            <div className="mt-4 flex justify-end">
              <button onClick={() => setSelectedChain(null)} className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-semibold hover:opacity-90 transition">
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}