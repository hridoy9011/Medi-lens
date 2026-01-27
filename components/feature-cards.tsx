import { Scan, FileCheck, Shield, AlertTriangle, Droplets, Apple } from "lucide-react"

const prescriptionFeatures = [
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

const labFeatures = [
  {
    icon: Droplets,
    label: "Lab Data Extraction",
    desc: "Extract test results from blood work and medical reports",
    color: "bg-red/10 text-red-600",
  },
  {
    icon: AlertTriangle,
    label: "Abnormality Detection",
    desc: "Identify abnormal values and severity levels",
    color: "bg-orange/10 text-orange-600",
  },
  {
    icon: Apple,
    label: "Diet Recommendations",
    desc: "Get personalized nutrition advice based on results",
    color: "bg-green/10 text-green-600",
  },
  {
    icon: Shield,
    label: "Health Assessment",
    desc: "Comprehensive analysis of overall health status",
    color: "bg-blue/10 text-blue-600",
  },
]

const features = [...prescriptionFeatures, ...labFeatures];

export function FeatureCards() {
  return (
    <section className="container mx-auto px-4 py-16 max-w-5xl space-y-16">
      {/* Prescription Features */}
      <div>
        <div className="text-center mb-8">
          <h2 className="text-2xl font-semibold tracking-tight text-foreground mb-2">Prescription Analysis</h2>
          <p className="text-muted-foreground">AI-powered prescription safety checks in four steps</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {prescriptionFeatures.map((feature, index) => (
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
      </div>

      {/* Lab Features */}
      <div>
        <div className="text-center mb-8">
          <h2 className="text-2xl font-semibold tracking-tight text-foreground mb-2">Lab Report Analysis</h2>
          <p className="text-muted-foreground">Comprehensive blood test and medical report analysis</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {labFeatures.map((feature, index) => (
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
      </div>
    </section>
  )
}
