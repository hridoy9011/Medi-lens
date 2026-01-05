import { cleanJsonAIResponse } from "@/lib/clean-json"
import type { ExtractedData, AuthenticityResult, AnalysisAction, DrugInteraction } from "@/lib/types"

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "AIzaSyBIqcQ00T9ISXoBH2tn-PTgY67bB4i-QxM"
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent"

async function callGemini(contents: any[], retries = 3): Promise<string> {
  for (let attempt = 0; attempt < retries; attempt++) {
    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents,
        generationConfig: {
          temperature: 0.4,
          maxOutputTokens: 8192,
        },
      }),
    })

    if (response.ok) {
      const data = await response.json()
      return data.candidates?.[0]?.content?.parts?.[0]?.text || ""
    }

    // Handle rate limiting (429)
    if (response.status === 429) {
      const errorData = await response.json().catch(() => ({}))
      const retryAfter = errorData?.error?.details?.find(
        (d: any) => d["@type"] === "type.googleapis.com/google.rpc.RetryInfo",
      )?.retryDelay

      // If we have more retries left, wait and try again
      if (attempt < retries - 1) {
        const waitTime = retryAfter ? Number.parseInt(retryAfter) * 1000 : (attempt + 1) * 5000
        await new Promise((resolve) => setTimeout(resolve, Math.min(waitTime, 15000)))
        continue
      }

      // All retries exhausted
      throw new Error(
        "API_QUOTA_EXCEEDED: The AI service is currently at capacity. Please try again in a few minutes, or try with a smaller image.",
      )
    }

    // Other errors
    const error = await response.text()
    throw new Error(`Gemini API error (${response.status}): ${error}`)
  }

  throw new Error("Failed after multiple retry attempts")
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { action, imageUrl, ocrText, extractedData } = body as {
      action: AnalysisAction
      imageUrl?: string
      ocrText?: string
      extractedData?: ExtractedData
    }

    switch (action) {
      case "ocr":
        return await performOCR(imageUrl)
      case "extract":
        return await extractMedicines(ocrText)
      case "authenticity":
        return await checkAuthenticity(ocrText, extractedData)
      case "interactions":
        return await checkDrugInteractions(extractedData)
      default:
        return Response.json({ success: false, error: "Invalid action" }, { status: 400 })
    }
  } catch (error) {
    console.error("API error:", error)

    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    const isQuotaError = errorMessage.includes("API_QUOTA_EXCEEDED")

    return Response.json(
      {
        success: false,
        error: isQuotaError
          ? "The AI service is currently at capacity. Please wait a few minutes and try again."
          : errorMessage,
        isQuotaError,
      },
      { status: isQuotaError ? 429 : 500 },
    )
  }
}

async function performOCR(imageUrl?: string) {
  if (!imageUrl) {
    return Response.json({ success: false, error: "Image URL required" }, { status: 400 })
  }

  const prompt = `You are a prescription OCR expert.
Extract ALL readable text from the image exactly as it appears.
Return ONLY the raw text, preserving layout as much as possible.
Include:
- medicine names
- dosage
- frequency
- doctor name
- doctor degree (MBBS/MD/etc)
- BMDC or registration number
- signature labels
- hospital/clinic name
- date
- instructions
No explanations. No formatting. Only raw extracted text.`

  const imageResponse = await fetch(imageUrl)
  const imageBuffer = await imageResponse.arrayBuffer()
  const base64Image = Buffer.from(imageBuffer).toString("base64")
  const mimeType = imageResponse.headers.get("content-type") || "image/jpeg"

  const text = await callGemini([
    {
      parts: [
        { text: prompt },
        {
          inline_data: {
            mime_type: mimeType,
            data: base64Image,
          },
        },
      ],
    },
  ])

  return Response.json({ success: true, data: text })
}

async function extractMedicines(ocrText?: string) {
  if (!ocrText || ocrText.length < 10) {
    return Response.json({ success: false, error: "Valid OCR text required" }, { status: 400 })
  }

  const prompt = `Extract all structured medical data from the following OCR text.

Return ONLY valid JSON in this exact format (no markdown, no text):

{
  "doctor": "doctor name or null",
  "hospital": "hospital/clinic name or null",
  "date": "date or null",
  "medicines": [
    {
      "name": "medicine name",
      "dose": "dosage amount such as 500mg or null",
      "frequency": "how often to take such as 1+1+1 or once daily or null"
    }
  ]
}

If something is missing, return null for that field.

OCR text:
${ocrText}`

  const text = await callGemini([
    {
      parts: [{ text: prompt }],
    },
  ])

  const parsed = cleanJsonAIResponse<ExtractedData>(text)

  if (!parsed) {
    return Response.json({ success: false, error: "Failed to parse extraction result" }, { status: 500 })
  }

  return Response.json({ success: true, data: parsed })
}

async function checkAuthenticity(ocrText?: string, extractedData?: ExtractedData) {
  if (!ocrText || !extractedData) {
    return Response.json({ success: false, error: "OCR text and extracted data required" }, { status: 400 })
  }

  const prompt = `Analyze this prescription for authenticity. Evaluate:

1. Doctor credentials (MBBS/MD/etc)
2. Presence of registration/BMDC/license number
3. Signature or signature placeholder
4. Layout professionalism and formatting consistency
5. Medication logic and dosage plausibility
6. Any signs of tampering or digital manipulation (font mismatches, alignment issues)
7. Unusual or dangerous medicine combinations

OCR text:
${ocrText}

Extracted structured data:
${JSON.stringify(extractedData, null, 2)}

Return ONLY valid JSON in this format:

{
  "authenticity": "genuine" | "suspicious" | "fake",
  "reasons": ["reason 1", "reason 2", ...]
}`

  const text = await callGemini([
    {
      parts: [{ text: prompt }],
    },
  ])

  const parsed = cleanJsonAIResponse<AuthenticityResult>(text)

  if (!parsed) {
    return Response.json({ success: false, error: "Failed to parse authenticity result" }, { status: 500 })
  }

  return Response.json({ success: true, data: parsed })
}

async function checkDrugInteractions(extractedData?: ExtractedData) {
  if (!extractedData || extractedData.medicines.length < 2) {
    return Response.json({ success: true, data: [] })
  }

  const prompt = `Analyze these medications for potential harmful drug-drug interactions.
Consider only the medicine names provided.

Medicines:
${extractedData.medicines.map((m) => `- ${m.name} (${m.dose || "N/A"})`).join("\n")}

Return ONLY valid JSON in this format:
[
  {
    "drug_a": "medicine name 1",
    "drug_b": "medicine name 2",
    "severity": "mild" | "moderate" | "severe",
    "description": "Short explanation of the interaction and risk"
  }
]

If no significant interactions are found, return an empty array [].
Return ONLY JSON. No other text.`

  const text = await callGemini([
    {
      parts: [{ text: prompt }],
    },
  ])

  const parsed = cleanJsonAIResponse<DrugInteraction[]>(text)

  if (!parsed) {
    return Response.json({ success: false, error: "Failed to parse interactions result" }, { status: 500 })
  }

  return Response.json({ success: true, data: parsed })
}
