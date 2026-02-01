"use client"

import { RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ExtractedDataCard } from "@/components/extracted-data-card"
import { AuthenticityCard } from "@/components/authenticity-card"
import { InteractionsCard } from "@/components/interactions-card"
import { DiagnosisAnalysis } from "@/components/diagnosis-analysis"
import { RiskMeter } from "@/components/risk-meter"
import type { AnalysisState } from "@/lib/types"

interface ResultsSectionProps {
  state: AnalysisState
  onClear: () => void
}

export function ResultsSection({ state, onClear }: ResultsSectionProps) {
  if (state.step !== "complete" || !state.extractedData || !state.authenticity) {
    return null
  }

  const { extractedData, authenticity, interactions } = state
  const severeInteractions = interactions.filter((i) => i.severity === "severe")
  const moderateInteractions = interactions.filter((i) => i.severity === "moderate")
  const overallRisk = severeInteractions.length > 0 ? "high" : moderateInteractions.length > 0 ? "moderate" : "low"

  return (
    <div className="space-y-6">
      <div className="grid lg:grid-cols-[1fr,320px] gap-6">
        {/* Left column - Results */}
        <div className="space-y-6">
          {/* Prescription Header Card */}
          {state.imageUrl && (
            <div className="rounded-2xl bg-card border shadow-lg p-6">
              <div className="flex flex-col sm:flex-row gap-6">
                <div className="w-full sm:w-32 h-32 rounded-xl overflow-hidden bg-muted flex-shrink-0">
                  <img
                    src={state.imageUrl || "/placeholder.svg"}
                    alt="Prescription"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 space-y-3">
                  <div>
                    {extractedData.doctor && (
                      <p className="text-lg font-semibold text-foreground">{extractedData.doctor}</p>
                    )}
                    {extractedData.hospital && (
                      <p className="text-sm text-muted-foreground">{extractedData.hospital}</p>
                    )}
                    {extractedData.date && <p className="text-sm text-muted-foreground">{extractedData.date}</p>}
                  </div>
                  <AuthenticityBadge status={authenticity.authenticity} />
                </div>
              </div>
            </div>
          )}

          <ExtractedDataCard data={extractedData} />
          {state.diagnosisAnalysis && <DiagnosisAnalysis analysis={state.diagnosisAnalysis} />}
          <InteractionsCard interactions={interactions} />
          {state.authenticity && <AuthenticityCard result={state.authenticity} />}
        </div>

        {/* Right column - Risk Summary */}
        <div className="space-y-6">
          <RiskMeter
            risk={overallRisk}
            medicationCount={extractedData.medicines.length}
            interactionCount={severeInteractions.length + moderateInteractions.length}
            authenticity={authenticity.authenticity}
          />
        </div>
      </div>

      <div className="flex justify-center pt-4">
        <Button variant="outline" onClick={onClear} className="gap-2 bg-transparent rounded-xl px-8 py-6 text-base">
          <RotateCcw className="h-5 w-5" />
          Analyze Another Prescription
        </Button>
      </div>
    </div>
  )
}

function AuthenticityBadge({ status }: { status: "genuine" | "suspicious" | "fake" }) {
  const config = {
    genuine: { label: "Authentic", bg: "bg-success/10", text: "text-success", border: "border-success/30" },
    suspicious: { label: "Uncertain", bg: "bg-warning/10", text: "text-warning", border: "border-warning/30" },
    fake: { label: "Suspicious", bg: "bg-destructive/10", text: "text-destructive", border: "border-destructive/30" },
  }

  const c = config[status] || config.suspicious

  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${c.bg} ${c.text} ${c.border}`}
    >
      {c.label}
    </span>
  )
}
