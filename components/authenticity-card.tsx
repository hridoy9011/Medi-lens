"use client"

import { ShieldCheck, ShieldAlert, ShieldX, AlertTriangle } from "lucide-react"
import { cn } from "@/lib/utils"
import type { AuthenticityResult } from "@/lib/types"

interface AuthenticityCardProps {
  result: AuthenticityResult
}

const statusConfig = {
  genuine: {
    icon: ShieldCheck,
    label: "Authentic Prescription",
    bgColor: "bg-success/5",
    iconBg: "bg-success/10",
    textColor: "text-success",
    borderColor: "border-success/20",
  },
  suspicious: {
    icon: ShieldAlert,
    label: "Uncertain Authenticity",
    bgColor: "bg-warning/5",
    iconBg: "bg-warning/10",
    textColor: "text-warning",
    borderColor: "border-warning/20",
  },
  fake: {
    icon: ShieldX,
    label: "Potentially Fake",
    bgColor: "bg-destructive/5",
    iconBg: "bg-destructive/10",
    textColor: "text-destructive",
    borderColor: "border-destructive/20",
  },
}

export function AuthenticityCard({ result }: AuthenticityCardProps) {
  const config = statusConfig[result.status as keyof typeof statusConfig]
  if (!config) return null
  const Icon = config.icon

  return (
    <div className={cn("rounded-2xl border shadow-lg p-6 space-y-6", config.bgColor, config.borderColor)}>
      <div className="flex items-center gap-4">
        <div className={cn("h-12 w-12 rounded-xl flex items-center justify-center", config.iconBg)}>
          <Icon className={cn("h-6 w-6", config.textColor)} />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-foreground">Authenticity Check</h3>
          <p className={cn("font-medium", config.textColor)}>{config.label}</p>
        </div>
      </div>

      {result.reasons.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <AlertTriangle className="h-4 w-4" />
            Analysis Details
          </div>
          <ul className="space-y-2">
            {result.reasons.map((reason, index) => (
              <li key={index} className="flex items-start gap-3 text-sm text-muted-foreground">
                <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50 mt-2 flex-shrink-0" />
                {reason}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
