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
export interface MedicineAppropriateness {
  medicine: string
  purpose: string
  appropriate: boolean
  notes: string
}

export interface DiagnosisAnalysis {
  diagnosis: string[]
  confidence_level: "high" | "medium" | "low"
  medicine_analysis: MedicineAppropriateness[]
  overall_assessment: string
}

export interface AnalysisState {
  step: "idle" | "uploading" | "analyzing" | "ocr" | "extracting" | "authenticity" | "interactions" | "complete" | "error"
  imageUrl: string | null
  ocrText: string | null
  extractedData: ExtractedData | null
  authenticity: AuthenticityResult | null
  interactions: DrugInteraction[]
  diagnosisAnalysis: DiagnosisAnalysis | null
  error: string | null
}

export type AnalysisAction = "ocr" | "extract" | "authenticity" | "interactions"

// Health Report Types
export interface LabTestResult {
  testName: string
  value: string | number
  normalRange: string
  unit: string
  status: "normal" | "low" | "high" | "abnormal"
}

export interface ExtractedLabData {
  patientName: string | null
  testDate: string | null
  labName: string | null
  doctorName: string | null
  testResults: LabTestResult[]
}

export interface AbnormalityAnalysis {
  testName: string
  abnormality: string
  severity: "mild" | "moderate" | "severe"
  possibleCauses: string[]
}

export interface DietRecommendation {
  category: string
  foods: string[]
  servingFrequency?: string
  dietaryTip?: string
  benefits: string
  reasonForAbnormality: string
}

export interface HealthReportAnalysis {
  extractedData: ExtractedLabData
  abnormalities: AbnormalityAnalysis[]
  dietRecommendations: DietRecommendation[]
  overallHealthAssessment: string
}

export interface HealthReportState {
  step: "idle" | "uploading" | "analyzing" | "complete" | "error"
  imageUrl: string | null
  ocrText: string | null
  analysis: HealthReportAnalysis | null
  error: string | null
}
