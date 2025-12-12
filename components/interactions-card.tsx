"use client"

import { AlertCircle, CheckCircle, Info, AlertTriangle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { DrugInteraction } from "@/lib/types"

interface InteractionsCardProps {
  interactions: DrugInteraction[]
}

const severityConfig = {
  none: {
    icon: CheckCircle,
    label: "No Interaction",
    cardBg: "bg-success/5",
    border: "border-success/20",
    badgeClass: "bg-success/10 text-success border-success/20",
  },
  mild: {
    icon: Info,
    label: "Mild",
    cardBg: "bg-primary/5",
    border: "border-primary/20",
    badgeClass: "bg-primary/10 text-primary border-primary/20",
  },
  moderate: {
    icon: AlertTriangle,
    label: "Moderate",
    cardBg: "bg-warning/5",
    border: "border-warning/20",
    badgeClass: "bg-warning/10 text-warning border-warning/20",
  },
  severe: {
    icon: AlertCircle,
    label: "Severe",
    cardBg: "bg-destructive/5",
    border: "border-destructive/20",
    badgeClass: "bg-destructive/10 text-destructive border-destructive/20",
  },
}

export function InteractionsCard({ interactions }: InteractionsCardProps) {
  const hasSignificantInteractions = interactions.some((i) => i.severity === "moderate" || i.severity === "severe")

  const sortedInteractions = [...interactions].sort((a, b) => {
    const severityOrder = { severe: 0, moderate: 1, mild: 2, none: 3 }
    return severityOrder[a.severity] - severityOrder[b.severity]
  })

  return (
    <div
      className={cn(
        "rounded-2xl border shadow-lg p-6 space-y-6",
        hasSignificantInteractions ? "bg-destructive/5 border-destructive/20" : "bg-card",
      )}
    >
      <div className="flex items-center gap-3">
        <div
          className={cn(
            "h-10 w-10 rounded-xl flex items-center justify-center",
            hasSignificantInteractions ? "bg-destructive/10" : "bg-success/10",
          )}
        >
          <AlertCircle className={cn("h-5 w-5", hasSignificantInteractions ? "text-destructive" : "text-success")} />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-foreground">Drug Interactions</h3>
          <p className="text-sm text-muted-foreground">
            {interactions.length === 0
              ? "No interactions detected"
              : `${interactions.length} potential interaction${interactions.length > 1 ? "s" : ""} found`}
          </p>
        </div>
      </div>

      {interactions.length === 0 ? (
        <div className="flex items-center gap-4 p-4 rounded-xl bg-success/10 border border-success/20">
          <CheckCircle className="h-6 w-6 text-success flex-shrink-0" />
          <div>
            <p className="font-semibold text-success">No Interactions Found</p>
            <p className="text-sm text-muted-foreground">The prescribed medications appear safe to take together</p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Table header for larger screens */}
          <div className="hidden md:grid grid-cols-[1fr,1fr,100px,1fr] gap-4 px-4 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
            <span>Drug A</span>
            <span>Drug B</span>
            <span>Severity</span>
            <span>Advice</span>
          </div>

          {sortedInteractions.map((interaction, index) => {
            const config = severityConfig[interaction.severity]
            const Icon = config.icon

            return (
              <div key={index} className={cn("p-4 rounded-xl border", config.cardBg, config.border)}>
                {/* Mobile layout */}
                <div className="md:hidden space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-foreground">{interaction.drug_a}</span>
                      <span className="text-muted-foreground">+</span>
                      <span className="font-semibold text-foreground">{interaction.drug_b}</span>
                    </div>
                    <Badge variant="outline" className={cn("text-xs", config.badgeClass)}>
                      <Icon className="h-3 w-3 mr-1" />
                      {config.label}
                    </Badge>
                  </div>
                  {interaction.description && (
                    <p className="text-sm text-muted-foreground">{interaction.description}</p>
                  )}
                </div>

                {/* Desktop table layout */}
                <div className="hidden md:grid grid-cols-[1fr,1fr,100px,1fr] gap-4 items-center">
                  <span className="font-semibold text-foreground">{interaction.drug_a}</span>
                  <span className="font-semibold text-foreground">{interaction.drug_b}</span>
                  <Badge variant="outline" className={cn("text-xs w-fit", config.badgeClass)}>
                    {config.label}
                  </Badge>
                  <span className="text-sm text-muted-foreground">{interaction.description || "Monitor usage"}</span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
