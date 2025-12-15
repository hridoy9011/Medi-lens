"use client"

import { RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ExtractedDataCard } from "@/components/extracted-data-card"
import type { AnalysisState } from "@/lib/types"

interface ResultsSectionProps {
  state: AnalysisState
  onClear: () => void
}

export function ResultsSection({ state, onClear }: ResultsSectionProps) {
  if (state.step !== "complete" || !state.extractedData) {
    return null
  }

  const { extractedData } = state

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
                </div>
              </div>
            </div>
          )}

          <ExtractedDataCard data={extractedData} />
        </div>

        {/* Right column - Risk Summary */}
        <div className="space-y-6"></div>
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
