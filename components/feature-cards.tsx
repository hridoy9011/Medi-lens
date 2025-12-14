import { Scan, FileCheck, Shield, AlertTriangle } from "lucide-react"

const features = [
  {
    icon: Scan,
    label: "OCR Extraction",
    desc: "AI-powered text recognition from prescription images",
    color: "bg-primary/10 text-primary",
  },
  {
    icon: FileCheck,
    label: "Medicine Detection",
    desc: "Automatically identify all medications and dosages",
    color: "bg-success/10 text-success",
  },
  {
    icon: Shield,
    label: "Authenticity Check",
    desc: "Verify prescription validity and detect fakes",
    color: "bg-warning/10 text-warning",
  },
  {
    icon: AlertTriangle,
    label: "Interaction Alert",
    desc: "Comprehensive drug safety analysis",
    color: "bg-destructive/10 text-destructive",
  },
]

export function FeatureCards() {
  return (
    <section className="container mx-auto px-4 py-12 max-w-5xl">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-semibold tracking-tight text-foreground mb-2">How MediLens Works</h2>
        <p className="text-muted-foreground">Four-step AI analysis for complete prescription safety</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {features.map((feature, index) => (
          <div
            key={index}
            className="flex flex-col items-center text-center p-6 rounded-2xl bg-card border shadow-sm hover:shadow-md transition-shadow"
          >
            <div className={`h-14 w-14 rounded-xl ${feature.color} flex items-center justify-center mb-4`}>
              <feature.icon className="h-7 w-7" />
            </div>
            <h3 className="font-semibold text-foreground mb-1">{feature.label}</h3>
            <p className="text-sm text-muted-foreground">{feature.desc}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
