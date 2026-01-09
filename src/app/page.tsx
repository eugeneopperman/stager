import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Home,
  ImagePlus,
  Sparkles,
  Clock,
  Shield,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";

const features = [
  {
    icon: Sparkles,
    title: "AI-Powered Staging",
    description:
      "Transform empty rooms into beautifully furnished spaces using cutting-edge AI technology.",
  },
  {
    icon: Clock,
    title: "Instant Results",
    description:
      "Get professionally staged photos in seconds, not days. No waiting for manual editing.",
  },
  {
    icon: Shield,
    title: "Photorealistic Quality",
    description:
      "Our AI creates stunning, realistic staging that looks like professional photography.",
  },
];

const styles = [
  "Modern",
  "Traditional",
  "Minimalist",
  "Mid-Century",
  "Scandinavian",
  "Industrial",
  "Coastal",
  "Farmhouse",
  "Luxury",
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2">
              <Home className="h-8 w-8 text-blue-600" />
              <span className="text-xl font-bold text-slate-900 dark:text-white">
                Stager
              </span>
            </Link>
            <div className="flex items-center gap-4">
              <Button variant="ghost" asChild>
                <Link href="/login">Sign in</Link>
              </Button>
              <Button asChild>
                <Link href="/signup">Get Started</Link>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 text-sm font-medium mb-6">
              <Sparkles className="h-4 w-4" />
              Powered by AI
            </div>
            <h1 className="text-5xl sm:text-6xl font-bold text-slate-900 dark:text-white tracking-tight">
              Virtual staging that{" "}
              <span className="text-blue-600">sells homes faster</span>
            </h1>
            <p className="mt-6 text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
              Transform empty property photos into beautifully staged rooms in
              seconds. Help your clients visualize their future home and close
              deals faster.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button size="lg" asChild className="w-full sm:w-auto">
                <Link href="/signup">
                  Start Staging Free
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                asChild
                className="w-full sm:w-auto"
              >
                <Link href="/login">View Demo</Link>
              </Button>
            </div>
            <p className="mt-4 text-sm text-slate-500">
              No credit card required. 10 free staging credits included.
            </p>
          </div>

          {/* Hero Image Placeholder */}
          <div className="mt-16 relative">
            <div className="aspect-video max-w-5xl mx-auto rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 border border-slate-200 dark:border-slate-700 overflow-hidden shadow-2xl">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <ImagePlus className="h-16 w-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                  <p className="text-slate-400 dark:text-slate-500">
                    Before & After Preview
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-50 dark:bg-slate-900">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white">
              Why real estate agents choose Stager
            </h2>
            <p className="mt-4 text-lg text-slate-600 dark:text-slate-400">
              Everything you need to create stunning property listings
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature) => (
              <Card
                key={feature.title}
                className="border-0 shadow-lg bg-white dark:bg-slate-800"
              >
                <CardContent className="p-8">
                  <div className="h-12 w-12 rounded-lg bg-blue-100 dark:bg-blue-950 flex items-center justify-center mb-6">
                    <feature.icon className="h-6 w-6 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Styles Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white">
              9 stunning furniture styles
            </h2>
            <p className="mt-4 text-lg text-slate-600 dark:text-slate-400">
              Match any property aesthetic with our diverse style options
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            {styles.map((style) => (
              <span
                key={style}
                className="px-4 py-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium"
              >
                {style}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-50 dark:bg-slate-900">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white">
              Stage a room in 3 simple steps
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: "1",
                title: "Upload your photo",
                description: "Take a photo of an empty room or upload an existing one",
              },
              {
                step: "2",
                title: "Choose your style",
                description: "Select the room type and furniture style that fits best",
              },
              {
                step: "3",
                title: "Download & share",
                description: "Get your staged photo instantly, ready for your listing",
              },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="h-16 w-16 rounded-full bg-blue-600 text-white text-2xl font-bold flex items-center justify-center mx-auto mb-6">
                  {item.step}
                </div>
                <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">
                  {item.title}
                </h3>
                <p className="text-slate-600 dark:text-slate-400">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Preview */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <Card className="border-2 border-blue-600 shadow-xl">
            <CardContent className="p-8 sm:p-12 text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 dark:bg-blue-950 text-blue-600 text-sm font-medium mb-6">
                Limited Time Offer
              </div>
              <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">
                Start free, upgrade when you&apos;re ready
              </h2>
              <p className="text-lg text-slate-600 dark:text-slate-400 mb-8">
                Every new account gets 10 free staging credits to try Stager
                risk-free.
              </p>
              <ul className="text-left max-w-sm mx-auto space-y-3 mb-8">
                {[
                  "10 free staging credits",
                  "All 9 furniture styles",
                  "High-resolution downloads",
                  "No watermarks",
                ].map((item) => (
                  <li
                    key={item}
                    className="flex items-center gap-3 text-slate-700 dark:text-slate-300"
                  >
                    <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <Button size="lg" asChild>
                <Link href="/signup">
                  Get Started Free
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 sm:px-6 lg:px-8 border-t border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Home className="h-6 w-6 text-blue-600" />
              <span className="font-bold text-slate-900 dark:text-white">
                Stager
              </span>
            </div>
            <p className="text-sm text-slate-500">
              &copy; {new Date().getFullYear()} Stager. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
