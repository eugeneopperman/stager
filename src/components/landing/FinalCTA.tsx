"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { ScrollReveal } from "./ScrollReveal";

export function FinalCTA() {
  return (
    <section className="relative py-24 px-4 sm:px-6 lg:px-8 overflow-hidden">
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-mesh opacity-80" />

      <div className="relative max-w-3xl mx-auto text-center">
        <ScrollReveal>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground font-heading">
            Ready to stage your first property?
          </h2>
        </ScrollReveal>

        <ScrollReveal delay={0.1}>
          <p className="mt-6 text-lg text-muted-foreground">
            Get 10 free staging credits. No credit card required.
          </p>
        </ScrollReveal>

        <ScrollReveal delay={0.2}>
          <motion.div
            className="mt-10"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Button
              size="lg"
              asChild
              className="text-lg px-8 py-6 animate-glow-pulse"
            >
              <Link href="/signup" className="flex items-center">
                Start Staging Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </motion.div>
        </ScrollReveal>

        {/* Decorative Elements */}
        <motion.div
          className="absolute -left-20 top-1/2 -translate-y-1/2 w-40 h-40 rounded-full bg-primary/10 blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute -right-20 top-1/2 -translate-y-1/2 w-40 h-40 rounded-full bg-primary/10 blur-3xl"
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.5, 0.3, 0.5],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </div>
    </section>
  );
}
