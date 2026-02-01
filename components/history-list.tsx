"use client"

import { useState, useEffect } from "react"
import {
  Loader2,
  FileText,
  Calendar,
  Building,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Pill,
  ChevronDown,
  ChevronUp,
  Activity,
  User,
  Utensils,
  Stethoscope,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DiagnosisAnalysis } from "@/components/diagnosis-analysis"
import { createClient } from "@/lib/supabase/client"

interface HistoryItem {
  id: string
  image_url: string
  created_at: string
  type: "prescription" | "health_report"
  // Prescription fields
  extracted_data?: any
  authenticity_results?: any[]
  drug_interactions?: any[]
  // Lab report fields
  overall_health_assessment?: string
  lab_abnormalities?: any[]
  diet_recommendations?: any[]
  diagnosisAnalysis?: any
}

export function HistoryList() {
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        setError("Not authenticated")
        setLoading(false)
        return
      }

      try {
        console.log("[v0] Fetching history for user:", user.id)

        // Fetch prescriptions
        const { data: prescriptions, error: pError } = await supabase
          .from("prescriptions")
          .select(`
            id,
            image_url,
            created_at,
            extracted_data (
              id,
              doctor,
              hospital,
              prescription_date,
              medicines (
                name,
                dose,
                frequency
              )
            ),
            authenticity_results (
              authenticity,
              reasons
            ),
            diagnosis_analysis (
              diagnosis,
              confidence_level,
              analysis
            )
          `)
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })

        // Fetch health reports
        const { data: reports, error: rError } = await supabase
          .from("health_reports")
          .select(`
            id,
            image_url,
            created_at,
            extracted_data,
            overall_health_assessment,
            lab_abnormalities (
              test_name,
              abnormality,
              severity,
              possible_causes
            ),
            diet_recommendations (
              category,
              foods,
              benefits,
              reason_for_abnormality
            )
          `)
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })

        if (pError || rError) {
          console.error("[v0] Fetch error:", { pError, rError })
          let msg = "Failed to load history."
          if (pError && pError.code !== 'PGRST116') msg += ` Prescriptions Error: ${pError.message || pError.details}.`
          if (rError && rError.code !== 'PGRST116') msg += ` Reports Error: ${rError.message || rError.details}.`

          if (pError?.code === 'PGRST204' || rError?.code === 'PGRST204') {
            msg = "It looks like the necessary database tables for health reports aren't created yet. Please run the SQL script provided in 'scripts/004-health-reports.sql' in your Supabase SQL editor."
          }

          if (msg !== "Failed to load history.") throw new Error(msg)
        }

        const pData = (prescriptions || []).map((item: any) => ({
          ...item,
          type: "prescription" as const,
          diagnosisAnalysis: item.diagnosis_analysis?.[0]?.analysis || null
        }))
        const rData = (reports || []).map((item: any) => ({ ...item, type: "health_report" as const }))

        const combined = [...pData, ...rData].sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )

        console.log(`[v0] Loaded ${combined.length} history items`)
        setHistory(combined as any[])
      } catch (err: any) {
        console.error("[v0] Fetch history catch error:", err)
        setError(err.message || "Failed to load history")
      } finally {
        setLoading(false)
      }
    }
    fetchHistory()
  }, [supabase])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "genuine":
        return <CheckCircle className="h-5 w-5 text-success" />
      case "suspicious":
        return <AlertTriangle className="h-5 w-5 text-warning" />
      case "fake":
        return <XCircle className="h-5 w-5 text-destructive" />
      default:
        return null
    }
  }

  const getSeverityColor = (severity: string) => {
    switch ((severity || "").toLowerCase()) {
      case "none":
      case "normal":
        return "bg-success/10 text-success border-success/20"
      case "mild":
        return "bg-blue-500/10 text-blue-600 border-blue-500/20"
      case "moderate":
        return "bg-warning/10 text-warning border-warning/20"
      case "severe":
      case "high":
      case "low":
      case "abnormal":
        return "bg-destructive/10 text-destructive border-destructive/20"
      default:
        return "bg-muted text-muted-foreground"
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 rounded-2xl bg-destructive/10 border border-destructive/20 text-center">
        <p className="text-destructive font-medium">{error}</p>
        <p className="text-sm text-muted-foreground mt-2">Please sign in to view your history</p>
      </div>
    )
  }

  if (history.length === 0) {
    return (
      <div className="text-center py-20">
        <FileText className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
        <h3 className="text-lg font-semibold text-foreground mb-2">No Analyses Yet</h3>
        <p className="text-muted-foreground">Your saved analyses will appear here</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {history.map((item) => {
        const isExpanded = expandedId === item.id
        const isPrescription = item.type === "prescription"

        const prescriptionData = isPrescription ? (Array.isArray(item.extracted_data) ? item.extracted_data[0] : item.extracted_data) : null
        const authenticity = isPrescription ? (Array.isArray(item.authenticity_results) ? item.authenticity_results[0] : item.authenticity_results) : null
        const medicines = prescriptionData?.medicines || []

        const reportData = !isPrescription ? item.extracted_data : null
        const abnormalities = item.lab_abnormalities || []
        const diets = item.diet_recommendations || []

        return (
          <Card key={item.id} className={`rounded-2xl overflow-hidden border-l-4 ${isPrescription ? 'border-l-primary' : 'border-l-blue-500'}`}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 rounded-xl bg-muted overflow-hidden flex-shrink-0">
                    <img
                      src={item.image_url || "/placeholder.svg"}
                      alt={isPrescription ? "Prescription" : "Health Report"}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="secondary" className="text-[10px] uppercase font-bold tracking-wider">
                        {isPrescription ? "Prescription" : "Lab Report"}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(item.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      {isPrescription
                        ? (prescriptionData?.doctor || "Unknown Doctor")
                        : (reportData?.labName || reportData?.patientName || "Lab Analysis")}
                      {isPrescription && authenticity && getStatusIcon(authenticity.authenticity)}
                    </CardTitle>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                      {isPrescription ? (
                        prescriptionData?.hospital && (
                          <span className="flex items-center gap-1">
                            <Building className="h-4 w-4" />
                            {prescriptionData.hospital}
                          </span>
                        )
                      ) : (
                        reportData?.doctorName && (
                          <span className="flex items-center gap-1">
                            <Stethoscope className="h-4 w-4" />
                            {reportData.doctorName}
                          </span>
                        )
                      )}
                    </div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setExpandedId(isExpanded ? null : item.id)}
                  className="rounded-xl"
                >
                  {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                </Button>
              </div>
            </CardHeader>

            {isExpanded && (
              <CardContent className="pt-0 space-y-6">
                {isPrescription ? (
                  <>
                    {medicines.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                          <Pill className="h-4 w-4 text-primary" />
                          Medicines ({medicines.length})
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {medicines.map((med: any, idx: number) => (
                            <div key={idx} className="p-3 rounded-xl bg-muted/50 border-l-4 border-primary">
                              <p className="font-medium text-foreground">{med.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {med.dose || "N/A"} • {med.frequency || "N/A"}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {authenticity && (
                      <div className="space-y-2">
                        <h4 className="text-sm font-semibold text-foreground">Authenticity Check</h4>
                        <div className="p-3 rounded-xl bg-muted/50">
                          <Badge
                            variant="outline"
                            className={`capitalize ${authenticity.authenticity === "genuine"
                              ? "bg-success/10 text-success border-success/20"
                              : authenticity.authenticity === "suspicious"
                                ? "bg-warning/10 text-warning border-warning/20"
                                : "bg-destructive/10 text-destructive border-destructive/20"
                              }`}
                          >
                            {authenticity.authenticity}
                          </Badge>
                          {authenticity.reasons?.length > 0 && (
                            <ul className="mt-2 text-sm text-muted-foreground list-disc list-inside">
                              {authenticity.reasons.map((reason: string, idx: number) => (
                                <li key={idx}>{reason}</li>
                              ))}
                            </ul>
                          )}
                        </div>
                      </div>
                    )}

                    {item.diagnosisAnalysis && (
                      <DiagnosisAnalysis analysis={item.diagnosisAnalysis} />
                    )}

                    {item.drug_interactions && item.drug_interactions.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4 text-warning" />
                          Drug Interactions ({item.drug_interactions.length})
                        </h4>
                        <div className="space-y-2">
                          {item.drug_interactions.map((interaction, idx) => (
                            <div key={idx} className="p-3 rounded-xl bg-muted/50">
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-medium text-foreground text-sm">
                                  {interaction.drug_a} + {interaction.drug_b}
                                </span>
                                <Badge variant="outline" className={`capitalize ${getSeverityColor(interaction.severity)}`}>
                                  {interaction.severity}
                                </Badge>
                              </div>
                              <p className="text-xs text-muted-foreground">{interaction.description}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    {item.overall_health_assessment && (
                      <div className="space-y-2">
                        <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                          <Activity className="h-4 w-4 text-blue-500" />
                          Health Assessment
                        </h4>
                        <p className="text-sm text-muted-foreground p-3 rounded-xl bg-muted/50">
                          {item.overall_health_assessment}
                        </p>
                      </div>
                    )}

                    {abnormalities.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4 text-destructive" />
                          Abnormalities Found ({abnormalities.length})
                        </h4>
                        <div className="space-y-2">
                          {abnormalities.map((abn: any, idx: number) => (
                            <div key={idx} className="p-3 rounded-xl bg-muted/50">
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-medium text-foreground text-sm lowercase capitalize-first">
                                  {abn.test_name}
                                </span>
                                <Badge variant="outline" className={`capitalize ${getSeverityColor(abn.severity)}`}>
                                  {abn.severity}
                                </Badge>
                              </div>
                              <p className="text-xs text-muted-foreground mb-1">{abn.abnormality}</p>
                              {abn.possible_causes?.length > 0 && (
                                <p className="text-[10px] text-muted-foreground italic">
                                  Potential causes: {abn.possible_causes.join(", ")}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {diets.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                          <Utensils className="h-4 w-4 text-success" />
                          Diet Recommendations
                        </h4>
                        <div className="grid grid-cols-1 gap-2">
                          {diets.map((diet: any, idx: number) => (
                            <div key={idx} className="p-3 rounded-xl bg-muted/50 border-l-4 border-success">
                              <p className="font-medium text-foreground text-xs">{diet.category} addressed: {diet.reason_for_abnormality}</p>
                              <p className="text-xs text-muted-foreground mt-1">
                                <span className="font-semibold text-[10px] uppercase">Recommended:</span> {diet.foods?.join(", ")}
                              </p>
                              <p className="text-[10px] text-muted-foreground mt-1 line-clamp-2">{diet.benefits}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            )}
          </Card>
        )
      })}
    </div>
  )
}
