"use server"

import { createClient } from "@/lib/supabase/server"
import type { ExtractedData, AuthenticityResult, DrugInteraction, HealthReportAnalysis, DiagnosisAnalysis } from "@/lib/types"

export async function saveAnalysis({
  imageUrl,
  ocrText,
  extractedData,
  authenticity,
  interactions,
  diagnosisAnalysis,
}: {
  imageUrl: string
  ocrText: string
  extractedData: ExtractedData
  authenticity: AuthenticityResult
  interactions: DrugInteraction[]
  diagnosisAnalysis: DiagnosisAnalysis | null
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    console.error("[v0] saveAnalysis: Not authenticated")
    return { success: false, error: "Server-side: Please sign in to save your analysis" }
  }

  try {
    const parsedData = {
      imageUrl,
      ocrText,
      extractedData,
      authenticity,
      interactions,
      diagnosisAnalysis
    }
    console.log("[v0] saveAnalysis: Starting save for user", user.id)

    // 1. Process and upload image
    const imageData = imageUrl.split(",")[1]
    const binaryString = atob(imageData)
    const bytes = new Uint8Array(binaryString.length)
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i)
    }

    const fileName = `${user.id}/${Date.now()}.jpg`
    console.log("[v0] saveAnalysis: Uploading image to prescriptions bucket...")

    const { error: uploadError } = await supabase.storage.from("prescriptions").upload(fileName, bytes, {
      contentType: "image/jpeg",
      upsert: false,
    })

    if (uploadError) {
      console.error("[v0] Upload error:", uploadError.message)
      return { success: false, error: `Failed to upload image: ${uploadError.message}. Make sure the 'prescriptions' storage bucket exists.` }
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from("prescriptions").getPublicUrl(fileName)

    // 2. Insert prescription record
    console.log("[v0] saveAnalysis: Inserting prescription record...")
    const { data: prescription, error: prescriptionError } = await supabase
      .from("prescriptions")
      .insert({
        user_id: user.id,
        image_url: publicUrl,
        ocr_text: ocrText,
      })
      .select()
      .single()

    if (prescriptionError) {
      console.error("[v0] Prescription table error:", prescriptionError.message)
      return { success: false, error: `Failed to save prescription record: ${prescriptionError.message}` }
    }

    // 3. Insert extracted data
    console.log("[v0] saveAnalysis: Inserting extracted data...")
    const { data: extractedDataRecord, error: extractedError } = await supabase
      .from("extracted_data")
      .insert({
        prescription_id: prescription.id,
        doctor: extractedData.doctor,
        hospital: extractedData.hospital,
        prescription_date: extractedData.date,
      })
      .select()
      .single()

    if (extractedError) {
      console.error("[v0] Extracted data table error:", extractedError.message)
      // Fail fast
      return { success: false, error: `Failed to save extracted data: ${extractedError.message}` }
    }

    // 4. Insert medicines
    if (extractedDataRecord && extractedData.medicines.length > 0) {
      console.log("[v0] saveAnalysis: Inserting medicines...")
      const { error: medicinesError } = await supabase.from("medicines").insert(
        extractedData.medicines.map((med) => ({
          extracted_data_id: extractedDataRecord.id,
          name: med.name,
          dose: med.dose,
          frequency: med.frequency,
        })),
      )

      if (medicinesError) {
        console.error("[v0] Medicines table error:", medicinesError.message)
        return { success: false, error: `Failed to save medicines: ${medicinesError.message}` }
      }
    }

    // 5. Insert authenticity results
    console.log("[v0] saveAnalysis: Inserting authenticity results...")
    const { error: authError } = await supabase.from("authenticity_results").insert({
      prescription_id: prescription.id,
      authenticity: authenticity.authenticity,
      reasons: authenticity.reasons,
    })

    if (authError) {
      console.error("[v0] Authenticity table error:", authError.message)
      return { success: false, error: `Failed to save authenticity check: ${authError.message}` }
    }

    // 6. Insert drug interactions
    if (interactions.length > 0) {
      console.log("[v0] saveAnalysis: Inserting interactions...")
      const { error: interactionsError } = await supabase.from("drug_interactions").insert(
        interactions.map((interaction) => ({
          prescription_id: prescription.id,
          drug_a: interaction.drug_a,
          drug_b: interaction.drug_b,
          severity: interaction.severity,
          description: interaction.description,
        })),
      )

      if (interactionsError) {
        console.error("[v0] Interactions table error:", interactionsError.message)
        return { success: false, error: `Failed to save interactions: ${interactionsError.message}` }
      }
    }

    // 7. Insert diagnosis analysis
    if (parsedData.diagnosisAnalysis) {
      console.log("[v0] saveAnalysis: Inserting diagnosis analysis...")
      const { error: diagnosisError } = await supabase.from("diagnosis_analysis").insert({
        user_id: user.id,
        prescription_id: prescription.id,
        diagnosis: parsedData.diagnosisAnalysis.diagnosis,
        confidence_level: parsedData.diagnosisAnalysis.confidence_level,
        analysis: parsedData.diagnosisAnalysis
      })
      if (diagnosisError) {
        console.error("[v0] Diagnosis table error:", diagnosisError.message)
      }
    }

    console.log("[v0] saveAnalysis: All data saved successfully!")
    return { success: true, prescriptionId: prescription.id }
  } catch (error: any) {
    console.error("[v0] Save analysis catch error:", error)
    return { success: false, error: error.message || "An unexpected error occurred while saving" }
  }
}

