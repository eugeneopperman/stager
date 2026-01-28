"use client";

import { motion } from "framer-motion";
import { AnimatedCounter } from "./AnimatedCounter";
import { ScrollReveal } from "./ScrollReveal";
import { Star } from "lucide-react";

const stats = [
  { value: 10000, suffix: "+", label: "Stagings" },
  { value: 500, suffix: "+", label: "Agents" },
  { value: 4.9, decimals: 1, label: "Rating", icon: Star },
];

export function StatsSection() {
  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8 bg-muted/30">
      <div className="max-w-7xl mx-auto">
        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-8 mb-16">
          {stats.map((stat, index) => (
            <ScrollReveal
              key={stat.label}
              delay={index * 0.1}
              className="text-center"
            >
              <motion.div
                className="inline-flex items-center justify-center"
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
              >
                <span className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground font-heading">
                  <AnimatedCounter
                    value={stat.value}
                    suffix={stat.suffix}
                    decimals={stat.decimals}
                  />
                </span>
                {stat.icon && (
                  <stat.icon className="ml-1 h-6 w-6 sm:h-8 sm:w-8 text-amber-500 fill-amber-500" />
                )}
              </motion.div>
              <p className="mt-2 text-sm sm:text-base text-muted-foreground">
                {stat.label}
              </p>
            </ScrollReveal>
          ))}
        </div>

        {/* Testimonial */}
        <ScrollReveal delay={0.3}>
          <div className="max-w-3xl mx-auto">
            <motion.blockquote
              className="relative p-8 rounded-2xl bg-card/60 glass glass-border text-center"
              whileHover={{ scale: 1.01 }}
              transition={{ type: "spring", stiffness: 400, damping: 20 }}
            >
              {/* Quote marks */}
              <div className="absolute -top-4 left-8 text-6xl text-primary/20 font-serif">
                &ldquo;
              </div>

              <p className="text-lg sm:text-xl text-foreground italic leading-relaxed">
                Stager transformed how I present listings. My properties sell 30% faster now.
                The AI staging is indistinguishable from professional photography.
              </p>

              <footer className="mt-6 flex items-center justify-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-primary-foreground font-semibold">
                  SM
                </div>
                <div className="text-left">
                  <p className="font-semibold text-foreground">Sarah Mitchell</p>
                  <p className="text-sm text-muted-foreground">Real Estate Agent, Austin TX</p>
                </div>
              </footer>
            </motion.blockquote>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
