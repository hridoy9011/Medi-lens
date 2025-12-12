"use client"

import { useState, useCallback, useEffect } from "react"
import { RotateCcw, Save, Loader2, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { UploadZone } from "@/components/upload-zone"
import { AnalysisProgress } from "@/components/analysis-progress"
import { ResultsSection } from "@/components/results-section"
import { createClient } from "@/lib/supabase/client"
import { saveAnalysis } from "@/lib/supabase/actions"
import type { AnalysisState, ExtractedData, AuthenticityResult, DrugInteraction } from "@/lib/types"
import type { User } from "@supabase/supabase-js"

const initialState: AnalysisState = {
  step: "idle",
  imageUrl: null,
  ocrText: null,
  extractedData: null,
  authenticity: null,
  interactions: [],
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
        // Step 1: OCR
        updateState({ step: "ocr" })
        const ocrResponse = await fetch("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "ocr", imageUrl: imageBase64 }),
        })
        const ocrResult = await ocrResponse.json()

        if (!ocrResult.success) {
          throw new Error(ocrResult.error || "OCR failed")
        }

        const ocrText = ocrResult.data as string
        updateState({ ocrText })

        // Step 2: Extract medicines
        updateState({ step: "extracting" })
        const extractResponse = await fetch("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "extract", ocrText }),
        })
        const extractResult = await extractResponse.json()

        if (!extractResult.success) {
          throw new Error(extractResult.error || "Extraction failed")
        }

        const extractedData = extractResult.data as ExtractedData
        updateState({ extractedData })

        // Step 3: Check authenticity
        updateState({ step: "authenticity" })
        const authResponse = await fetch("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "authenticity", ocrText, extractedData }),
        })
        const authResult = await authResponse.json()

        if (!authResult.success) {
          throw new Error(authResult.error || "Authenticity check failed")
        }

        const authenticity = authResult.data as AuthenticityResult
        updateState({ authenticity })

        // Step 4: Check interactions
        updateState({ step: "interactions" })
        const interactionsResponse = await fetch("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "interactions", extractedData }),
        })
        const interactionsResult = await interactionsResponse.json()

        if (!interactionsResult.success) {
          throw new Error(interactionsResult.error || "Interactions check failed")
        }

        const interactions = interactionsResult.data as DrugInteraction[]
        updateState({ interactions, step: "complete" })
      } catch (error) {
        console.error("Analysis error:", error)
        updateState({
          step: "error",
          error: error instanceof Error ? error.message : "Analysis failed",
        })
      }
    },
    [updateState],
  )

  const handleSave = async () => {
    if (!state.imageUrl || !state.ocrText || !state.extractedData || !state.authenticity) {
      return
    }

    setSaving(true)
    const result = await saveAnalysis({
      imageUrl: state.imageUrl,
      ocrText: state.ocrText,
      extractedData: state.extractedData,
      authenticity: state.authenticity,
      interactions: state.interactions,
    })
    setSaving(false)

    if (result.success) {
      setSaved(true)
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
        <div className="p-6 rounded-2xl bg-destructive/10 border border-destructive/20">
          <p className="text-base text-destructive font-semibold mb-3">Analysis Error</p>
          <p className="text-sm text-destructive/80 mb-4">{state.error}</p>
          <Button
            variant="outline"
            size="sm"
            className="bg-transparent border-destructive/30 text-destructive hover:bg-destructive/10"
            onClick={handleClear}
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Try Again
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
