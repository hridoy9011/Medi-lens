"use client"

import { Pill } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { ExtractedData } from "@/lib/types"

interface ExtractedDataCardProps {
  data: ExtractedData
}

export function ExtractedDataCard({ data }: ExtractedDataCardProps) {
  return (
    <div className="rounded-2xl bg-card border shadow-lg p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Pill className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-foreground">Extracted Medicines</h3>
          <p className="text-sm text-muted-foreground">{data.medicines.length} medications found</p>
        </div>
      </div>

      {data.medicines.length > 0 && (
        <div className="grid gap-3">
          {data.medicines.map((med, index) => (
            <div key={index} className={cn("p-4 rounded-xl border-l-4 bg-muted/30", "border-l-primary")}>
              <p className="font-semibold text-foreground text-lg mb-2">{med.name}</p>
              <div className="flex flex-wrap gap-2">
                {med.dose && (
                  <Badge variant="secondary" className="rounded-lg text-xs">
                    {med.dose}
                  </Badge>
                )}
                {med.frequency && (
                  <Badge variant="outline" className="rounded-lg text-xs bg-transparent">
                    {med.frequency}
                  </Badge>
                )}
              </div>
              {/* Confidence bar placeholder */}
              <div className="mt-3">
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                  <span>AI Confidence</span>
                  <span>High</span>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-success rounded-full" style={{ width: "90%" }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
