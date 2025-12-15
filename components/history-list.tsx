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
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { getAnalysisHistory } from "@/lib/supabase/actions"

interface HistoryItem {
  id: string
  image_url: string
  created_at: string
  extracted_data: Array<{
    doctor_name: string | null
    hospital_name: string | null
    prescription_date: string | null
  }>
  medicines: Array<{
    name: string
    dose: string | null
    frequency: string | null
  }>
  authenticity_results: Array<{
    status: "genuine" | "suspicious" | "fake"
    reasons: string[]
  }>
  drug_interactions: Array<{
    drug_a: string
    drug_b: string
    severity: "none" | "mild" | "moderate" | "severe"
    description: string
  }>
}

export function HistoryList() {
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  useEffect(() => {
    const fetchHistory = async () => {
      const result = await getAnalysisHistory()
      if (result.success) {
        setHistory(result.data as HistoryItem[])
      } else {
        setError(result.error || "Failed to load history")
      }
      setLoading(false)
    }
    fetchHistory()
  }, [])

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
        <p className="text-muted-foreground">Your saved prescription analyses will appear here</p>
      </div>
    )
  }

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
    switch (severity) {
      case "none":
        return "bg-success/10 text-success border-success/20"
      case "mild":
        return "bg-blue-500/10 text-blue-600 border-blue-500/20"
      case "moderate":
        return "bg-warning/10 text-warning border-warning/20"
      case "severe":
        return "bg-destructive/10 text-destructive border-destructive/20"
      default:
        return "bg-muted text-muted-foreground"
    }
  }

  return (
    <div className="space-y-4">
      {history.map((item) => {
        const extractedData = item.extracted_data[0]
        const authenticity = item.authenticity_results[0]
        const isExpanded = expandedId === item.id

        return (
          <Card key={item.id} className="rounded-2xl overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 rounded-xl bg-muted overflow-hidden flex-shrink-0">
                    <img
                      src={item.image_url || "/placeholder.svg"}
                      alt="Prescription"
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      {extractedData?.doctor_name || "Unknown Doctor"}
                      {authenticity && getStatusIcon(authenticity.status)}
                    </CardTitle>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                      {extractedData?.hospital_name && (
                        <span className="flex items-center gap-1">
                          <Building className="h-4 w-4" />
                          {extractedData.hospital_name}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {new Date(item.created_at).toLocaleDateString()}
                      </span>
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
              <CardContent className="pt-0 space-y-4">
                {/* Medicines */}
                {item.medicines.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                      <Pill className="h-4 w-4 text-primary" />
                      Medicines ({item.medicines.length})
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {item.medicines.map((med, idx) => (
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

                {/* Authenticity */}
                {authenticity && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold text-foreground">Authenticity Check</h4>
                    <div className="p-3 rounded-xl bg-muted/50">
                      <Badge
                        variant="outline"
                        className={`capitalize ${
                          authenticity.status === "genuine"
                            ? "bg-success/10 text-success border-success/20"
                            : authenticity.status === "suspicious"
                              ? "bg-warning/10 text-warning border-warning/20"
                              : "bg-destructive/10 text-destructive border-destructive/20"
                        }`}
                      >
                        {authenticity.status}
                      </Badge>
                      {authenticity.reasons.length > 0 && (
                        <ul className="mt-2 text-sm text-muted-foreground list-disc list-inside">
                          {authenticity.reasons.map((reason, idx) => (
                            <li key={idx}>{reason}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                )}

                {/* Drug Interactions */}
                {item.drug_interactions.length > 0 && (
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
              </CardContent>
            )}
          </Card>
        )
      })}
    </div>
  )
}
