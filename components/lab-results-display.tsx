"use client"

import { HealthReportAnalysis, LabTestResult, AbnormalityAnalysis } from "@/lib/types"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DietRecommendations } from "@/components/diet-recommendations"
import { AlertCircle, CheckCircle2, Info } from "lucide-react"

interface LabResultsDisplayProps {
  analysis: HealthReportAnalysis
}

export function LabResultsDisplay({ analysis }: LabResultsDisplayProps) {
  if (!analysis || !analysis.extractedData) {
    return <div className="text-muted-foreground">No analysis data available</div>
  }

  return (
    <div className="space-y-6">
      {/* Patient Information */}
      <Card className="border border-border bg-card">
        <CardHeader className="space-y-1 pb-3">
          <CardTitle className="text-lg">Patient Information</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Patient Name:</span>
            <span className="font-medium">{analysis.extractedData.patientName || "Not found"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Test Date:</span>
            <span className="font-medium">{analysis.extractedData.testDate || "Not found"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Lab Name:</span>
            <span className="font-medium">{analysis.extractedData.labName || "Not found"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Doctor:</span>
            <span className="font-medium">{analysis.extractedData.doctorName || "Not found"}</span>
          </div>
        </CardContent>
      </Card>

      {/* Test Results */}
      <Card className="border border-border bg-card">
        <CardHeader className="space-y-1 pb-3">
          <CardTitle className="text-lg">Lab Test Results</CardTitle>
          <CardDescription>All extracted test values and their status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {analysis.extractedData.testResults && analysis.extractedData.testResults.length > 0 ? (
              analysis.extractedData.testResults.map((test, index) => (
                <TestResultRow key={index} test={test} />
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No test results found</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Abnormalities */}
      {analysis.abnormalities.length > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader className="space-y-1 pb-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-orange-600" />
              <CardTitle className="text-lg text-orange-900">Abnormal Results</CardTitle>
            </div>
            <CardDescription className="text-orange-800">Tests that fall outside normal ranges</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {analysis.abnormalities.map((abn, index) => (
              <AbnormalityCard key={index} abnormality={abn} />
            ))}
          </CardContent>
        </Card>
      )}

      {/* Health Assessment */}
      <Card className="border border-border bg-card">
        <CardHeader className="space-y-1 pb-3">
          <div className="flex items-center gap-2">
            <Info className="h-5 w-5 text-blue-600" />
            <CardTitle className="text-lg">Overall Health Assessment</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
            {analysis.overallHealthAssessment}
          </p>
        </CardContent>
      </Card>

      {/* Diet Recommendations - Always Show */}
      <Card className="border-2 border-green-300 bg-green-50">
        <CardHeader className="space-y-1 pb-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🥗</span>
            <CardTitle className="text-lg text-green-900">Dietary Recommendations</CardTitle>
          </div>
          <CardDescription className="text-green-800">Personalized nutrition advice based on your lab results</CardDescription>
        </CardHeader>
        <CardContent>
          {analysis.dietRecommendations && analysis.dietRecommendations.length > 0 ? (
            <DietRecommendations recommendations={analysis.dietRecommendations} />
          ) : (
            <div className="space-y-3 rounded-lg bg-white p-4">
              <p className="text-sm text-foreground font-medium">General Health Recommendations:</p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex gap-2">
                  <span className="text-green-600">✓</span>
                  <span>Maintain a balanced diet with fruits, vegetables, whole grains, and lean proteins</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-green-600">✓</span>
                  <span>Stay hydrated by drinking at least 8 glasses of water daily</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-green-600">✓</span>
                  <span>Exercise regularly for at least 30 minutes per day</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-green-600">✓</span>
                  <span>Consult with a nutritionist for personalized dietary guidance</span>
                </li>
              </ul>
              <p className="text-xs text-muted-foreground mt-4 italic">Note: For specific dietary recommendations based on abnormalities, ensure all test values are clearly visible in the report.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function TestResultRow({ test }: { test: LabTestResult }) {
  const statusConfig: Record<string, { color: string; icon: any }> = {
    normal: { color: "bg-green-100 text-green-800", icon: CheckCircle2 },
    low: { color: "bg-yellow-100 text-yellow-800", icon: AlertCircle },
    high: { color: "bg-orange-100 text-orange-800", icon: AlertCircle },
    abnormal: { color: "bg-red-100 text-red-800", icon: AlertCircle },
  }

  const status = test.status || "abnormal"
  const config = statusConfig[status] || statusConfig.abnormal
  const StatusIcon = config.icon

  return (
    <div className="space-y-2 rounded-lg border border-border bg-muted/50 p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <p className="font-medium text-foreground">{test.testName}</p>
          <p className="text-xs text-muted-foreground">Normal Range: {test.normalRange} {test.unit}</p>
        </div>
        <Badge className={config.color}>
          <StatusIcon className="mr-1 h-3 w-3" />
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </Badge>
      </div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Your Value:</span>
        <span className="font-semibold text-foreground">
          {test.value} {test.unit}
        </span>
      </div>
    </div>
  )
}

function AbnormalityCard({ abnormality }: { abnormality: AbnormalityAnalysis }) {
  const severityConfig: Record<string, { color: string }> = {
    mild: { color: "text-yellow-700 bg-yellow-50 border-yellow-200" },
    moderate: { color: "text-orange-700 bg-orange-50 border-orange-200" },
    severe: { color: "text-red-700 bg-red-50 border-red-200" },
  }

  const severity = abnormality.severity || "moderate"
  const config = severityConfig[severity] || severityConfig.moderate

  return (
    <div className={`rounded-lg border ${config.color} p-3`}>
      <div className="mb-2 flex items-start justify-between">
        <h4 className="font-semibold">{abnormality.testName}</h4>
        <Badge variant="outline" className={config.color}>
          {severity.charAt(0).toUpperCase() + severity.slice(1)}
        </Badge>
      </div>
      <p className="mb-2 text-sm">{abnormality.abnormality}</p>
      <div>
        <p className="text-xs font-medium opacity-75">Possible Causes:</p>
        <ul className="mt-1 space-y-1 text-xs">
          {abnormality.possibleCauses.map((cause, i) => (
            <li key={i} className="ml-4 list-disc opacity-75">
              {cause}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
