"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { TrendingUp, BookOpen, Zap, Award, ArrowRight, Settings, LogOut, Sparkles, Plus, BookMarked } from "lucide-react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"

export default function HomePage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [isPremium, setIsPremium] = useState(false)
  const [stats, setStats] = useState({
    totalEssays: 0,
    averageScore: 0,
    recentGrade: 'N/A'
  })

  useEffect(() => {
    const loadData = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push("/auth/login")
        return
      }
      
      setUser(user)
      
      // Check premium
      const { data: profileData } = await supabase
        .from('profiles')
        .select('is_premium')
        .eq('id', user.id)
        .single()
      
      setIsPremium(profileData?.is_premium || false)
      
      // Load stats
      const { data: essays } = await supabase
        .from('essays')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_marked', true)

      if (essays && essays.length > 0) {
        const { data: feedbacks } = await supabase
          .from('essay_feedback')
          .select('total_score, grade_prediction')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })

        if (feedbacks && feedbacks.length > 0) {
          const avg = feedbacks.reduce((sum, f) => sum + (f.total_score || 0), 0) / feedbacks.length
          setStats({
            totalEssays: essays.length,
            averageScore: Math.round(avg),
            recentGrade: feedbacks[0]?.grade_prediction?.replace('Grade ', '') || 'N/A'
          })
        } else {
          setStats({ totalEssays: essays.length, averageScore: 0, recentGrade: 'N/A' })
        }
      }
    }
    loadData()
  }, [router])

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50/30 via-cyan-50/20 to-gray-50 dark:from-gray-900 dark:to-gray-800">
      <header className="border-b border-border/30 bg-white/50 dark:bg-gray-900/50 backdrop-blur sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 hover:opacity-70 transition">
            <h1 className="font-bold text-xl">EconAI</h1>
          </Link>
          <div className="flex items-center gap-3">
            {isPremium && (
              <div className="px-3 py-1 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-600" />
                <span className="text-xs font-semibold text-purple-700 dark:text-purple-400">Pro Member</span>
              </div>
            )}
            <button 
              onClick={() => router.push("/dashboard/settings")}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition"
            >
              <Settings className="w-5 h-5" />
            </button>
            <button 
              onClick={handleLogout}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-8 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Welcome back!</h1>
          <p className="text-foreground/60">Ready to improve your economics grades?</p>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <div className="p-6 rounded-xl border border-border bg-white dark:bg-gray-900 shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold text-foreground/60">Total Essays</p>
              <BookOpen className="w-5 h-5 text-teal-600" />
            </div>
            <p className="text-3xl font-bold">{stats.totalEssays}</p>
            <p className="text-xs text-foreground/50 mt-2">Essays submitted and marked</p>
          </div>
          <div className="p-6 rounded-xl border border-border bg-white dark:bg-gray-900 shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold text-foreground/60">Average Score</p>
              <Zap className="w-5 h-5 text-teal-600" />
            </div>
            <p className="text-3xl font-bold">{stats.averageScore > 0 ? `${stats.averageScore}%` : 'N/A'}</p>
            <p className="text-xs text-foreground/50 mt-2">Across all marked essays</p>
          </div>
          <div className="p-6 rounded-xl border border-border bg-white dark:bg-gray-900 shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold text-foreground/60">Recent Grade</p>
              <Award className="w-5 h-5 text-teal-600" />
            </div>
            <p className="text-3xl font-bold">{stats.recentGrade}</p>
            <p className="text-xs text-foreground/50 mt-2">From your latest essay</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 gap-6">
          <button
            onClick={() => router.push("/dashboard")}
            className="p-8 rounded-xl border-2 border-teal-500 bg-gradient-to-br from-teal-50 to-cyan-50 dark:from-teal-900/20 dark:to-cyan-900/20 hover:shadow-xl transition-all group text-left"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-teal-500 flex items-center justify-center">
                <Plus className="w-6 h-6 text-white" />
              </div>
              <ArrowRight className="w-6 h-6 text-teal-600 group-hover:translate-x-1 transition-transform" />
            </div>
            <h3 className="text-xl font-bold mb-2">New Essay</h3>
            <p className="text-foreground/60 text-sm">Get instant AI feedback on your economics essay</p>
          </button>

          <button
            disabled
            className="p-8 rounded-xl border-2 border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 opacity-50 cursor-not-allowed text-left relative"
          >
            <div className="absolute top-4 right-4">
              <span className="px-3 py-1 bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs font-bold rounded-full">
                Coming Soon
              </span>
            </div>
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-gray-400 flex items-center justify-center">
                <BookMarked className="w-6 h-6 text-white" />
              </div>
            </div>
            <h3 className="text-xl font-bold mb-2 text-foreground/50">Question Bank</h3>
            <p className="text-foreground/40 text-sm">Practice with past paper questions</p>
          </button>
        </div>
      </main>
    </div>
  )
}