"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, User, CreditCard, LogOut, Sparkles, Zap } from "lucide-react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"

export default function SettingsPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [isPremium, setIsPremium] = useState(false)

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push("/auth/login")
      } else {
        setUser(user)
        
        // Check premium status
        const { data: profileData } = await supabase
          .from('profiles')
          .select('is_premium')
          .eq('id', user.id)
          .single()
        
        setIsPremium(profileData?.is_premium || false)
      }
    }
    checkAuth()
  }, [router])

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50/30 via-cyan-50/20 to-gray-50 dark:from-gray-900 dark:to-gray-800">
      <header className="border-b border-border/30 bg-white/50 dark:bg-gray-900/50 backdrop-blur sticky top-0 z-40 shadow-sm">
        <div className="max-w-4xl mx-auto px-8 h-16 flex items-center justify-between">
          <Link href="/dashboard/home" className="flex items-center gap-2 hover:opacity-70 transition">
            <ArrowLeft className="w-5 h-5" />
            <span className="font-semibold">Back to Dashboard</span>
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-8 py-12">
        <h1 className="text-3xl font-bold mb-8">Settings</h1>

        <div className="space-y-4">
          {/* Account Section */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-border shadow-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <User className="w-5 h-5 text-teal-600" />
              <h2 className="text-xl font-bold">Account</h2>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-semibold text-foreground/70">Email</label>
                <p className="text-foreground">{user?.email}</p>
              </div>
              <div>
                <label className="text-sm font-semibold text-foreground/70">Plan</label>
                <div className="flex items-center gap-2">
                  {isPremium ? (
                    <>
                      <Sparkles className="w-4 h-4 text-purple-600" />
                      <p className="text-foreground font-semibold">Pro Plan</p>
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4 text-teal-600" />
                      <p className="text-foreground">Free Plan</p>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Subscription Section */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-border shadow-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <CreditCard className="w-5 h-5 text-teal-600" />
              <h2 className="text-xl font-bold">Subscription</h2>
            </div>
            {isPremium ? (
              <div className="space-y-3">
                <p className="text-foreground/70">Status: <span className="font-semibold text-green-600">Active ✓</span></p>
                <button className="px-4 py-2 border border-red-500 text-red-600 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition">
                  Cancel Subscription
                </button>
              </div>
            ) : (
              <div>
                <p className="text-foreground/70 mb-4">You're on the free plan</p>
                <button
                  onClick={() => router.push('/#pricing')}
                  className="px-6 py-2 text-white rounded-lg font-semibold hover:opacity-90 transition shadow-lg"
                  style={{ background: 'linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)' }}
                >
                  Upgrade to Pro
                </button>
              </div>
            )}
          </div>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="w-full px-4 py-3 border-2 border-red-500 text-red-600 rounded-lg font-semibold hover:bg-red-50 dark:hover:bg-red-900/20 transition flex items-center justify-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            Log Out
          </button>
        </div>
      </main>
    </div>
  )
}