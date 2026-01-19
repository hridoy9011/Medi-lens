"use client"

import { FileText, Download, ShieldCheck, AlertTriangle, AlertCircle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import type { AnalysisState } from "@/lib/types"

interface SafetyReportProps {
  state: AnalysisState
}

export function SafetyReport({ state }: SafetyReportProps) {
  if (state.step !== "complete" || !state.extractedData || !state.authenticity) {
    return null
  }

  const { extractedData, authenticity, interactions } = state

  const severeInteractions = interactions.filter((i) => i.severity === "severe")
  const moderateInteractions = interactions.filter((i) => i.severity === "moderate")

  const overallRisk = severeInteractions.length > 0 ? "high" : moderateInteractions.length > 0 ? "moderate" : "low"

  const riskConfig = {
    low: {
      icon: ShieldCheck,
      label: "Low Risk",
      color: "text-success",
      bg: "bg-success/10",
    },
    moderate: {
      icon: AlertTriangle,
      label: "Moderate Risk",
      color: "text-warning",
      bg: "bg-warning/10",
    },
    high: {
      icon: AlertCircle,
      label: "High Risk",
      color: "text-destructive",
      bg: "bg-destructive/10",
    },
  }

  const config = riskConfig[overallRisk]
  const RiskIcon = config.icon

  const generateReportText = () => {
    let report = `MEDILENS SAFETY REPORT\n`
    report += `Generated: ${new Date().toLocaleString()}\n\n`
    report += `${"=".repeat(50)}\n\n`

    report += `PRESCRIPTION DETAILS\n`
    report += `-`.repeat(30) + `\n`
    if (extractedData.doctor) report += `Doctor: ${extractedData.doctor}\n`
    if (extractedData.hospital) report += `Hospital: ${extractedData.hospital}\n`
    if (extractedData.date) report += `Date: ${extractedData.date}\n`
    report += `\n`

    report += `MEDICATIONS\n`
    report += `-`.repeat(30) + `\n`
    extractedData.medicines.forEach((med, i) => {
      report += `${i + 1}. ${med.name}`
      if (med.dose) report += ` - ${med.dose}`
      if (med.frequency) report += ` (${med.frequency})`
      report += `\n`
    })
    report += `\n`

    report += `AUTHENTICITY CHECK\n`
    report += `-`.repeat(30) + `\n`
    report += `Status: ${authenticity.authenticity.toUpperCase()}\n`
    authenticity.reasons.forEach((reason) => {
      report += `• ${reason}\n`
    })
    report += `\n`

    report += `DRUG INTERACTIONS\n`
    report += `-`.repeat(30) + `\n`
    if (interactions.length === 0) {
      report += `No significant interactions found.\n`
    } else {
      interactions.forEach((int) => {
        report += `• ${int.drug_a} + ${int.drug_b}: ${int.severity.toUpperCase()}\n`
        if (int.description) report += `  ${int.description}\n`
      })
    }
    report += `\n`

    report += `OVERALL RISK ASSESSMENT: ${overallRisk.toUpperCase()}\n`
    report += `\n`
    report += `${"=".repeat(50)}\n`
    report += `This report is AI-generated and should not replace professional medical advice.\n`

    return report
  }

  const handleDownload = () => {
    const report = generateReportText()
    const blob = new Blob([report], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `medilens-report-${Date.now()}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <Card className="border-2 border-primary/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            Safety Report Summary
          </CardTitle>
          <Button variant="outline" size="sm" onClick={handleDownload}>
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className={cn("flex items-center gap-4 p-4 rounded-lg", config.bg)}>
          <RiskIcon className={cn("h-8 w-8", config.color)} />
          <div>
            <p className={cn("font-semibold text-lg", config.color)}>{config.label}</p>
            <p className="text-sm text-muted-foreground">Overall prescription safety assessment</p>
          </div>
        </div>

        <Separator />

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="text-center p-3 rounded-lg bg-muted/50">
            <p className="text-2xl font-bold text-foreground">{extractedData.medicines.length}</p>
            <p className="text-xs text-muted-foreground">Medications</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-muted/50">
            <p
              className={cn(
                "text-2xl font-bold",
                authenticity.authenticity === "genuine"
                  ? "text-success"
                  : authenticity.authenticity === "suspicious"
                    ? "text-warning"
                    : "text-destructive",
              )}
            >
              {authenticity.authenticity.charAt(0).toUpperCase() + authenticity.authenticity.slice(1)}
            </p>
            <p className="text-xs text-muted-foreground">Authenticity</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-muted/50">
            <p
              className={cn(
                "text-2xl font-bold",
                severeInteractions.length > 0
                  ? "text-destructive"
                  : moderateInteractions.length > 0
                    ? "text-warning"
                    : "text-success",
              )}
            >
              {severeInteractions.length + moderateInteractions.length}
            </p>
            <p className="text-xs text-muted-foreground">Interactions</p>
          </div>
        </div>

        <div className="p-3 rounded-lg bg-muted/30 text-xs text-muted-foreground">
          <p className="flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <span>
              This report is generated by AI for informational purposes only. Always consult a qualified healthcare
              professional before making any medical decisions.
            </span>
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
