"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { StaggerContainer, StaggerItem } from "./ScrollReveal";

const styles = [
  {
    id: "modern",
    name: "Modern",
    description: "Clean lines, neutral tones, and contemporary furniture for today's buyer.",
    image: "/styles/modern.svg",
  },
  {
    id: "traditional",
    name: "Traditional",
    description: "Classic elegance with warm woods, rich fabrics, and timeless pieces.",
    image: "/styles/traditional.svg",
  },
  {
    id: "minimalist",
    name: "Minimalist",
    description: "Less is more. Simple, uncluttered spaces that feel open and airy.",
    image: "/styles/minimalist.svg",
  },
  {
    id: "mid-century",
    name: "Mid-Century",
    description: "Retro charm with iconic 50s-60s design elements and organic shapes.",
    image: "/styles/mid-century.svg",
  },
  {
    id: "scandinavian",
    name: "Scandinavian",
    description: "Light, functional, and cozy with natural materials and soft textures.",
    image: "/styles/scandinavian.svg",
  },
  {
    id: "industrial",
    name: "Industrial",
    description: "Urban loft vibes with exposed elements, metal, and raw finishes.",
    image: "/styles/industrial.svg",
  },
  {
    id: "coastal",
    name: "Coastal",
    description: "Beach-inspired with blues, whites, and natural textures.",
    image: "/styles/coastal.svg",
  },
  {
    id: "farmhouse",
    name: "Farmhouse",
    description: "Rustic charm with shiplap, distressed wood, and cozy comfort.",
    image: "/styles/farmhouse.svg",
  },
  {
    id: "luxury",
    name: "Luxury",
    description: "High-end glamour with premium materials and sophisticated details.",
    image: "/styles/luxury.svg",
  },
];

export function StyleGallery() {
  const [selectedStyle, setSelectedStyle] = useState<string | null>(null);
  const selected = styles.find((s) => s.id === selectedStyle);

  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8 bg-muted/30">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground font-heading">
            Pick your perfect style
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            9 designer-curated furniture collections to match any property
          </p>
        </motion.div>

        {/* Style Grid */}
        <StaggerContainer
          className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-9 gap-3 sm:gap-4"
          staggerDelay={0.05}
        >
          {styles.map((style) => (
            <StaggerItem key={style.id}>
              <motion.button
                onClick={() => setSelectedStyle(selectedStyle === style.id ? null : style.id)}
                className={`relative aspect-square w-full rounded-xl p-3 sm:p-4 glass glass-border transition-all ${
                  selectedStyle === style.id
                    ? "ring-2 ring-primary bg-primary/10"
                    : "hover:bg-accent/50"
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: "spring", stiffness: 400, damping: 20 }}
              >
                <div className="relative w-full h-full">
                  <Image
                    src={style.image}
                    alt={style.name}
                    fill
                    className="object-contain p-1"
                  />
                </div>
              </motion.button>
              <p className="mt-2 text-xs sm:text-sm text-center font-medium text-muted-foreground">
                {style.name}
              </p>
            </StaggerItem>
          ))}
        </StaggerContainer>

        {/* Selected Style Details */}
        <AnimatePresence mode="wait">
          {selected && (
            <motion.div
              key={selected.id}
              initial={{ opacity: 0, y: 20, height: 0 }}
              animate={{ opacity: 1, y: 0, height: "auto" }}
              exit={{ opacity: 0, y: -10, height: 0 }}
              transition={{ duration: 0.3, ease: [0.25, 0.4, 0.25, 1] }}
              className="mt-8 overflow-hidden"
            >
              <div className="flex flex-col sm:flex-row items-center gap-6 p-6 rounded-2xl bg-card/60 glass glass-border max-w-2xl mx-auto">
                <div className="relative w-24 h-24 shrink-0">
                  <Image
                    src={selected.image}
                    alt={selected.name}
                    fill
                    className="object-contain"
                  />
                </div>
                <div className="text-center sm:text-left">
                  <h3 className="text-xl font-semibold text-foreground font-heading">
                    {selected.name} Style
                  </h3>
                  <p className="mt-2 text-muted-foreground">
                    {selected.description}
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
