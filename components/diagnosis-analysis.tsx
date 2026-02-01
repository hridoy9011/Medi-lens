"use client"

import { Stethoscope, CheckCircle2, AlertTriangle, XCircle, Info, ShieldAlert } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { DiagnosisAnalysis as DiagnosisAnalysisType } from "@/lib/types"

interface DiagnosisAnalysisProps {
    analysis: DiagnosisAnalysisType
}

export function DiagnosisAnalysis({ analysis }: DiagnosisAnalysisProps) {
    const getConfidenceColor = (level: string) => {
        switch (level.toLowerCase()) {
            case "high":
                return "bg-green-500/10 text-green-600 border-green-200"
            case "medium":
                return "bg-amber-500/10 text-amber-600 border-amber-200"
            case "low":
                return "bg-red-500/10 text-red-600 border-red-200"
            default:
                return "bg-muted text-muted-foreground"
        }
    }

    const getStatusIcon = (appropriate: boolean) => {
        return appropriate ? (
            <CheckCircle2 className="h-4 w-4 text-green-500" />
        ) : (
            <AlertTriangle className="h-4 w-4 text-amber-500" />
        )
    }

    const getStatusBadge = (appropriate: boolean) => {
        return appropriate ? (
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 gap-1 text-[10px] py-0">
                <CheckCircle2 className="h-3 w-3" /> Suitable
            </Badge>
        ) : (
            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 gap-1 text-[10px] py-0">
                <AlertTriangle className="h-3 w-3" /> Caution
            </Badge>
        )
    }

    return (
        <div className="space-y-6 mt-8">
            <div className="flex items-center gap-2 px-1">
                <Stethoscope className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold text-foreground">Diagnosis & Treatment Appropriateness</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Diagnosis Card */}
                <Card className="md:col-span-1 overflow-hidden border-none shadow-md bg-gradient-to-br from-blue-50 to-indigo-50/30">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-blue-800 flex items-center gap-2">
                            <Stethoscope className="h-4 w-4" />
                            Identified Diagnosis
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            <div className="flex flex-wrap gap-2">
                                {analysis.diagnosis.map((d, i) => (
                                    <div key={i} className="text-lg font-bold text-indigo-900 leading-tight">
                                        {d}{i < analysis.diagnosis.length - 1 ? "," : ""}
                                    </div>
                                ))}
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-indigo-700/70 font-medium">Confidence:</span>
                                <Badge variant="outline" className={`capitalize text-[10px] py-0 px-2 font-bold tracking-wide ${getConfidenceColor(analysis.confidence_level)}`}>
                                    {analysis.confidence_level}
                                </Badge>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Medicine Table/List */}
                <Card className="md:col-span-2 shadow-sm border-muted/60">
                    <CardHeader className="pb-3 border-b border-muted/40">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <Info className="h-4 w-4 text-muted-foreground" />
                            Medicine Appropriateness
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-muted/30 text-muted-foreground font-medium">
                                    <tr>
                                        <th className="px-4 py-2 text-left">Medicine</th>
                                        <th className="px-4 py-2 text-left">Status</th>
                                        <th className="px-4 py-2 text-left">Notes</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-muted/30">
                                    {analysis.medicine_analysis.map((med, i) => (
                                        <tr key={i} className={med.appropriate ? "" : "bg-amber-50/30"}>
                                            <td className="px-4 py-3 font-medium text-foreground">
                                                <div className="flex flex-col">
                                                    <span>{med.medicine}</span>
                                                    <span className="text-[10px] text-muted-foreground font-normal leading-tight mt-0.5">{med.purpose}</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                {getStatusBadge(med.appropriate)}
                                            </td>
                                            <td className="px-4 py-3 text-xs text-muted-foreground leading-snug">
                                                {med.notes}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Overall Assessment */}
            <Card className="bg-muted/40 border-none shadow-none">
                <CardContent className="pt-6">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                        AI Assessment
                    </h4>
                    <p className="text-sm text-foreground/80 italic leading-relaxed">
                        "{analysis.overall_assessment}"
                    </p>
                </CardContent>
            </Card>

            {/* Mandatory Disclaimer */}
            <div className="p-4 rounded-xl border border-red-100 bg-red-50/50 flex gap-3 items-start">
                <ShieldAlert className="h-5 w-5 text-red-500 mt-0.5 shrink-0" />
                <div className="space-y-1">
                    <p className="text-sm font-bold text-red-900 leading-tight">Medical Disclaimer</p>
                    <p className="text-xs text-red-800/80 leading-relaxed">
                        This analysis is generated by Artificial Intelligence and does <strong>not</strong> constitute a medical diagnosis or treatment plan.
                        Information provided may be inaccurate or incomplete. <strong>Always consult a licensed medical professional</strong> before starting,
                        stopping, or changing any medication or treatment.
                    </p>
                </div>
            </div>
        </div>
    )
}
