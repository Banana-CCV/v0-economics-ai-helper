"use client"

import { ChevronRight, TrendingUp, Check } from "lucide-react"

export default function BillingPage() {
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
        </div>
      </nav>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Choose Your Plan</h1>
          <p className="text-lg text-foreground/60">Upgrade anytime. No lock-in contracts.</p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {[
            {
              name: "Free",
              price: "£0",
              features: ["3 essays per month", "Basic marking", "AO breakdown", "Free support"],
              cta: "Current Plan",
              popular: false,
            },
            {
              name: "Pro Monthly",
              price: "£7.99",
              period: "/month",
              features: [
                "Unlimited essays",
                "Full interactive feedback",
                "Smart Improvements",
                "Model answers",
                "Advanced dashboard",
                "Priority support",
              ],
              cta: "Upgrade Now",
              popular: true,
            },
            {
              name: "Pro Annual",
              price: "£79.99",
              period: "/year",
              features: ["Everything in Monthly", "Save 2 months", "Exam predictions", "Concept mastery tracking"],
              cta: "Upgrade Now",
              popular: false,
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
              <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
              <div className="mb-6">
                <span className="text-4xl font-bold">{plan.price}</span>
                {plan.period && (
                  <span className={plan.popular ? "text-white/70" : "text-foreground/60"}>{plan.period}</span>
                )}
              </div>
              <button
                className={`w-full py-3 rounded-lg font-semibold mb-6 transition flex items-center justify-center gap-2 ${
                  plan.popular
                    ? "bg-white text-teal-accent hover:bg-white/90"
                    : "border border-teal-accent text-teal-accent hover:bg-teal-light"
                }`}
              >
                {plan.cta}
                {plan.cta !== "Current Plan" && <ChevronRight className="w-4 h-4" />}
              </button>
              <ul className={`space-y-3 text-sm ${plan.popular ? "text-white/90" : "text-foreground/70"}`}>
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

        {/* Stripe Placeholder */}
        <div className="mt-16 max-w-2xl mx-auto p-8 bg-white/50 border border-teal-light rounded-lg">
          <h2 className="text-2xl font-bold mb-4">Payment Method</h2>
          <div className="p-4 border-2 border-dashed border-teal-light rounded-lg text-center text-foreground/60">
            Stripe payment integration placeholder - Will be connected here
          </div>
        </div>

        {/* FAQ */}
        <div className="mt-20 max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold mb-8 text-center">Frequently Asked Questions</h2>
          <div className="space-y-6">
            {[
              {
                q: "Can I cancel anytime?",
                a: "Yes, you can cancel your subscription at any time. No lock-in contracts.",
              },
              {
                q: "Do you offer refunds?",
                a: "We offer a 14-day money-back guarantee if you're not satisfied.",
              },
              {
                q: "What payment methods do you accept?",
                a: "We accept all major credit cards, PayPal, and Apple Pay through Stripe.",
              },
            ].map((item, i) => (
              <div key={i}>
                <h4 className="font-semibold mb-2">{item.q}</h4>
                <p className="text-foreground/60">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
