import { Header } from "@/components/header"
import { HeroSection } from "@/components/hero-section"
import { PrescriptionAnalyzer } from "@/components/prescription-analyzer"
import { LabReportAnalyzer } from "@/components/lab-report-analyzer"
import { FeatureCards } from "@/components/feature-cards"

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1">
        <HeroSection />

        <section id="prescriptions" className="container mx-auto px-4 py-12 max-w-5xl">
          <PrescriptionAnalyzer />
        </section>

        <section id="health-reports" className="container mx-auto px-4 py-12 max-w-5xl">
          <LabReportAnalyzer />
        </section>

        <FeatureCards />
      </main>

      <footer className="border-t bg-card py-8">
        <div className="container mx-auto px-4 text-center space-y-2">
          <p className="text-sm font-medium text-foreground">
            Smart Prescription Checker for Safer Medication Decisions.
          </p>
          <p className="text-xs text-muted-foreground">
            MediLens is an AI-powered tool for informational purposes only. Always consult a healthcare professional for
            medical advice.
          </p>
        </div>
      </footer>
    </div>
  )
}
