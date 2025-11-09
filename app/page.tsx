"use client"

import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { ChevronRight, BookOpen, TrendingUp, Zap, Award, BarChart3, LogOut } from "lucide-react"
import { useEffect, useState } from "react"

export default function LandingPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
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
            <span className="font-bold text-lg">EconAI</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm hover:text-teal-accent transition">
              Features
            </a>
            <a href="#pricing" className="text-sm hover:text-teal-accent transition">
              Pricing
            </a>
            <a href="#faq" className="text-sm hover:text-teal-accent transition">
              FAQ
            </a>
          </div>
          <div className="flex items-center gap-3">
            {!isLoading && (
              <>
                {user ? (
                  <>
                    <button
                      onClick={() => router.push("/dashboard")}
                      className="px-4 py-2 text-sm font-medium hover:text-teal-accent transition"
                    >
                      Dashboard
                    </button>
                    <button
                      onClick={handleLogout}
                      className="px-4 py-2 text-sm font-medium hover:text-teal-accent transition flex items-center gap-2"
                    >
                      <LogOut className="w-4 h-4" />
                      Logout
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => router.push("/auth/login")}
                      className="px-4 py-2 text-sm font-medium hover:text-teal-accent transition"
                    >
                      Sign In
                    </button>
                    <button
                      onClick={() => router.push("/auth/sign-up")}
                      className="px-4 py-2 bg-teal-accent text-white rounded-lg font-medium hover:opacity-90 transition"
                    >
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
        <div className="grid md:grid-cols-2 gap-12 items-center">
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
              Get instant, exam-board specific feedback on your Edexcel A Economics essays. Interactive annotations, AO
              breakdowns, and grade predictions powered by AI.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={() => router.push(user ? "/dashboard" : "/auth/sign-up")}
                className="px-8 py-3 bg-teal-accent text-white rounded-lg font-semibold hover:opacity-90 transition flex items-center justify-center gap-2"
              >
                {user ? "Go to Dashboard" : "Start Free Trial"} <ChevronRight className="w-4 h-4" />
              </button>
              <button className="px-8 py-3 border border-teal-accent/30 text-teal-dark rounded-lg font-semibold hover:bg-teal-light transition">
                Watch Demo
              </button>
            </div>
            <p className="text-xs text-foreground/50 mt-6">No credit card required. 3 free essays to start.</p>
          </div>

          {/* Hero Illustration */}
          <div className="relative h-96 md:h-full hidden md:block">
            <div className="absolute inset-0 bg-gradient-to-br from-teal-light/40 to-cyan-100/30 rounded-2xl"></div>
            <div className="absolute inset-4 bg-white rounded-xl shadow-2xl border border-teal-light/50 p-6 overflow-hidden">
              <div className="space-y-4">
                <div className="h-3 bg-teal-light rounded w-3/4"></div>
                <div className="h-3 bg-teal-light rounded w-full"></div>
                <div className="h-3 bg-teal-light rounded w-5/6"></div>
                <div className="mt-6 space-y-2">
                  <div className="h-2 bg-teal-accent/20 rounded w-1/2"></div>
                  <div className="h-2 bg-teal-accent/20 rounded w-2/3"></div>
                </div>
              </div>
              <div className="absolute bottom-4 right-4 w-12 h-12 bg-gradient-teal-accent rounded-lg flex items-center justify-center text-white text-lg font-bold">
                A8
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
            },
            {
              icon: BarChart3,
              title: "Interactive Feedback",
              description: "Click any sentence to see strengths, weaknesses, and specific improvements.",
            },
            {
              icon: Award,
              title: "Model Answers",
              description: "Access Grade A examples with annotated explanations of why they excel.",
            },
            {
              icon: TrendingUp,
              title: "Progress Tracking",
              description: "Track your improvement across concepts and predict your final grade.",
            },
            {
              icon: Zap,
              title: "Smart Improvements",
              description: "AI rewrites weak sentences to be more analytical and evaluative.",
            },
            {
              icon: ChevronRight,
              title: "Question Bank",
              description: "Practice with past paper questions organized by topic and difficulty.",
            },
          ].map((feature, i) => (
            <div
              key={i}
              className="p-6 rounded-xl bg-white/50 border border-teal-light/30 hover:border-teal-accent/50 hover:shadow-lg transition group"
            >
              <div className="w-12 h-12 bg-gradient-teal-accent rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition">
                <feature.icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
              <p className="text-sm text-foreground/60">{feature.description}</p>
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
              features: ["3 essays per month", "Basic marking", "AO breakdown", "Free support"],
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
              className={`p-8 rounded-xl border transition ${
                plan.popular
                  ? "bg-gradient-teal-accent text-white border-teal-accent shadow-2xl scale-105"
                  : "bg-white/50 border-teal-light/30 hover:border-teal-accent/50"
              }`}
            >
              {plan.popular && (
                <div className="inline-block px-3 py-1 bg-white/20 rounded-full text-xs font-semibold mb-4">
                  Most Popular
                </div>
              )}
              <h3 className={`text-2xl font-bold mb-2 ${plan.popular ? "" : ""}`}>{plan.name}</h3>
              <div className="mb-6">
                <span className="text-4xl font-bold">{plan.price}</span>
                {plan.period && (
                  <span className={plan.popular ? "text-white/70" : "text-foreground/60"}>{plan.period}</span>
                )}
              </div>
              <button
                className={`w-full py-2 rounded-lg font-semibold mb-6 transition ${
                  plan.popular
                    ? "bg-white text-teal-accent hover:bg-white/90"
                    : "border border-teal-accent text-teal-accent hover:bg-teal-light"
                }`}
              >
                Get Started
              </button>
              <ul className={`space-y-3 text-sm ${plan.popular ? "text-white/90" : "text-foreground/70"}`}>
                {plan.features.map((feature, j) => (
                  <li key={j} className="flex items-center gap-2">
                    <ChevronRight className="w-4 h-4 flex-shrink-0" />
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
          className="px-8 py-4 bg-teal-accent text-white rounded-lg font-semibold text-lg hover:opacity-90 transition"
        >
          {user ? "Go to Dashboard" : "Start Your Free Trial"}
        </button>
      </section>

      {/* Footer */}
      <footer className="border-t border-teal-light/20 mt-20 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-6 h-6 bg-gradient-teal-accent rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-white" />
                </div>
                <span className="font-bold">EconAI</span>
              </div>
              <p className="text-sm text-foreground/60">Instant economics essay marking for Edexcel A.</p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-foreground/60">
                <li>
                  <a href="#" className="hover:text-teal-accent transition">
                    Features
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-teal-accent transition">
                    Pricing
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-teal-accent transition">
                    FAQ
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-foreground/60">
                <li>
                  <a href="#" className="hover:text-teal-accent transition">
                    About
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-teal-accent transition">
                    Blog
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-teal-accent transition">
                    Contact
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-foreground/60">
                <li>
                  <a href="#" className="hover:text-teal-accent transition">
                    Privacy
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-teal-accent transition">
                    Terms
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-teal-light/20 pt-8 text-center text-sm text-foreground/60">
            <p>&copy; 2025 EconAI. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
