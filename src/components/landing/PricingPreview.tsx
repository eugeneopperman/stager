"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Check, Star } from "lucide-react";
import { ScrollReveal, StaggerContainer, StaggerItem } from "./ScrollReveal";

const plans = [
  {
    name: "Free",
    price: "$0",
    period: "",
    credits: "5 credits",
    description: "Try it out",
    features: ["5 free staging credits", "All 9 furniture styles", "Standard quality"],
    cta: "Try Free",
    href: "/signup",
    popular: false,
  },
  {
    name: "Pro",
    price: "$29",
    period: "/month",
    credits: "150 credits",
    description: "For active agents",
    features: [
      "150 credits/month",
      "All 9 furniture styles",
      "High-resolution downloads",
      "Batch processing",
      "Priority support",
    ],
    cta: "Get Started",
    href: "/signup?plan=pro",
    popular: true,
  },
  {
    name: "Enterprise",
    price: "$99",
    period: "/month",
    credits: "500 credits",
    description: "For teams",
    features: [
      "500 credits/month",
      "Everything in Pro",
      "Team member access",
      "API access",
      "Dedicated support",
    ],
    cta: "Contact Us",
    href: "/contact",
    popular: false,
  },
];

const creditPacks = [
  { credits: 10, price: "$5", value: "$0.50/credit" },
  { credits: 25, price: "$10", value: "$0.40/credit", popular: true },
  { credits: 50, price: "$17.50", value: "$0.35/credit", best: true },
];

export function PricingPreview() {
  return (
    <section id="pricing" className="py-24 px-4 sm:px-6 lg:px-8 bg-muted/30">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <ScrollReveal className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground font-heading">
            Simple, transparent pricing
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Start free, upgrade as you grow
          </p>
        </ScrollReveal>

        {/* Pricing Cards */}
        <StaggerContainer className="grid md:grid-cols-3 gap-6 lg:gap-8 mb-16">
          {plans.map((plan) => (
            <StaggerItem key={plan.name}>
              <motion.div
                className={`relative h-full p-6 lg:p-8 rounded-2xl bg-card/60 glass glass-border ${
                  plan.popular ? "ring-2 ring-primary" : ""
                }`}
                whileHover={{ y: -4 }}
                transition={{ type: "spring", stiffness: 400, damping: 20 }}
              >
                {/* Popular Badge */}
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-primary text-primary-foreground text-xs font-semibold flex items-center gap-1">
                    <Star className="h-3 w-3 fill-current" />
                    Popular
                  </div>
                )}

                {/* Header */}
                <div className="text-center mb-6">
                  <h3 className="text-xl font-semibold text-foreground font-heading">
                    {plan.name}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {plan.description}
                  </p>
                  <div className="mt-4">
                    <span className="text-4xl font-bold text-foreground">
                      {plan.price}
                    </span>
                    <span className="text-muted-foreground">{plan.period}</span>
                  </div>
                  <p className="text-sm text-primary font-medium mt-1">
                    {plan.credits}
                  </p>
                </div>

                {/* Features */}
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span className="text-muted-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <Button
                  asChild
                  className="w-full"
                  variant={plan.popular ? "default" : "outline"}
                >
                  <Link href={plan.href}>{plan.cta}</Link>
                </Button>
              </motion.div>
            </StaggerItem>
          ))}
        </StaggerContainer>

        {/* Credit Packs */}
        <ScrollReveal delay={0.3}>
          <div className="text-center">
            <p className="text-muted-foreground mb-4">
              Or buy credits anytime:
            </p>
            <div className="inline-flex flex-wrap justify-center gap-3">
              {creditPacks.map((pack) => (
                <motion.div
                  key={pack.credits}
                  className={`px-4 py-2 rounded-full glass glass-border text-sm ${
                    pack.best
                      ? "bg-primary/10 text-primary font-medium"
                      : pack.popular
                      ? "bg-accent/50"
                      : ""
                  }`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <span className="font-semibold">{pack.credits} credits</span>
                  <span className="mx-2">for</span>
                  <span className="font-semibold">{pack.price}</span>
                  {pack.best && (
                    <span className="ml-2 text-xs opacity-80">Best Value</span>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
