"use client";

import {
  LandingNav,
  LandingFooter,
  HeroSection,
  FeatureCards,
  StyleGallery,
  HowItWorks,
  StatsSection,
  RoomTypes,
  PricingPreview,
  FinalCTA,
} from "@/components/landing";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <LandingNav />
      <main>
        <HeroSection />
        <FeatureCards />
        <StyleGallery />
        <HowItWorks />
        <StatsSection />
        <RoomTypes />
        <PricingPreview />
        <FinalCTA />
      </main>
      <LandingFooter />
    </div>
  );
}
