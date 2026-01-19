"use client"

import { CheckCircle2, Circle, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import type { HealthReportState } from "@/lib/types"

interface HealthAnalysisProgressProps {
  state: HealthReportState
}

const steps = [
  { key: "uploading", label: "Uploading Report", description: "Processing image" },
  { key: "analyzing", label: "Running Analysis", description: "Extracting test results" },
] as const

type StepKey = (typeof steps)[number]["key"]

function getStepStatus(currentStep: HealthReportState["step"], stepKey: StepKey): "complete" | "current" | "pending" {
  const stepOrder: StepKey[] = ["uploading", "analyzing"]
  const currentIndex = stepOrder.indexOf(currentStep as StepKey)
  const stepIndex = stepOrder.indexOf(stepKey)

  if (currentStep === "complete") return "complete"
  if (currentStep === "error" || currentStep === "idle") {
    return "pending"
  }

  if (stepIndex < currentIndex) return "complete"
  if (stepIndex === currentIndex) return "current"
  return "pending"
}

export function HealthAnalysisProgress({ state }: HealthAnalysisProgressProps) {
  if (state.step === "idle" || state.step === "complete") return null

  return (
    <div className="rounded-3xl bg-card border shadow-lg p-8 space-y-8">
      <div className="text-center">
        <h3 className="text-xl font-semibold text-foreground mb-2">Analyzing Health Report</h3>
        <p className="text-sm text-muted-foreground">Please wait while we process your lab report</p>
      </div>

      <div className="space-y-4 max-w-md mx-auto">
        {steps.map((step, index) => {
          const status = getStepStatus(state.step, step.key)

          return (
            <div key={step.key} className="flex items-center gap-4">
              <div className="flex flex-col items-center">
                {status === "complete" ? (
                  <div className="h-8 w-8 rounded-full bg-success/10 flex items-center justify-center">
                    <CheckCircle2 className="h-5 w-5 text-success" />
                  </div>
                ) : status === "current" ? (
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Loader2 className="h-5 w-5 text-primary animate-spin" />
                  </div>
                ) : (
                  <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                    <Circle className="h-5 w-5 text-muted-foreground/40" />
                  </div>
                )}
                {index < steps.length - 1 && (
                  <div className={cn("w-0.5 h-6 mt-1", status === "complete" ? "bg-success" : "bg-border")} />
                )}
              </div>
              <div className="flex-1">
                <p
                  className={cn(
                    "font-medium",
                    status === "complete" && "text-success",
                    status === "current" && "text-primary",
                    status === "pending" && "text-muted-foreground",
                  )}
                >
                  {status === "complete" && "[Done] "}
                  {step.label}
                </p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Pulse animation */}
      <div className="flex justify-center pt-4">
        <div className="flex items-center gap-2">
          <div className="animate-pulse h-3 w-3 bg-primary rounded-full"></div>
          <span className="text-sm text-muted-foreground">Processing...</span>
        </div>
      </div>
    </div>
  )
}
