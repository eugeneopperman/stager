"use client";

import { Zap, Palette, Layers } from "lucide-react";
import { motion } from "framer-motion";
import { StaggerContainer, StaggerItem } from "./ScrollReveal";

const features = [
  {
    icon: Zap,
    title: "Lightning Fast",
    description: "15-30 seconds per variation. No waiting for manual editing.",
    color: "text-amber-500",
    bgColor: "bg-amber-500/10",
  },
  {
    icon: Palette,
    title: "9 Designer Styles",
    description: "From Modern to Farmhouse. Match any property aesthetic.",
    color: "text-primary",
    bgColor: "bg-primary/10",
  },
  {
    icon: Layers,
    title: "Batch Processing",
    description: "Stage up to 10 rooms at once. Perfect for full listings.",
    color: "text-emerald-500",
    bgColor: "bg-emerald-500/10",
  },
];

export function FeatureCards() {
  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground font-heading">
            Why agents choose Stager
          </h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            Everything you need to create stunning property listings that sell faster
          </p>
        </motion.div>

        {/* Feature Cards */}
        <StaggerContainer className="grid md:grid-cols-3 gap-6 lg:gap-8">
          {features.map((feature) => (
            <StaggerItem key={feature.title}>
              <motion.div
                className="group relative p-8 rounded-2xl bg-card/60 glass glass-border hover-lift"
                whileHover={{ y: -4 }}
                transition={{ type: "spring", stiffness: 400, damping: 20 }}
              >
                {/* Icon */}
                <motion.div
                  className={`h-14 w-14 rounded-xl ${feature.bgColor} flex items-center justify-center mb-6`}
                  whileHover={{ scale: 1.05, rotate: 5 }}
                  transition={{ type: "spring", stiffness: 400, damping: 10 }}
                >
                  <feature.icon className={`h-7 w-7 ${feature.color}`} />
                </motion.div>

                {/* Content */}
                <h3 className="text-xl font-semibold text-foreground mb-3 font-heading">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>

                {/* Hover Glow Effect */}
                <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                  <div className="absolute inset-0 rounded-2xl shadow-glow" />
                </div>
              </motion.div>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  );
}
