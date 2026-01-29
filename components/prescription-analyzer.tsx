"use client"

import { useState, useCallback, useEffect } from "react"
import { RotateCcw, Save, Loader2, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { UploadZone } from "@/components/upload-zone"
import { AnalysisProgress } from "@/components/analysis-progress"
import { ResultsSection } from "@/components/results-section"
import { DiagnosisAnalysis } from "@/components/diagnosis-analysis"
import { createClient } from "@/lib/supabase/client"
import { saveAnalysis } from "@/lib/supabase/actions"
import type { AnalysisState, ExtractedData, AuthenticityResult, DrugInteraction, DiagnosisAnalysis as DiagnosisAnalysisType } from "@/lib/types"
import type { User } from "@supabase/supabase-js"

const initialState: AnalysisState = {
  step: "idle",
  imageUrl: null,
  ocrText: null,
  extractedData: null,
  authenticity: null,
  interactions: [],
  diagnosisAnalysis: null,
  error: null,
}

export function PrescriptionAnalyzer() {
  const [state, setState] = useState<AnalysisState>(initialState)
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

  const updateState = useCallback((updates: Partial<AnalysisState>) => {
    setState((prev) => ({ ...prev, ...updates }))
  }, [])

  const analyzeImage = useCallback(
    async (imageBase64: string) => {
      updateState({
        step: "uploading",
        imageUrl: imageBase64,
        error: null,
        ocrText: null,
        extractedData: null,
        authenticity: null,
        interactions: [],
      })
      setSaved(false)

      try {
        // Single all-in-one API call (4x more efficient!)
        updateState({ step: "analyzing" })
        const response = await fetch("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "analyze-full", imageUrl: imageBase64 }),
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
          extractedData: analysisData.extracted,
          authenticity: analysisData.authenticity,
          interactions: analysisData.interactions?.filter((i: DrugInteraction) => i.severity !== "none") || [],
          diagnosisAnalysis: analysisData.diagnosisAnalysis || null,
          step: "complete",
        })
      } catch (error) {
        console.error("[v0] Analysis error:", error)
        updateState({
          step: "error",
          error: error instanceof Error ? error.message : "Analysis failed",
        })
      }
    },
    [updateState],
  )

  const handleSave = async () => {
    if (!user || !state.imageUrl || !state.ocrText || !state.extractedData || !state.authenticity) {
      if (!user) updateState({ error: "Client-side: Please sign in to save your analysis" })
      return
    }

    setSaving(true)
    try {
      const result = await saveAnalysis({
        imageUrl: state.imageUrl,
        ocrText: state.ocrText,
        extractedData: state.extractedData,
        authenticity: state.authenticity,
        interactions: state.interactions,
        diagnosisAnalysis: state.diagnosisAnalysis,
      })

      if (result.success) {
        setSaved(true)
      } else {
        updateState({ error: result.error })
      }
    } catch (err: any) {
      updateState({ error: err.message || "Failed to save analysis" })
    } finally {
      setSaving(false)
    }
  }

  const handleClear = useCallback(() => {
    setState(initialState)
    setSaved(false)
  }, [])

  const isAnalyzing = state.step !== "idle" && state.step !== "complete" && state.step !== "error"

  return (
    <div className="space-y-8">
      <UploadZone
        onImageSelect={analyzeImage}
        isAnalyzing={isAnalyzing}
        currentImage={state.imageUrl}
        onClear={handleClear}
      />

      {state.error && (
        <div className="p-6 rounded-2xl bg-amber-50 border border-amber-200">
          <p className="text-base text-amber-900 font-semibold mb-3">💡 Oops! Let's try that again</p>
          <p className="text-sm text-amber-800 mb-4 whitespace-pre-line">{state.error}</p>
          <Button
            variant="outline"
            size="sm"
            className="bg-transparent border-amber-300 text-amber-900 hover:bg-amber-100"
            onClick={handleClear}
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Upload a Different Image
          </Button>
        </div>
      )}

      {isAnalyzing && <AnalysisProgress state={state} />}

      {state.step === "complete" && (
        <>
          {user && (
            <div className="flex justify-end">
              <Button
                onClick={handleSave}
                disabled={saving || saved}
                className="rounded-xl"
                variant={saved ? "outline" : "default"}
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : saved ? (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2 text-success" />
                    Saved to History
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save to History
                  </>
                )}
              </Button>
            </div>
          )}
          <ResultsSection state={state} onClear={handleClear} />
        </>
      )}
    </div>
  )
}
