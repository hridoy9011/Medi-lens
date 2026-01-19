"use client"

import React from "react"

import { DietRecommendation } from "@/lib/types"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Lightbulb, Clock, UtensilsCrossed } from "lucide-react"

interface DietRecommendationsProps {
  recommendations: DietRecommendation[]
}

const categoryColors: Record<string, { bg: string; border: string; text: string }> = {
  "Iron-rich foods": { bg: "bg-red-50", border: "border-red-200", text: "text-red-700" },
  "High fiber foods": { bg: "bg-green-50", border: "border-green-200", text: "text-green-700" },
  "Vitamin supplements": { bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-700" },
  "Protein-rich foods": { bg: "bg-purple-50", border: "border-purple-200", text: "text-purple-700" },
  "Low sodium foods": { bg: "bg-cyan-50", border: "border-cyan-200", text: "text-cyan-700" },
  "Healthy fats": { bg: "bg-yellow-50", border: "border-yellow-200", text: "text-yellow-700" },
  "Calcium-rich foods": { bg: "bg-orange-50", border: "border-orange-200", text: "text-orange-700" },
  "Potassium-rich foods": { bg: "bg-pink-50", border: "border-pink-200", text: "text-pink-700" },
  default: { bg: "bg-gray-50", border: "border-gray-200", text: "text-gray-700" },
}

export function DietRecommendations({ recommendations }: DietRecommendationsProps) {
  if (recommendations.length === 0) {
    return null
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <h3 className="text-xl font-bold text-foreground">Dietary Recommendations</h3>
        <p className="text-sm text-muted-foreground">Personalized nutrition plan based on your lab results - follow these recommendations to improve your health</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-1 space-y-4">
        {recommendations.map((recommendation, index) => (
          <DietCard key={index} recommendation={recommendation} index={index} />
        ))}
      </div>
    </div>
  )
}

function DietCard({ recommendation, index }: { recommendation: DietRecommendation; index: number }) {
  const colorClass = categoryColors[recommendation.category] || categoryColors.default

  return (
    <Card className={`border-2 ${colorClass.border} ${colorClass.bg} overflow-hidden hover:shadow-md transition-shadow`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center justify-center w-7 h-7 bg-white rounded-full font-semibold text-sm border border-gray-300">
                {index + 1}
              </span>
              <CardTitle className={`text-lg ${colorClass.text}`}>{recommendation.category}</CardTitle>
            </div>
          </div>
        </div>
        <CardDescription className="text-xs mt-2 font-medium text-foreground">{recommendation.reasonForAbnormality}</CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Foods List */}
        <div className="space-y-2">
          <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground flex items-center gap-1">
            <UtensilsCrossed className="h-3 w-3" /> Recommended Foods
          </p>
          <div className="space-y-1">
            {recommendation.foods.map((food, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="text-green-600 font-bold mt-0.5">✓</span>
                <span className="text-sm text-foreground">{food}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Serving Frequency */}
        {recommendation.servingFrequency && (
          <div className="rounded-lg bg-white/70 p-3 border border-gray-200">
            <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground flex items-center gap-1 mb-1">
              <Clock className="h-3 w-3" /> Recommended Frequency
            </p>
            <p className="text-sm font-medium text-foreground">{recommendation.servingFrequency}</p>
          </div>
        )}

        {/* Dietary Tip */}
        {recommendation.dietaryTip && (
          <div className="rounded-lg bg-white/70 p-3 border border-blue-200 bg-blue-50/50">
            <p className="text-xs font-bold uppercase tracking-wide text-blue-700 flex items-center gap-1 mb-1">
              <Lightbulb className="h-3 w-3" /> Pro Tip
            </p>
            <p className="text-sm text-blue-900">{recommendation.dietaryTip}</p>
          </div>
        )}

        {/* Benefits */}
        <div className="rounded-lg bg-white/70 p-3 border border-gray-200">
          <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-2">Health Benefits</p>
          <p className="text-sm leading-relaxed text-foreground">{recommendation.benefits}</p>
        </div>
      </CardContent>
    </Card>
  )
}
