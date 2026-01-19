"use client"

import { Download, ShieldCheck, AlertTriangle, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface RiskMeterProps {
  risk: "low" | "moderate" | "high"
  medicationCount: number
  interactionCount: number
  authenticity: "genuine" | "suspicious" | "fake"
}

export function RiskMeter({ risk, medicationCount, interactionCount, authenticity }: RiskMeterProps) {
  const riskConfig = {
    low: {
      icon: ShieldCheck,
      label: "Low Risk",
      color: "text-success",
      bg: "bg-success",
      gradient: "from-success to-success/50",
      percentage: 25,
    },
    moderate: {
      icon: AlertTriangle,
      label: "Moderate Risk",
      color: "text-warning",
      bg: "bg-warning",
      gradient: "from-warning to-warning/50",
      percentage: 60,
    },
    high: {
      icon: AlertCircle,
      label: "High Risk",
      color: "text-destructive",
      bg: "bg-destructive",
      gradient: "from-destructive to-destructive/50",
      percentage: 90,
    },
  }

  const config = riskConfig[risk]
  const RiskIcon = config.icon

  const handleDownload = () => {
    const report = generateReport()
    const blob = new Blob([report], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `medilens-report-${Date.now()}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  const generateReport = () => {
    return `MEDILENS SAFETY REPORT
Generated: ${new Date().toLocaleString()}

SUMMARY
-------
Overall Risk: ${config.label}
Medications Found: ${medicationCount}
Interactions Detected: ${interactionCount}
Authenticity: ${authenticity.charAt(0).toUpperCase() + authenticity.slice(1)}

---
This report is AI-generated. Always consult a healthcare professional.`
  }

  return (
    <div className="rounded-3xl bg-card border shadow-lg p-8 space-y-6 sticky top-24">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-foreground mb-6">Safety Report</h3>

        {/* Circular Risk Meter */}
        <div className="relative w-40 h-40 mx-auto mb-4">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            {/* Background circle */}
            <circle cx="50" cy="50" r="42" fill="none" stroke="currentColor" strokeWidth="12" className="text-muted" />
            {/* Progress circle */}
            <circle
              cx="50"
              cy="50"
              r="42"
              fill="none"
              stroke="currentColor"
              strokeWidth="12"
              strokeLinecap="round"
              strokeDasharray={`${config.percentage * 2.64} 264`}
              className={config.color}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <RiskIcon className={cn("h-8 w-8 mb-1", config.color)} />
            <span className={cn("text-sm font-bold", config.color)}>{config.label}</span>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="space-y-3">
        <div className="flex items-center justify-between p-3 rounded-xl bg-muted/50">
          <span className="text-sm text-muted-foreground">Medications</span>
          <span className="text-lg font-bold text-foreground">{medicationCount}</span>
        </div>
        <div className="flex items-center justify-between p-3 rounded-xl bg-muted/50">
          <span className="text-sm text-muted-foreground">Interactions</span>
          <span className={cn("text-lg font-bold", interactionCount > 0 ? "text-warning" : "text-success")}>
            {interactionCount}
          </span>
        </div>
        <div className="flex items-center justify-between p-3 rounded-xl bg-muted/50">
          <span className="text-sm text-muted-foreground">Authenticity</span>
          <span
            className={cn(
              "text-sm font-semibold",
              authenticity === "genuine" && "text-success",
              authenticity === "suspicious" && "text-warning",
              authenticity === "fake" && "text-destructive",
            )}
          >
            {authenticity.charAt(0).toUpperCase() + authenticity.slice(1)}
          </span>
        </div>
      </div>

      {/* Download Button */}
      <Button className="w-full rounded-xl py-6 font-semibold shadow-lg shadow-primary/25" onClick={handleDownload}>
        <Download className="h-5 w-5 mr-2" />
        Download PDF Report
      </Button>

      <p className="text-xs text-center text-muted-foreground">AI-generated report for informational purposes only.</p>
    </div>
  )
}
