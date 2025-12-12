"use client"

import { ArrowDown, Scan, Shield } from "lucide-react"
import { Button } from "@/components/ui/button"

export function HeroSection() {
  const scrollToUpload = () => {
    document.getElementById("upload")?.scrollIntoView({ behavior: "smooth" })
  }

  return (
    <section className="relative overflow-hidden">
      {/* Background with medical-themed gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-primary/10" />
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fillRule='evenodd'%3E%3Cg fill='%232563EB' fillOpacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      <div className="relative container mx-auto px-4 py-16 md:py-24">
        <div className="max-w-4xl mx-auto">
          {/* Hero Card */}
          <div className="bg-card/80 backdrop-blur-xl rounded-3xl p-8 md:p-12 shadow-xl border border-border/50">
            <div className="flex flex-col lg:flex-row gap-8 items-center">
              {/* Left: Text Content */}
              <div className="flex-1 text-center lg:text-left space-y-6">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
                  <Shield className="h-4 w-4" />
                  AI-Powered Medical Safety
                </div>

                <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-foreground text-balance">
                  Scan Prescriptions. <span className="text-primary">Detect Risks.</span> Stay Safe.
                </h1>

                <p className="text-lg text-muted-foreground max-w-xl text-pretty">
                  MediLens instantly extracts medicines, detects fake prescriptions, and warns you about dangerous drug
                  interactions.
                </p>

                <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
                  <Button
                    size="lg"
                    className="rounded-xl py-6 px-8 text-base font-semibold shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all"
                    onClick={scrollToUpload}
                  >
                    <Scan className="h-5 w-5 mr-2" />
                    Upload Prescription
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    className="rounded-xl py-6 px-8 text-base font-semibold bg-transparent"
                    onClick={scrollToUpload}
                  >
                    Try Demo
                  </Button>
                </div>
              </div>

              {/* Right: Illustration */}
              <div className="flex-shrink-0 hidden lg:block">
                <div className="relative w-64 h-64">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-success/20 rounded-3xl animate-pulse" />
                  <div className="absolute inset-4 bg-card rounded-2xl shadow-lg flex items-center justify-center">
                    <div className="text-center space-y-3">
                      <div className="w-20 h-20 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center">
                        <Scan className="h-10 w-10 text-primary" />
                      </div>
                      <p className="text-sm font-medium text-muted-foreground">AI Analysis Ready</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Scroll indicator */}
          <div className="flex justify-center mt-8">
            <button
              onClick={scrollToUpload}
              className="flex flex-col items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
            >
              <span className="text-xs font-medium">Start Analysis</span>
              <ArrowDown className="h-4 w-4 animate-bounce" />
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
