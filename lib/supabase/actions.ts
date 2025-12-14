"use server"

import { createClient } from "@/lib/supabase/server"
import type { ExtractedData, AuthenticityResult, DrugInteraction } from "@/lib/types"

export async function saveAnalysis({
  imageUrl,
  ocrText,
  extractedData,
  authenticity,
  interactions,
}: {
  imageUrl: string
  ocrText: string
  extractedData: ExtractedData
  authenticity: AuthenticityResult
  interactions: DrugInteraction[]
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: "Not authenticated" }
  }

  try {
    const imageData = imageUrl.split(",")[1]
    const binaryString = atob(imageData)
    const bytes = new Uint8Array(binaryString.length)
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i)
    }

    const fileName = `${user.id}/${Date.now()}.jpg`

    const { error: uploadError } = await supabase.storage.from("prescriptions").upload(fileName, bytes, {
      contentType: "image/jpeg",
      upsert: false,
    })

    if (uploadError) {
      console.error("Upload error:", uploadError.message)
      return { success: false, error: "Failed to upload image" }
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from("prescriptions").getPublicUrl(fileName)

    // Insert prescription record
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
      console.error("Prescription error:", prescriptionError.message)
      return { success: false, error: "Failed to save prescription" }
    }

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
      console.error("Extracted data error:", extractedError.message)
    }

    if (extractedDataRecord && extractedData.medicines.length > 0) {
      const { error: medicinesError } = await supabase.from("medicines").insert(
        extractedData.medicines.map((med) => ({
          extracted_data_id: extractedDataRecord.id,
          name: med.name,
          dose: med.dose,
          frequency: med.frequency,
        })),
      )

      if (medicinesError) {
        console.error("Medicines error:", medicinesError.message)
      }
    }

    const { error: authError } = await supabase.from("authenticity_results").insert({
      prescription_id: prescription.id,
      authenticity: authenticity.authenticity,
      reasons: authenticity.reasons,
    })

    if (authError) {
      console.error("Authenticity error:", authError.message)
    }

    // Insert drug interactions
    if (interactions.length > 0) {
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
        console.error("Interactions error:", interactionsError.message)
      }
    }

    return { success: true, prescriptionId: prescription.id }
  } catch (error) {
    console.error("Save analysis error:", error)
    return { success: false, error: "Failed to save analysis" }
  }
}

export async function getAnalysisHistory() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: "Not authenticated", data: [] }
  }

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
        )
      `)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Fetch history error:", error.message)
      return { success: false, error: "Failed to fetch history", data: [] }
    }

    return { success: true, data: prescriptions }
  } catch (error) {
    console.error("Get history error:", error)
    return { success: false, error: "Failed to get history", data: [] }
  }
}
