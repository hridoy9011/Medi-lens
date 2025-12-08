// MediLens type definitions

export interface Medicine {
  name: string
  dose: string | null
  frequency: string | null
}

export interface ExtractedData {
  doctor: string | null
  hospital: string | null
  date: string | null
  medicines: Medicine[]
}

export interface AuthenticityResult {
  authenticity: "genuine" | "suspicious" | "fake"
  reasons: string[]
}

export interface DrugInteraction {
  drug_a: string
  drug_b: string
  severity: "none" | "mild" | "moderate" | "severe"
  description: string
}

export interface AnalysisState {
  step: "idle" | "uploading" | "ocr" | "extracting" | "authenticity" | "interactions" | "complete" | "error"
  imageUrl: string | null
  ocrText: string | null
  extractedData: ExtractedData | null
  authenticity: AuthenticityResult | null
  interactions: DrugInteraction[]
  error: string | null
}

export type AnalysisAction = "ocr" | "extract" | "authenticity" | "interactions"
