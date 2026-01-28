"use client";

import { Upload, Palette, Download } from "lucide-react";
import { motion } from "framer-motion";
import { ScrollReveal } from "./ScrollReveal";

const steps = [
  {
    icon: Upload,
    title: "Upload",
    description: "Drop your photo or click to upload an empty room image.",
  },
  {
    icon: Palette,
    title: "Style",
    description: "Pick room type and furniture style that fits the property.",
  },
  {
    icon: Download,
    title: "Done!",
    description: "Download your professionally staged photo instantly.",
  },
];

export function HowItWorks() {
  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <ScrollReveal className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground font-heading">
            Stage a room in 3 simple steps
          </h2>
        </ScrollReveal>

        {/* Steps */}
        <div className="relative">
          {/* Connector Line (Desktop) */}
          <div className="hidden md:block absolute top-12 left-1/2 -translate-x-1/2 w-2/3 h-0.5">
            <motion.div
              className="h-full bg-gradient-to-r from-transparent via-primary/30 to-transparent"
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1, delay: 0.5 }}
            />
          </div>

          <div className="grid md:grid-cols-3 gap-12 md:gap-8">
            {steps.map((step, index) => (
              <ScrollReveal
                key={step.title}
                delay={index * 0.15}
                className="text-center relative"
              >
                {/* Step Number Badge */}
                <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center z-10">
                  {index + 1}
                </div>

                {/* Icon Circle */}
                <motion.div
                  className="relative mx-auto w-24 h-24 rounded-2xl bg-card/60 glass glass-border flex items-center justify-center mb-6"
                  whileHover={{ scale: 1.05, rotate: 3 }}
                  transition={{ type: "spring", stiffness: 400, damping: 10 }}
                >
                  <motion.div
                    animate={{
                      y: [0, -4, 0],
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: index * 0.3,
                    }}
                  >
                    <step.icon className="h-10 w-10 text-primary" />
                  </motion.div>
                </motion.div>

                {/* Content */}
                <h3 className="text-xl font-semibold text-foreground mb-2 font-heading">
                  {step.title}
                </h3>
                <p className="text-muted-foreground max-w-xs mx-auto">
                  {step.description}
                </p>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