export async function getAnalysisHistory() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    console.error("[v0] getAnalysisHistory: Not authenticated");
    return { success: false, error: "Not authenticated", data: [] }
  }
  console.log(`[v0] getAnalysisHistory: Fetching for user ${user.id}`);

  try {
    // Also fixed column names
    const { data: prescriptions, error } = await supabase
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
        drug_interactions (
          drug_a,
          drug_b,
          severity,
          description
        ),
        diagnosis_analysis (
          diagnosis,
          confidence_level,
          analysis
        )
      `)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Fetch history error:", error.message)
      return { success: false, error: "Failed to fetch history", data: [] }
    }

    console.log(`[v0] Fetched ${prescriptions?.length || 0} prescriptions`);
    return { success: true, data: prescriptions }
  } catch (error) {
    console.error("Get history error:", error)
    return { success: false, error: "Failed to get history", data: [] }
  }
}

export async function saveHealthReport({
  imageUrl,
  ocrText,
  analysis,
}: {
  imageUrl: string
  ocrText: string
  analysis: HealthReportAnalysis
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    console.error("[v0] saveHealthReport: Not authenticated")
    return { success: false, error: "Server-side: Please sign in to save your report" }
  }

  try {
    console.log("[v0] saveHealthReport: Starting save for user", user.id)

    // 1. Process and upload image
    const imageData = imageUrl.split(",")[1]
    const binaryString = atob(imageData)
    const bytes = new Uint8Array(binaryString.length)
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i)
    }

    const fileName = `${user.id}/lab-reports/${Date.now()}.jpg`
    console.log("[v0] saveHealthReport: Uploading image to lab-reports bucket...")

    const { error: uploadError } = await supabase.storage.from("lab-reports").upload(fileName, bytes, {
      contentType: "image/jpeg",
      upsert: false,
    })

    if (uploadError) {
      console.error("[v0] Lab Report Upload error:", uploadError.message)
      return { success: false, error: `Failed to upload image: ${uploadError.message}. Make sure the 'lab-reports' storage bucket exists.` }
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from("lab-reports").getPublicUrl(fileName)

    // 2. Insert health report record
    console.log("[v0] saveHealthReport: Inserting record...")
    const { data: report, error: reportError } = await supabase
      .from("health_reports")
      .insert({
        user_id: user.id,
        image_url: publicUrl,
        ocr_text: ocrText,
        extracted_data: analysis.extractedData,
        overall_health_assessment: analysis.overallHealthAssessment,
      })
      .select()
      .single()

    if (reportError) {
      console.error("[v0] Health report table error:", reportError.message)
      return { success: false, error: `Failed to save report record: ${reportError.message}` }
    }

    // 3. Insert abnormalities
    if (analysis.abnormalities.length > 0) {
      console.log("[v0] saveHealthReport: Inserting abnormalities...")
      const { error: abnormalitiesError } = await supabase.from("lab_abnormalities").insert(
        analysis.abnormalities.map((abn) => ({
          health_report_id: report.id,
          test_name: abn.testName,
          abnormality: abn.abnormality,
          severity: abn.severity,
          possible_causes: abn.possibleCauses,
        })),
      )

      if (abnormalitiesError) {
        console.error("[v0] Abnormalities table error:", abnormalitiesError.message)
        return { success: false, error: `Failed to save abnormalities: ${abnormalitiesError.message}` }
      }
    }

    // 4. Insert diet recommendations
    if (analysis.dietRecommendations.length > 0) {
      console.log("[v0] saveHealthReport: Inserting diet recommendations...")
      const { error: dietError } = await supabase.from("diet_recommendations").insert(
        analysis.dietRecommendations.map((diet) => ({
          health_report_id: report.id,
          category: diet.category,
          foods: diet.foods,
          benefits: diet.benefits,
          reason_for_abnormality: diet.reasonForAbnormality,
        })),
      )

      if (dietError) {
        console.error("[v0] Diet recommendations table error:", dietError.message)
        return { success: false, error: `Failed to save diet tips: ${dietError.message}` }
      }
    }

    console.log("[v0] saveHealthReport: All data saved successfully!")
    return { success: true, reportId: report.id }
  } catch (error: any) {
    console.error("[v0] Save health report catch error:", error)
    return { success: false, error: error.message || "An unexpected error occurred while saving" }
  }
}
export async function getHealthReportsHistory() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: "Not authenticated", data: [] }
  }

  try {
    const { data: reports, error } = await supabase
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

    if (error) {
      console.error("Fetch health reports error:", error.message)
      return { success: false, error: "Failed to fetch health reports", data: [] }
    }

    console.log(`[v0] Fetched ${reports?.length || 0} health reports`);
    return { success: true, data: reports }
  } catch (error) {
    console.error("Get health reports history error:", error)
    return { success: false, error: "Failed to get health reports history", data: [] }
  }
}

export async function getAllHistory() {
  const [prescriptionsResult, reportsResult] = await Promise.all([
    getAnalysisHistory(),
    getHealthReportsHistory()
  ])

  if (!prescriptionsResult.success || !reportsResult.success) {
    console.error(`[v0] History fetch failed. Prescriptions: ${prescriptionsResult.error}, Reports: ${reportsResult.error}`);
    return { success: false, error: prescriptionsResult.error || reportsResult.error || "Failed to fetch any history", data: [] }
  }

  const prescriptions = (prescriptionsResult.data || []).map((item: any) => ({
    ...item,
    type: "prescription"
  }))

  const reports = (reportsResult.data || []).map((item: any) => ({
    ...item,
    type: "health_report"
  }))

  const combined = [...prescriptions, ...reports].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )

  console.log(`[v0] Total history items: ${combined.length}`);
  return { success: true, data: combined }
}
