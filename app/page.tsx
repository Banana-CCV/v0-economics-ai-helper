"use client"

import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { ChevronRight, BookOpen, TrendingUp, Zap, Award, BarChart3, LogOut, Check } from "lucide-react"
import { useEffect, useState } from "react"

export default function LandingPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showDemo, setShowDemo] = useState(false)

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      setIsLoading(false)
    }
    checkAuth()
  }, [])

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    setUser(null)
    router.push("/")
  }

  return (
    <div className="min-h-screen gradient-mesh-bg">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 backdrop-blur-md bg-white/30 border-b border-teal-light/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-teal-accent rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg text-black">EconAI</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm hover:text-teal-accent transition">Features</a>
            <a href="#pricing" className="text-sm hover:text-teal-accent transition">Pricing</a>
            <a href="#faq" className="text-sm hover:text-teal-accent transition">FAQ</a>
          </div>
          <div className="flex items-center gap-3">
            {!isLoading && (
              <>
                {user ? (
                  <>
                    <button onClick={() => router.push("/dashboard")} className="px-4 py-2 text-sm font-medium hover:text-teal-accent transition">
                      Dashboard
                    </button>
                    <button onClick={handleLogout} className="px-4 py-2 text-sm font-medium hover:text-teal-accent transition flex items-center gap-2">
                      <LogOut className="w-4 h-4" />
                      Logout
                    </button>
                  </>
                ) : (
                  <>
                    <button onClick={() => router.push("/auth/login")} className="px-4 py-2 text-sm font-medium hover:text-teal-accent transition">
                      Sign In
                    </button>
                    <button onClick={() => router.push("/auth/sign-up")} className="px-4 py-2 bg-teal-accent text-white rounded-lg font-medium hover:opacity-90 transition shadow-md">
                      Get Started
                    </button>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-light border border-teal-accent/20 mb-6">
              <Zap className="w-4 h-4 text-teal-accent" />
              <span className="text-xs font-medium text-teal-dark">AI-Powered Economics Marking</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold mb-6 text-pretty">
              Your Economics Essay,{" "}
              <span className="bg-gradient-to-r from-teal-accent to-cyan-600 bg-clip-text text-transparent">
                Marked Instantly
              </span>
            </h1>
            <p className="text-lg text-foreground/70 mb-8 text-pretty">
              Get instant, exam-board specific feedback on your Edexcel A Economics essays. Interactive annotations, AO breakdowns, and grade predictions powered by AI.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={() => router.push(user ? "/dashboard" : "/auth/sign-up")}
                className="px-8 py-3 text-white rounded-lg font-semibold hover:opacity-90 transition flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transform hover:scale-105"
                style={{ background: 'linear-gradient(135deg, #14b8a6 0%, #06b6d4 100%)' }}
              >
                {user ? "Go to Dashboard" : "Start Free Trial"} <ChevronRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => setShowDemo(true)}
                className="px-8 py-3 border-2 text-teal-700 dark:text-teal-300 rounded-lg font-semibold transition transform hover:scale-105"
                style={{ borderColor: '#14b8a6' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(135deg, rgba(20, 184, 166, 0.1) 0%, rgba(6, 182, 212, 0.1) 100%)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent'
                }}
              >
                Watch Demo
              </button>
            </div>
            <p className="text-xs text-foreground/50 mt-6">No credit card required. 3 free essays to start.</p>
          </div>

          {/* Hero Showcase - CARDS PROPERLY SPACED */}
          <div className="relative min-h-[700px] hidden md:block">
            <div className="absolute inset-0 flex items-center justify-center">
              {/* Main Card */}
              <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border-2 border-teal-200 dark:border-teal-700 p-6 w-full max-w-md z-10">
                {/* Browser Header */}
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                    <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                    <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                  </div>
                  <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">Essay Feedback • 25 marks</span>
                </div>

                {/* Question */}
                <div className="mb-4 p-3 bg-teal-50 dark:bg-teal-900/20 rounded-lg border border-teal-200 dark:border-teal-800">
                  <p className="text-xs font-bold text-teal-700 dark:text-teal-400 mb-1">Question</p>
                  <p className="text-xs text-gray-800 dark:text-gray-200">Evaluate the use of fiscal policy to reduce unemployment...</p>
                </div>

                {/* Essay with Highlights */}
                <div className="mb-4 space-y-2 text-xs leading-relaxed">
                  <p className="text-gray-700 dark:text-gray-300">
                    <span className="bg-green-100 dark:bg-green-900/30 border-b-2 border-green-500 px-1 rounded">
                      Expansionary fiscal policy can reduce unemployment through the multiplier effect
                    </span>
                    . When the government increases spending...
                  </p>
                  <p className="text-gray-700 dark:text-gray-300">
                    However,{" "}
                    <span className="bg-yellow-100 dark:bg-yellow-900/30 border-b-2 border-yellow-500 px-1 rounded">
                      the effectiveness depends on the type of unemployment
                    </span>
                    . Fiscal policy works best...
                  </p>
                </div>

                {/* Click Hint */}
                <div className="flex items-center gap-2 text-xs text-teal-600 dark:text-teal-400 mb-20 p-2 bg-teal-50 dark:bg-teal-900/20 rounded-lg border border-teal-200 dark:border-teal-800">
                  <div className="w-2 h-2 bg-teal-500 rounded-full animate-pulse"></div>
                  <span className="font-semibold">Click highlighted text for instant, detailed feedback</span>
                </div>

                {/* Bottom Score Card */}
                <div className="rounded-xl p-4 text-white shadow-xl" style={{ background: 'linear-gradient(135deg, #14b8a6 0%, #06b6d4 100%)' }}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs opacity-90 mb-1">Overall Score</p>
                      <p className="text-3xl font-bold">23/25</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs opacity-90 mb-1">Percentage</p>
                      <p className="text-2xl font-bold">92%</p>
                    </div>
                    <div className="w-14 h-14 bg-white/20 backdrop-blur rounded-lg flex items-center justify-center">
                      <TrendingUp className="w-8 h-8" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating Cards - NO OVERLAP */}
              {/* Grade Card - Top Right */}
              <div className="absolute -top-8 -right-12 w-36 bg-white dark:bg-gray-900 rounded-xl shadow-2xl border-2 border-purple-400 dark:border-purple-600 p-3 transform hover:scale-105 transition-transform">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-purple-600 dark:text-purple-400">Grade</span>
                  <Award className="w-3 h-3 text-purple-500" />
                </div>
                <div className="text-4xl font-bold text-purple-600 dark:text-purple-400">A*</div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Top band</div>
              </div>

              {/* AO Card - Left Side */}
              <div className="absolute top-1/4 -left-16 w-40 bg-white dark:bg-gray-900 rounded-xl shadow-2xl border-2 border-green-400 dark:border-green-600 p-3 transform hover:scale-105 transition-transform">
                <p className="text-xs font-bold text-gray-700 dark:text-gray-300 mb-2">Assessment Objectives</p>
                <div className="space-y-1.5">
                  <div>
                    <div className="flex items-center justify-between text-xs mb-0.5">
                      <span className="font-semibold text-gray-600 dark:text-gray-400">AO1</span>
                      <span className="text-green-600 dark:text-green-400 font-bold">5/5</span>
                    </div>
                    <div className="w-full h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div className="h-full w-full bg-green-500 rounded-full"></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between text-xs mb-0.5">
                      <span className="font-semibold text-gray-600 dark:text-gray-400">AO2</span>
                      <span className="text-green-600 dark:text-green-400 font-bold">4/4</span>
                    </div>
                    <div className="w-full h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div className="h-full w-full bg-green-500 rounded-full"></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between text-xs mb-0.5">
                      <span className="font-semibold text-gray-600 dark:text-gray-400">AO3</span>
                      <span className="text-yellow-600 dark:text-yellow-400 font-bold">5/6</span>
                    </div>
                    <div className="w-full h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div className="h-full w-5/6 bg-yellow-500 rounded-full"></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Strength Card - Bottom Right */}
              <div className="absolute -bottom-4 -right-8 w-52 bg-white dark:bg-gray-900 rounded-xl shadow-2xl border-2 border-teal-400 dark:border-teal-600 p-3 transform hover:scale-105 transition-transform">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-5 h-5 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                    <Check className="w-3 h-3 text-green-600 dark:text-green-400" />
                  </div>
                  <span className="text-xs font-bold text-gray-700 dark:text-gray-300">Strength</span>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                  "Excellent use of the multiplier effect with clear chains"
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">Everything You Need</h2>
          <p className="text-lg text-foreground/60 text-pretty max-w-2xl mx-auto">
            Built specifically for Edexcel A Economics with intelligent feedback that mirrors real examiner marking.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              icon: BookOpen,
              title: "AO Breakdown",
              description: "Instant scoring across all four assessment objectives with clear band indicators.",
              color: "from-blue-500 to-teal-500",
            },
            {
              icon: BarChart3,
              title: "Interactive Feedback",
              description: "Click any sentence to see strengths, weaknesses, and specific improvements.",
              color: "from-green-500 to-teal-500",
            },
            {
              icon: Award,
              title: "Model Answers",
              description: "Access Grade A examples with annotated explanations of why they excel.",
              color: "from-purple-500 to-pink-500",
            },
            {
              icon: TrendingUp,
              title: "Progress Tracking",
              description: "Track your improvement across concepts and predict your final grade.",
              color: "from-teal-500 to-cyan-500",
            },
            {
              icon: Zap,
              title: "Smart Improvements",
              description: "AI rewrites weak sentences to be more analytical and evaluative.",
              color: "from-yellow-500 to-orange-500",
            },
            {
              icon: ChevronRight,
              title: "Question Bank",
              description: "Practice with past paper questions organized by topic and difficulty.",
              color: "from-indigo-500 to-purple-500",
            },
          ].map((feature, i) => (
            <div
              key={i}
              className="p-6 rounded-xl bg-white/70 backdrop-blur border border-teal-light/30 hover:border-teal-accent/50 hover:shadow-2xl transition-all duration-300 group transform hover:-translate-y-2"
            >
              <div 
                className={`w-12 h-12 bg-gradient-to-br ${feature.color} rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg`}
              >
                <feature.icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-semibold text-lg mb-2 group-hover:text-teal-600 transition">{feature.title}</h3>
              <p className="text-sm text-foreground/60 leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">Simple, Transparent Pricing</h2>
          <p className="text-lg text-foreground/60">Start free. Upgrade when you're ready.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              name: "Free",
              price: "£0",
              features: ["3 essays per month", "Basic marking", "AO breakdown", "Email support"],
            },
            {
              name: "Pro",
              price: "£7.99",
              period: "/month",
              popular: true,
              features: [
                "Unlimited essays",
                "Full interactive feedback",
                "Smart Improvements",
                "Model answers",
                "Advanced dashboard",
                "Priority support",
              ],
            },
            {
              name: "Annual",
              price: "£79.99",
              period: "/year",
              features: ["Everything in Pro", "Save 2 months", "Exam predictions", "Concept mastery tracking"],
            },
          ].map((plan, i) => (
            <div
              key={i}
              className={`p-8 rounded-xl border-2 transition-all duration-300 transform hover:scale-105 ${
                plan.popular
                  ? "text-white border-teal-400 shadow-2xl scale-105 relative overflow-hidden"
                  : "bg-white/60 backdrop-blur border-teal-light/30 hover:border-teal-accent/50 hover:shadow-xl"
              }`}
              style={plan.popular ? { background: 'linear-gradient(135deg, #0d9488 0%, #0891b2 100%)' } : {}}
            >
              {plan.popular && (
                <>
                  <div className="absolute inset-0 opacity-10" style={{
                    backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(255,255,255,0.2) 0%, transparent 50%)',
                  }}></div>
                  <div className="relative inline-block px-3 py-1 bg-white/20 backdrop-blur rounded-full text-xs font-semibold mb-4 animate-pulse">
                    Most Popular
                  </div>
                </>
              )}
              <h3 className={`text-2xl font-bold mb-2 ${plan.popular ? 'relative' : ''}`}>{plan.name}</h3>
              <div className="mb-6">
                <span className="text-4xl font-bold">{plan.price}</span>
                {plan.period && <span className={plan.popular ? "text-white/80" : "text-foreground/60"}>{plan.period}</span>}
              </div>
              <button
                className={`w-full py-3 rounded-lg font-semibold mb-6 transition-all duration-300 ${
                  plan.popular
                    ? "bg-white text-teal-700 hover:bg-white/90 shadow-lg hover:shadow-xl transform hover:scale-105"
                    : "border-2 text-teal-700 hover:bg-teal-50"
                }`}
                style={!plan.popular ? { borderColor: '#14b8a6' } : {}}
              >
                Get Started
              </button>
              <ul className={`space-y-3 text-sm ${plan.popular ? 'text-white/90 relative' : 'text-foreground/70'}`}>
                {plan.features.map((feature, j) => (
                  <li key={j} className="flex items-center gap-2">
                    <Check className="w-4 h-4 flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <h2 className="text-4xl md:text-5xl font-bold mb-6">Ready to improve your grades?</h2>
        <p className="text-lg text-foreground/60 mb-8">
          Join thousands of students getting A-level economics feedback in seconds.
        </p>
        <button
          onClick={() => router.push(user ? "/dashboard" : "/auth/sign-up")}
          className="px-8 py-4 bg-teal-accent text-white rounded-lg font-semibold text-lg hover:opacity-90 transition shadow-lg hover:shadow-xl"
        >
          {user ? "Go to Dashboard" : "Start Your Free Trial"}
        </button>
      </section>

      {/* Footer */}
      <footer className="border-t border-teal-light/20 mt-20 py-12 bg-white/20 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-6 h-6 bg-gradient-teal-accent rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-white" />
                </div>
                <span className="font-bold text-black">EconAI</span>
              </div>
              <p className="text-sm text-foreground/60">Instant economics essay marking for Edexcel A.</p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-foreground/60">
                <li><a href="#features" className="hover:text-teal-accent transition">Features</a></li>
                <li><a href="#pricing" className="hover:text-teal-accent transition">Pricing</a></li>
                <li><a href="#faq" className="hover:text-teal-accent transition">FAQ</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-foreground/60">
                <li><a href="#" className="hover:text-teal-accent transition">About</a></li>
                <li><a href="#" className="hover:text-teal-accent transition">Blog</a></li>
                <li><a href="#" className="hover:text-teal-accent transition">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-foreground/60">
                <li><a href="#" className="hover:text-teal-accent transition">Privacy</a></li>
                <li><a href="#" className="hover:text-teal-accent transition">Terms</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-teal-light/20 pt-8 text-center text-sm text-foreground/60">
            <p>&copy; 2025 EconAI. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Demo Modal */}
      {showDemo && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[100] p-4" onClick={() => setShowDemo(false)}>
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-2xl w-full p-8" onClick={(e) => e.stopPropagation()}>
            <div className="text-center">
              <h3 className="text-2xl font-bold mb-4">Demo Video Coming Soon!</h3>
              <p className="text-foreground/60 mb-6">We're creating an amazing demo to showcase all features.</p>
              <button
                onClick={() => {
                  setShowDemo(false)
                  router.push(user ? "/dashboard" : "/auth/sign-up")
                }}
                className="px-8 py-3 bg-teal-accent text-white rounded-lg font-bold hover:opacity-90 transition"
              >
                {user ? "Try It Now" : "Start Free Trial"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}