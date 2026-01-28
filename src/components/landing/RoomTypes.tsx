"use client";

import { motion } from "framer-motion";
import { ScrollReveal, StaggerContainer, StaggerItem } from "./ScrollReveal";
import {
  Sofa,
  BedDouble,
  UtensilsCrossed,
  Baby,
  ChefHat,
  Briefcase,
  Bath,
  TreePine,
  Users,
} from "lucide-react";

const roomTypes = [
  { icon: Sofa, label: "Living Room" },
  { icon: BedDouble, label: "Bedroom" },
  { icon: UtensilsCrossed, label: "Dining Room" },
  { icon: Baby, label: "Kids Room" },
  { icon: ChefHat, label: "Kitchen" },
  { icon: Briefcase, label: "Home Office" },
  { icon: Bath, label: "Bathroom" },
  { icon: TreePine, label: "Outdoor" },
  { icon: Users, label: "Guest Room" },
];

export function RoomTypes() {
  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <ScrollReveal className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground font-heading">
            Stage any room in your listing
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            From living rooms to outdoor spaces, we&apos;ve got you covered
          </p>
        </ScrollReveal>

        {/* Room Type Pills */}
        <StaggerContainer
          className="flex flex-wrap justify-center gap-3"
          staggerDelay={0.05}
        >
          {roomTypes.map((room) => (
            <StaggerItem key={room.label}>
              <motion.div
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-card/60 glass glass-border text-foreground"
                whileHover={{
                  scale: 1.05,
                  backgroundColor: "var(--accent)",
                }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: "spring", stiffness: 400, damping: 20 }}
              >
                <room.icon className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">{room.label}</span>
              </motion.div>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  );
}
