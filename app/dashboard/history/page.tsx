"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { LogOut, Settings, ArrowLeft, Calendar, BookOpen, Zap } from "lucide-react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"

interface EssayHistory {
  id: string
  question: string
  marks: number
  score: number
  date: string
  theme: string
}

const mockHistoryEssays: EssayHistory[] = [
  {
    id: "1",
    question: "Explain how supply and demand interact to determine market equilibrium",
    marks: 25,
    score: 18,
    date: "2025-01-08",
    theme: "Microeconomics",
  },
  {
    id: "2",
    question: "Analyze the effects of an increase in interest rates on the economy",
    marks: 20,
    score: 15,
    date: "2025-01-07",
    theme: "Macroeconomics",
  },
  {
    id: "3",
    question: "Evaluate the advantages and disadvantages of free trade",
    marks: 25,
    score: 19,
    date: "2025-01-06",
    theme: "Global Economics",
  },
  {
    id: "4",
    question: "Discuss the impact of inflation on consumers and businesses",
    marks: 15,
    score: 11,
    date: "2025-01-05",
    theme: "Macroeconomics",
  },
]

export default function HistoryPage() {
  const router = useRouter()
  const [essays, setEssays] = useState<EssayHistory[]>(mockHistoryEssays)

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

  const averageScore =
    essays.length > 0 ? ((essays.reduce((sum, e) => sum + e.score / e.marks, 0) / essays.length) * 100).toFixed(1) : 0

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/30 bg-card/30 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 hover:opacity-70 transition">
            <div className="w-9 h-9 bg-gradient-teal-accent rounded-lg flex items-center justify-center text-white font-bold text-sm">
              EA
            </div>
            <h1 className="font-bold text-lg">EconAI</h1>
          </Link>
          <div className="flex items-center gap-2">
            <button className="p-2 hover:bg-muted rounded-lg transition">
              <Settings className="w-5 h-5" />
            </button>
            <button onClick={handleLogout} className="p-2 hover:bg-muted rounded-lg transition">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* Back Button */}
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-teal-accent hover:text-teal-accent/80 transition mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm font-semibold">Back to Dashboard</span>
        </Link>

        {/* Page Title */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Essay History</h1>
          <p className="text-foreground/60">Track your progress across all submitted essays</p>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <div className="p-6 rounded-lg border border-border bg-gradient-to-br from-card/80 to-card/40 backdrop-blur">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold text-foreground/60">Essays Submitted</p>
              <BookOpen className="w-4 h-4 text-teal-accent" />
            </div>
            <p className="text-2xl font-bold">{essays.length}</p>
          </div>
          <div className="p-6 rounded-lg border border-border bg-gradient-to-br from-card/80 to-card/40 backdrop-blur">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold text-foreground/60">Average Score</p>
              <Zap className="w-4 h-4 text-teal-accent" />
            </div>
            <p className="text-2xl font-bold">{averageScore}%</p>
          </div>
          <div className="p-6 rounded-lg border border-border bg-gradient-to-br from-card/80 to-card/40 backdrop-blur">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold text-foreground/60">Best Score</p>
              <Zap className="w-4 h-4 text-green-500" />
            </div>
            <p className="text-2xl font-bold">
              {essays.length > 0 ? Math.max(...essays.map((e) => (e.score / e.marks) * 100)).toFixed(0) : 0}%
            </p>
          </div>
        </div>

        {/* Essays List */}
        <div className="space-y-3">
          <h2 className="text-sm font-bold uppercase text-foreground/60 mb-4">Recent Submissions</h2>
          {essays.map((essay) => (
            <button
              key={essay.id}
              className="w-full p-4 rounded-lg border border-border bg-card/50 hover:bg-card/70 transition text-left group"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <p className="font-semibold text-foreground mb-1 group-hover:text-teal-accent transition">
                    {essay.question}
                  </p>
                  <p className="text-xs text-foreground/50">{essay.theme}</p>
                </div>
                <div className="text-right ml-4">
                  <p className="text-sm font-bold">
                    {essay.score}/{essay.marks}
                  </p>
                  <p className="text-xs text-foreground/50">{Math.round((essay.score / essay.marks) * 100)}%</p>
                </div>
              </div>
              <div className="flex items-center justify-between text-xs text-foreground/50">
                <div className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {new Date(essay.date).toLocaleDateString()}
                </div>
                <div className="w-24 h-1.5 bg-border/30 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-teal-accent"
                    style={{ width: `${(essay.score / essay.marks) * 100}%` }}
                  />
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Empty State */}
        {essays.length === 0 && (
          <div className="text-center py-12">
            <BookOpen className="w-12 h-12 text-foreground/20 mx-auto mb-4" />
            <p className="text-foreground/60 mb-4">No essays submitted yet</p>
            <Link
              href="/dashboard"
              className="inline-block px-4 py-2 bg-teal-accent text-white rounded-lg text-sm font-semibold hover:bg-teal-accent/90 transition"
            >
              Start Your First Essay
            </Link>
          </div>
        )}
      </main>
    </div>
  )
}
