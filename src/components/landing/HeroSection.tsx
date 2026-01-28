"use client";

import Link from "next/link";
import { ArrowRight, Sparkles, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { ComparisonSliderDemo } from "./ComparisonSliderDemo";

export function HeroSection() {
  return (
    <section className="relative pt-28 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
      {/* Background Gradient Mesh */}
      <div className="absolute inset-0 bg-mesh opacity-60" />

      <div className="relative max-w-7xl mx-auto">
        <div className="text-center max-w-4xl mx-auto">
          {/* Badge */}
          <motion.div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6 glass glass-border"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Sparkles className="h-4 w-4" />
            AI-Powered Virtual Staging
          </motion.div>

          {/* Headline */}
          <motion.h1
            className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground tracking-tight font-heading"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            Transform empty rooms into{" "}
            <motion.span
              className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-primary to-primary/70"
              initial={{ backgroundPosition: "0% 50%" }}
              animate={{ backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }}
              transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
              style={{
                backgroundSize: "200% 200%",
                backgroundImage:
                  "linear-gradient(90deg, var(--primary), oklch(0.6 0.22 280), var(--primary))",
              }}
            >
              stunning staged spaces
            </motion.span>{" "}
            in seconds
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            Help your clients visualize their future home with AI-powered virtual staging.
            Upload a photo, pick a style, and get professionally staged images instantly.
          </motion.p>

          {/* CTAs */}
          <motion.div
            className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <Button
              size="lg"
              asChild
              className="w-full sm:w-auto group relative overflow-hidden animate-glow-pulse"
            >
              <Link href="/signup">
                <span className="relative z-10 flex items-center">
                  Start Staging Free
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </span>
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              asChild
              className="w-full sm:w-auto glass glass-border hover:bg-accent/50"
            >
              <Link href="/login" className="flex items-center">
                <Play className="mr-2 h-4 w-4" />
                Watch Demo
              </Link>
            </Button>
          </motion.div>

          {/* Trust Text */}
          <motion.p
            className="mt-4 text-sm text-muted-foreground"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            No credit card required &bull; 10 free staging credits
          </motion.p>
        </div>

        {/* Comparison Slider */}
        <motion.div
          className="mt-16 max-w-5xl mx-auto"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.6 }}
        >
          <ComparisonSliderDemo
            beforeImage="/images/landing/hero-before.jpg"
            afterImage="/images/landing/hero-after.jpg"
            beforeLabel="Empty Room"
            afterLabel="AI Staged"
          />
        </motion.div>

        {/* Trust Badge */}
        <motion.div
          className="mt-12 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.8 }}
        >
          <p className="text-sm text-muted-foreground">
            Trusted by <span className="font-semibold text-foreground">500+</span> real estate professionals
          </p>
        </motion.div>
      </div>
    </section>
  );
}
