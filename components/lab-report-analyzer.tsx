"use client"

import { useState, useCallback, useEffect } from "react"
import { RotateCcw, Save, Loader2, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { UploadZone } from "@/components/upload-zone"
import { HealthAnalysisProgress } from "@/components/health-analysis-progress"
import { LabResultsDisplay } from "@/components/lab-results-display"
import { createClient } from "@/lib/supabase/client"
import { saveHealthReport } from "@/lib/supabase/actions"
import type { HealthReportState, HealthReportAnalysis } from "@/lib/types"
import type { User } from "@supabase/supabase-js"

const initialState: HealthReportState = {
  step: "idle",
  imageUrl: null,
  ocrText: null,
  analysis: null,
  error: null,
}

export function LabReportAnalyzer() {
  const [state, setState] = useState<HealthReportState>(initialState)
  const [user, setUser] = useState<User | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      setUser(user)
    }
    getUser()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [supabase])

  const updateState = useCallback((updates: Partial<HealthReportState>) => {
    setState((prev) => ({ ...prev, ...updates }))
  }, [])

  const analyzeReport = useCallback(
    async (imageBase64: string) => {
      updateState({
        step: "uploading",
        imageUrl: imageBase64,
        error: null,
        ocrText: null,
        analysis: null,
      })
      setSaved(false)

      try {
        updateState({ step: "analyzing" })
        const response = await fetch("/api/analyze-health-report", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "analyze-lab-report", imageUrl: imageBase64 }),
        })

        // Handle non-OK responses
        if (!response.ok) {
          let userMessage = "Unable to analyze the image"
          try {
            const errorData = await response.json()
            userMessage = errorData.details || errorData.error || userMessage
            if (errorData.validationMessage && errorData.validationMessage.trim()) {
              userMessage += `\n\n${errorData.validationMessage.trim()}`
            }
          } catch (parseError) {
            console.error("Non-JSON error response:", response.status, response.statusText)
            userMessage = `Server Error (${response.status}): ${response.statusText}. Please try again.`
          }
          throw new Error(userMessage)
        }

        // Parse successful response
        let result
        try {
          result = await response.json()
        } catch (parseError) {
          console.error("[v0] Failed to parse response:", parseError)
          throw new Error("Unable to read the analysis results. Please try again.")
        }

        if (!result.success) {
          // Handle validation errors from successful response
          let errorMessage = result.details || result.error || "Analysis failed"
          if (result.validationMessage && result.validationMessage.trim()) {
            errorMessage += `\n\n${result.validationMessage.trim()}`
          }
          throw new Error(errorMessage)
        }

        const analysisData = result.data
        updateState({
          ocrText: analysisData.rawText,
          analysis: analysisData.analysis,
          step: "complete",
        })
      } catch (error: any) {
        console.error("[v0] Analysis error:", error)
        updateState({
          error: error.message || "Analysis failed",
          step: "error",
        })
      }
    },
    [updateState],
  )

  const handleSave = async () => {
    if (!user || !state.imageUrl || !state.analysis || !state.ocrText) {
      return
    }

    setSaving(true)
    const result = await saveHealthReport({
      imageUrl: state.imageUrl,
      ocrText: state.ocrText,
      analysis: state.analysis,
    })

    if (result.success) {
      setSaved(true)
    } else {
      updateState({ error: result.error })
    }
    setSaving(false)
  }

  const handleReset = () => {
    setState(initialState)
    setSaved(false)
  }

  return (
    <div className="space-y-6 rounded-lg border border-border bg-card p-8">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-foreground">Lab Report Analyzer</h2>
        <p className="text-sm text-muted-foreground">Upload blood test and medical lab reports for AI analysis</p>
      </div>

      {state.step === "idle" && !state.imageUrl && (
        <UploadZone
          onImageSelect={analyzeReport}
          isAnalyzing={false}
          currentImage={state.imageUrl}
          onClear={handleReset}
        />
      )}

      {state.imageUrl && state.step !== "idle" && (
        <>
          <HealthAnalysisProgress state={state} />

          {state.imageUrl && (
            <div className="rounded-lg border border-border bg-muted p-4">
              <img src={state.imageUrl || "/placeholder.svg"} alt="Lab Report" className="max-h-96 w-full rounded object-cover" />
            </div>
          )}

          {state.error && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
              <p className="font-semibold text-amber-900 mb-2">💡 Let's try a different image</p>
              <p className="text-sm text-amber-800 mb-4 whitespace-pre-line">{state.error}</p>
              <Button
                variant="outline"
                size="sm"
                className="bg-transparent border-amber-300 text-amber-900 hover:bg-amber-100"
                onClick={handleReset}
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Upload a Different Image
              </Button>
            </div>
          )}

          {state.step === "complete" && state.analysis && (
            <>
              <LabResultsDisplay analysis={state.analysis} />

              <div className="flex flex-wrap gap-3">
                {user && !saved && (
                  <Button
                    onClick={handleSave}
                    disabled={saving}
                    className="gap-2 flex-1"
                    variant="default"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        Save Report
                      </>
                    )}
                  </Button>
                )}

                {saved && (
                  <Button disabled className="gap-2 flex-1" variant="default">
                    <CheckCircle className="h-4 w-4" />
                    Saved Successfully
                  </Button>
                )}

                <Button onClick={handleReset} variant="outline" className="gap-2 flex-1 bg-transparent">
                  <RotateCcw className="h-4 w-4" />
                  New Report
                </Button>
              </div>

              {!user && (
                <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-700">
                  <p className="font-semibold">Sign in to save your reports</p>
                  <p>Create an account to keep your analysis history and track your health over time.</p>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  )
}
